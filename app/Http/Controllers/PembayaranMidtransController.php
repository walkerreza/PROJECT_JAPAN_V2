<?php

namespace App\Http\Controllers;

use App\Models\LogTransaksi;
use App\Models\PaketPembayaran;
use App\Models\Pengguna;
use App\Models\Transaksi;
use App\Notifications\PurchaseReceiptNotification;
use App\Services\AksesLanggananService;
use App\Services\AksesPremiumService;
use App\Services\NotifikasiPenggunaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Database\QueryException;

class PembayaranMidtransController extends Controller
{
    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payment_plan_id' => ['required', 'exists:payment_plans,id'],
            'checkout_request_key' => ['required', 'uuid'],
        ]);

        abort_unless($request->user()?->role === 'user', 403);

        $serverKey = config('services.midtrans.server_key');
        abort_if(blank($serverKey), 422, 'Midtrans server key belum dikonfigurasi.');

        $plan = PaketPembayaran::query()
            ->with('programPembelajaran:id,title')
            ->where('is_active', true)
            ->where('price', '>', 0)
            ->findOrFail($validated['payment_plan_id']);
        $scope = app(AksesLanggananService::class)->scopeFromPlan($plan);

        [$transaction, $wasCreated] = $this->createOrReuseCheckout(
            $request,
            $plan,
            $scope,
            $validated['checkout_request_key']
        );
        $snap = $this->prepareSnapPayment($transaction, $request);

        if ($wasCreated) {
            app(NotifikasiPenggunaService::class)->kirimKePengguna(
                $request->user(),
                'payment_pending',
                'Pembayaran dibuat',
                'Selesaikan pembayaran agar akses belajar kamu aktif.',
                route('user.checkout', $transaction->transaction_code),
                ['transaction_id' => $transaction->id, 'source' => 'midtrans']
            );
        }

        return response()->json([
            'transaction_code' => $transaction->transaction_code,
            ...$snap,
        ]);
    }

    public function snap(Request $request, string $transactionCode): JsonResponse
    {
        abort_unless($request->user()?->role === 'user', 403);

        $transaction = Transaksi::query()
            ->with('paymentPlan', 'user')
            ->where('transaction_code', $transactionCode)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        abort_unless($transaction->status === 'pending', 422, 'Transaksi ini sudah tidak bisa dibayar ulang.');

        return response()->json($this->prepareSnapPayment($transaction, $request));
    }

    public function sync(Request $request, string $transactionCode): JsonResponse
    {
        abort_unless($request->user()?->role === 'user', 403);

        $transaction = Transaksi::where('transaction_code', $transactionCode)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $serverKey = config('services.midtrans.server_key');
        abort_if(blank($serverKey), 422, 'Midtrans server key belum dikonfigurasi.');

        $response = Http::withBasicAuth($serverKey, '')
            ->acceptJson()
            ->get($this->apiBaseUrl().'/v2/'.$transaction->transaction_code.'/status');

        if ($response->failed()) {
            abort(422, 'Gagal mengambil status transaksi dari Midtrans.');
        }

        abort_unless($this->payloadMatchesTransaction($transaction, $response->json()), 422, 'Respons Midtrans tidak sesuai transaksi.');
        $this->applyMidtransStatus($transaction, $response->json(), $request->user()->id, 'Sync status Midtrans dari frontend.');

        $freshTransaction = $transaction->fresh(['kloterBelajar.admin']);

        return response()->json([
            'status' => $transaction->fresh()->status,
            'subscription_status' => $request->user()->fresh()->subscription_status,
            'is_premium' => app(AksesPremiumService::class)->isPremium($request->user()->fresh()),
            'access_status' => app(AksesPremiumService::class)->statusAkses($request->user()->fresh()),
            'kloter' => $freshTransaction?->kloterBelajar ? [
                'id' => $freshTransaction->kloterBelajar->id,
                'nama' => $freshTransaction->kloterBelajar->nama,
                'kode' => $freshTransaction->kloterBelajar->kode,
                'admin_name' => $freshTransaction->kloterBelajar->admin?->username,
                'tanggal_mulai_label' => optional($freshTransaction->kloterBelajar->tanggal_mulai)->format('d M Y'),
            ] : null,
        ]);
    }

    public function cancel(Request $request, string $transactionCode): JsonResponse
    {
        abort_unless($request->user()?->role === 'user', 403);

        $transaction = Transaksi::query()
            ->where('transaction_code', $transactionCode)
            ->where('user_id', $request->user()->id)
            ->where('payment_method', 'midtrans')
            ->firstOrFail();

        abort_unless($transaction->status === 'pending', 422, 'Hanya transaksi yang menunggu pembayaran yang dapat dibatalkan.');

        $serverKey = config('services.midtrans.server_key');
        abort_if(blank($serverKey), 422, 'Midtrans server key belum dikonfigurasi.');

        $statusResponse = Http::withBasicAuth($serverKey, '')
            ->acceptJson()
            ->timeout(10)
            ->get($this->apiBaseUrl().'/v2/'.$transaction->transaction_code.'/status');

        if ($statusResponse->failed()) {
            abort(422, 'Gagal mengambil status transaksi dari Midtrans. Coba lagi beberapa saat lagi.');
        }

        abort_unless($this->payloadMatchesTransaction($transaction, $statusResponse->json()), 422, 'Respons Midtrans tidak sesuai transaksi.');
        $this->applyMidtransStatus($transaction, $statusResponse->json(), $request->user()->id, 'Status Midtrans diperiksa sebelum pembatalan user.');

        $transaction = $transaction->fresh();

        if ($transaction->status !== 'pending') {
            return response()->json([
                'status' => $transaction->status,
                'canceled' => false,
                'message' => 'Status pembayaran sudah berubah. Pesanan tidak dibatalkan.',
            ]);
        }

        $cancelResponse = Http::withBasicAuth($serverKey, '')
            ->acceptJson()
            ->timeout(10)
            ->post($this->apiBaseUrl().'/v2/'.$transaction->transaction_code.'/cancel');

        if ($cancelResponse->failed()) {
            $this->refreshStatusAfterCancelFailure($transaction, $request->user()->id);
            $transaction = $transaction->fresh();

            if ($transaction->status !== 'pending') {
                return response()->json([
                    'status' => $transaction->status,
                    'canceled' => false,
                    'message' => 'Status pembayaran sudah berubah. Pesanan tidak dibatalkan.',
                ]);
            }

            abort(422, 'Midtrans belum dapat membatalkan pesanan ini. Coba lagi beberapa saat lagi.');
        }

        abort_unless($this->payloadMatchesTransaction($transaction, $cancelResponse->json()), 422, 'Respons pembatalan Midtrans tidak sesuai transaksi.');
        $this->applyMidtransStatus($transaction, $cancelResponse->json(), $request->user()->id, 'Pesanan dibatalkan oleh user melalui Midtrans.');

        return response()->json([
            'status' => $transaction->fresh()->status,
            'canceled' => true,
            'message' => 'Pesanan berhasil dibatalkan.',
        ]);
    }

    public function notification(Request $request): JsonResponse
    {
        $serverKey = config('services.midtrans.server_key');
        abort_if(blank($serverKey), 422, 'Midtrans server key belum dikonfigurasi.');

        $payload = $request->all();
        $orderId = (string) ($payload['order_id'] ?? '');
        $statusCode = (string) ($payload['status_code'] ?? '');
        $grossAmount = (string) ($payload['gross_amount'] ?? '');
        $signature = (string) ($payload['signature_key'] ?? '');

        $expectedSignature = hash('sha512', $orderId.$statusCode.$grossAmount.$serverKey);
        abort_unless(hash_equals($expectedSignature, $signature), 403, 'Invalid Midtrans signature.');

        $transaction = Transaksi::where('transaction_code', $orderId)->firstOrFail();
        abort_unless($this->payloadMatchesTransaction($transaction, $payload), 422, 'Respons Midtrans tidak sesuai transaksi.');
        $this->applyMidtransStatus($transaction, $payload, null, 'Callback Midtrans diterima.');

        return response()->json(['message' => 'OK']);
    }

    public function reconcilePendingTransaction(Transaksi $transaction): bool
    {
        $serverKey = config('services.midtrans.server_key');

        if (blank($serverKey)) {
            Log::warning('Rekonsiliasi Midtrans dilewati karena server key belum dikonfigurasi.');

            return false;
        }

        $response = Http::withBasicAuth($serverKey, '')
            ->acceptJson()
            ->timeout(10)
            ->retry(2, 500)
            ->get($this->apiBaseUrl().'/v2/'.$transaction->transaction_code.'/status');

        if ($response->failed()) {
            Log::warning('Rekonsiliasi Midtrans gagal mengambil status.', [
                'transaction_id' => $transaction->id,
                'http_status' => $response->status(),
            ]);

            return false;
        }

        if (! $this->payloadMatchesTransaction($transaction, $response->json())) {
            Log::warning('Rekonsiliasi Midtrans menerima respons yang tidak sesuai transaksi.', [
                'transaction_id' => $transaction->id,
                'transaction_code' => $transaction->transaction_code,
            ]);

            return false;
        }

        $this->applyMidtransStatus($transaction, $response->json(), null, 'Rekonsiliasi transaksi pending Midtrans.');

        return true;
    }

    private function refreshStatusAfterCancelFailure(Transaksi $transaction, ?int $changedBy): void
    {
        $serverKey = config('services.midtrans.server_key');

        if (blank($serverKey)) {
            return;
        }

        $response = Http::withBasicAuth($serverKey, '')
            ->acceptJson()
            ->timeout(10)
            ->get($this->apiBaseUrl().'/v2/'.$transaction->transaction_code.'/status');

        if ($response->successful() && $this->payloadMatchesTransaction($transaction, $response->json())) {
            $this->applyMidtransStatus($transaction, $response->json(), $changedBy, 'Status Midtrans diperiksa setelah pembatalan gagal.');
        }
    }

    private function applyMidtransStatus(Transaksi $transaction, array $payload, ?int $changedBy, string $notes): void
    {
        $newStatus = $this->mapStatus($payload['transaction_status'] ?? null, $payload['fraud_status'] ?? null);

        DB::transaction(function () use ($transaction, $newStatus, $payload, $changedBy, $notes) {
            $transaction = Transaksi::query()->lockForUpdate()->findOrFail($transaction->id);
            $oldStatus = $transaction->status;

            if (! $this->canTransitionStatus($oldStatus, $newStatus)) {
                Log::warning('Status Midtrans yang terlambat atau tidak valid diabaikan.', [
                    'transaction_id' => $transaction->id,
                    'old_status' => $oldStatus,
                    'new_status' => $newStatus,
                ]);

                return;
            }

            $transaction->update([
                'status' => $newStatus,
                'processed_at' => $newStatus === 'pending' ? null : now(),
                'notes' => 'Midtrans status: '.($payload['transaction_status'] ?? '-').'; fraud: '.($payload['fraud_status'] ?? '-'),
            ]);

            if ($newStatus === 'success' && $oldStatus !== 'success') {
                $activatedTransaction = $transaction->fresh(['paymentPlan.programPembelajaran', 'programPembelajaran', 'user']);
                app(AksesLanggananService::class)->activateFromTransaction($activatedTransaction);

                if ($activatedTransaction->user) {
                    $scopeLabel = app(AksesLanggananService::class)->labelScope(
                        $activatedTransaction->scope_type,
                        $activatedTransaction->programPembelajaran?->title ?? $activatedTransaction->paymentPlan?->programPembelajaran?->title
                    );

                    app(NotifikasiPenggunaService::class)->kirimKePengguna(
                        $activatedTransaction->user,
                        'payment_success',
                        'Pembayaran berhasil',
                        "Akses {$scopeLabel} sudah aktif.",
                        route('user.kelas.index'),
                        ['transaction_id' => $activatedTransaction->id, 'source' => 'midtrans'],
                        'payment',
                        'success',
                        false,
                    );

                    DB::afterCommit(function () use ($activatedTransaction, $scopeLabel): void {
                        try {
                            $activatedTransaction->user->notify(new PurchaseReceiptNotification(
                                $activatedTransaction->transaction_code,
                                $activatedTransaction->paymentPlan?->name ?? 'Akses belajar',
                                $scopeLabel,
                                (int) $activatedTransaction->amount,
                                optional($activatedTransaction->processed_at)->format('d M Y H:i') ?? now()->format('d M Y H:i'),
                            ));
                        } catch (\Throwable $exception) {
                            Log::error('Invoice pembayaran tidak dapat dimasukkan ke antrean.', [
                                'transaction_id' => $activatedTransaction->id,
                                'exception' => $exception->getMessage(),
                            ]);
                        }
                    });
                }

                $this->notifySuperadminTransaction($activatedTransaction, 'payment_success', 'Pembayaran Midtrans berhasil', 'success');
            }

            if (in_array($newStatus, ['failed', 'expired'], true) && $oldStatus !== $newStatus) {
                $failedTransaction = $transaction->fresh(['user']);
                if ($failedTransaction->user) {
                    app(NotifikasiPenggunaService::class)->kirimKePengguna(
                        $failedTransaction->user,
                        $newStatus === 'expired' ? 'payment_expired' : 'payment_failed',
                        $newStatus === 'expired' ? 'Pembayaran kedaluwarsa' : 'Pembayaran gagal',
                        $newStatus === 'expired'
                            ? 'Waktu pembayaran habis. Silakan buat checkout baru jika masih ingin membuka akses.'
                            : 'Pembayaran belum berhasil. Silakan coba lagi atau pilih metode lain.',
                        route('pricing'),
                        ['transaction_id' => $failedTransaction->id, 'source' => 'midtrans'],
                        'payment',
                        'danger',
                        false
                    );
                }

                $this->notifySuperadminTransaction(
                    $failedTransaction,
                    $newStatus === 'expired' ? 'payment_expired' : 'payment_failed',
                    $newStatus === 'expired' ? 'Pembayaran Midtrans kedaluwarsa' : 'Pembayaran Midtrans gagal',
                    'danger'
                );
            }

            if ($newStatus === 'refunded' && $oldStatus !== 'refunded') {
                $refundedTransaction = $transaction->fresh(['subscription.user', 'user']);
                app(AksesLanggananService::class)->cancelFromTransaction($refundedTransaction);

                if ($refundedTransaction->user) {
                    app(NotifikasiPenggunaService::class)->kirimKePengguna(
                        $refundedTransaction->user,
                        'payment_refunded',
                        'Pembayaran dibatalkan',
                        'Pembayaran dibatalkan atau dikembalikan. Akses dari transaksi ini telah dinonaktifkan.',
                        route('pricing'),
                        ['transaction_id' => $refundedTransaction->id, 'source' => 'midtrans'],
                        'payment',
                        'warning',
                        false
                    );
                }

                $this->notifySuperadminTransaction(
                    $refundedTransaction,
                    'payment_refunded',
                    'Pembayaran Midtrans dibatalkan atau direfund',
                    'warning'
                );
            }

            if ($oldStatus !== $newStatus || $notes !== 'Sync status Midtrans dari frontend.') {
                LogTransaksi::create([
                    'transaction_id' => $transaction->id,
                    'changed_by' => $changedBy,
                    'old_status' => $oldStatus,
                    'new_status' => $newStatus,
                    'notes' => $notes,
                ]);
            }
        });
    }

    private function createOrReuseCheckout(Request $request, PaketPembayaran $plan, array $scope, string $checkoutRequestKey): array
    {
        try {
            return DB::transaction(function () use ($request, $plan, $scope, $checkoutRequestKey) {
                Pengguna::query()
                    ->whereKey($request->user()->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $existing = Transaksi::query()
                    ->where('checkout_request_key', $checkoutRequestKey)
                    ->lockForUpdate()
                    ->first();

                if ($existing) {
                    $this->assertReusableCheckout($existing, $request, $plan);

                    return [$existing, false];
                }

                $pendingTransaction = Transaksi::query()
                    ->where('user_id', $request->user()->id)
                    ->where('payment_plan_id', $plan->id)
                    ->where('payment_method', 'midtrans')
                    ->where('status', 'pending')
                    ->latest('id')
                    ->lockForUpdate()
                    ->first();

                if ($pendingTransaction) {
                    return [$pendingTransaction, false];
                }

                $transaction = Transaksi::create([
                    'transaction_code' => 'MID-'.strtoupper(Str::random(10)),
                    'checkout_request_key' => $checkoutRequestKey,
                    'user_id' => $request->user()->id,
                    'payment_plan_id' => $plan->id,
                    ...$scope,
                    'amount' => $plan->price,
                    'payment_method' => 'midtrans',
                    'status' => 'pending',
                    'notes' => 'Midtrans Snap checkout dibuat dari halaman pricing.',
                ]);

                LogTransaksi::create([
                    'transaction_id' => $transaction->id,
                    'changed_by' => $request->user()->id,
                    'new_status' => 'pending',
                    'notes' => 'Midtrans Snap checkout dibuat.',
                ]);

                return [$transaction, true];
            }, 3);
        } catch (QueryException $exception) {
            $existing = Transaksi::query()
                ->where('checkout_request_key', $checkoutRequestKey)
                ->first();

            if (! $existing) {
                throw $exception;
            }

            $this->assertReusableCheckout($existing, $request, $plan);

            return [$existing, false];
        }
    }

    private function assertReusableCheckout(Transaksi $transaction, Request $request, PaketPembayaran $plan): void
    {
        abort_unless($transaction->user_id === $request->user()->id, 403);
        abort_unless($transaction->payment_plan_id === $plan->id, 422, 'Checkout intent tidak sesuai paket pembayaran.');
        abort_if($transaction->status !== 'pending', 409, 'Checkout sebelumnya sudah selesai. Buat checkout baru untuk melanjutkan.');
    }

    private function prepareSnapPayment(Transaksi $transaction, Request $request): array
    {
        $transaction->loadMissing('paymentPlan');

        if ($transaction->midtrans_snap_token) {
            return [
                'snap_token' => $transaction->midtrans_snap_token,
                'redirect_url' => $transaction->midtrans_snap_redirect_url,
            ];
        }

        $serverKey = config('services.midtrans.server_key');
        abort_if(blank($serverKey), 422, 'Midtrans server key belum dikonfigurasi.');
        abort_if(! $transaction->paymentPlan, 422, 'Paket pembayaran untuk transaksi ini tidak ditemukan.');

        $payload = [
            'transaction_details' => [
                'order_id' => $transaction->transaction_code,
                'gross_amount' => (int) $transaction->amount,
            ],
            'customer_details' => [
                'first_name' => $request->user()->username ?: $request->user()->name,
                'email' => $request->user()->email,
            ],
            'item_details' => [[
                'id' => (string) $transaction->paymentPlan->id,
                'price' => (int) $transaction->amount,
                'quantity' => 1,
                'name' => Str::limit($transaction->paymentPlan->name, 50, ''),
            ]],
            'callbacks' => [
                'finish' => route('user.checkout', $transaction->transaction_code),
            ],
            'credit_card' => [
                'secure' => (bool) config('services.midtrans.is_3ds', true),
            ],
        ];

        $response = Http::withBasicAuth($serverKey, '')
            ->acceptJson()
            ->withHeaders([
                'Idempotency-Key' => 'snap-'.$transaction->transaction_code,
            ])
            ->post($this->snapBaseUrl().'/snap/v1/transactions', $payload);

        if ($response->failed()) {
            abort(422, 'Gagal menyiapkan pembayaran Midtrans. Coba beberapa saat lagi.');
        }

        return DB::transaction(function () use ($transaction, $response) {
            $lockedTransaction = Transaksi::query()->lockForUpdate()->findOrFail($transaction->id);

            if (! $lockedTransaction->midtrans_snap_token) {
                $lockedTransaction->update([
                    'midtrans_snap_token' => $response->json('token'),
                    'midtrans_snap_redirect_url' => $response->json('redirect_url'),
                ]);
            }

            return [
                'snap_token' => $lockedTransaction->midtrans_snap_token,
                'redirect_url' => $lockedTransaction->midtrans_snap_redirect_url,
            ];
        });
    }

    private function mapStatus(?string $transactionStatus, ?string $fraudStatus): string
    {
        return match ($transactionStatus) {
            'capture' => match ($fraudStatus) {
                'accept' => 'success',
                'challenge' => 'pending',
                'deny' => 'failed',
                default => 'pending',
            },
            'settlement' => 'success',
            'pending', 'authorize' => 'pending',
            'deny', 'failure' => 'failed',
            'cancel' => 'canceled',
            'expire' => 'expired',
            'refund', 'partial_refund', 'chargeback' => 'refunded',
            default => 'pending',
        };
    }

    private function payloadMatchesTransaction(Transaksi $transaction, array $payload): bool
    {
        return (string) ($payload['order_id'] ?? '') === $transaction->transaction_code
            && (int) ($payload['gross_amount'] ?? -1) === (int) $transaction->amount;
    }

    private function canTransitionStatus(string $oldStatus, string $newStatus): bool
    {
        if (in_array($oldStatus, ['refunded', 'canceled'], true)) {
            return $newStatus === $oldStatus;
        }

        return $oldStatus !== 'success'
            || in_array($newStatus, ['success', 'refunded'], true);
    }

    private function notifySuperadminTransaction(Transaksi $transaction, string $type, string $title, string $severity): void
    {
        $userLabel = $transaction->user?->username ?: $transaction->user?->email ?: 'User';

        app(NotifikasiPenggunaService::class)->kirimKeRole(
            'superadmin',
            $type,
            $title,
            "{$userLabel} - {$transaction->transaction_code}",
            route('superadmin.payments'),
            [
                'transaction_id' => $transaction->id,
                'user_id' => $transaction->user_id,
                'source' => 'midtrans',
            ],
            'payment',
            $severity,
            true
        );
    }

    private function snapBaseUrl(): string
    {
        return config('services.midtrans.is_production')
            ? 'https://app.midtrans.com'
            : 'https://app.sandbox.midtrans.com';
    }

    private function apiBaseUrl(): string
    {
        return config('services.midtrans.is_production')
            ? 'https://api.midtrans.com'
            : 'https://api.sandbox.midtrans.com';
    }
}
