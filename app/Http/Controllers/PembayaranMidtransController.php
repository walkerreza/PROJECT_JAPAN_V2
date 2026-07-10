<?php

namespace App\Http\Controllers;

use App\Models\LogTransaksi;
use App\Models\PaketPembayaran;
use App\Models\Transaksi;
use App\Services\AksesLanggananService;
use App\Services\AksesPremiumService;
use App\Services\NotifikasiPenggunaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class PembayaranMidtransController extends Controller
{
    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payment_plan_id' => ['required', 'exists:payment_plans,id'],
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

        $transaction = DB::transaction(function () use ($request, $plan, $scope) {
            $transaction = Transaksi::create([
                'transaction_code' => 'MID-' . strtoupper(Str::random(10)),
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

            return $transaction;
        });

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
                'id' => (string) $plan->id,
                'price' => (int) $plan->price,
                'quantity' => 1,
                'name' => Str::limit($plan->name, 50, ''),
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
            ->post($this->snapBaseUrl() . '/snap/v1/transactions', $payload);

        if ($response->failed()) {
            $transaction->update([
                'status' => 'failed',
                'processed_at' => now(),
                'notes' => 'Gagal membuat Snap token: ' . $response->body(),
            ]);

            LogTransaksi::create([
                'transaction_id' => $transaction->id,
                'changed_by' => $request->user()->id,
                'old_status' => 'pending',
                'new_status' => 'failed',
                'notes' => 'Gagal membuat Snap token.',
            ]);

            abort(422, 'Gagal membuat transaksi Midtrans. Cek konfigurasi Midtrans sandbox.');
        }

        app(NotifikasiPenggunaService::class)->kirimKePengguna(
            $request->user(),
            'payment_pending',
            'Pembayaran dibuat',
            'Selesaikan pembayaran agar akses belajar kamu aktif.',
            route('user.checkout', $transaction->transaction_code),
            ['transaction_id' => $transaction->id, 'source' => 'midtrans']
        );

        return response()->json([
            'transaction_code' => $transaction->transaction_code,
            'snap_token' => $response->json('token'),
            'redirect_url' => $response->json('redirect_url'),
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

        $serverKey = config('services.midtrans.server_key');
        abort_if(blank($serverKey), 422, 'Midtrans server key belum dikonfigurasi.');

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
                'price' => (int) $transaction->paymentPlan->price,
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
            ->post($this->snapBaseUrl() . '/snap/v1/transactions', $payload);

        if ($response->failed()) {
            abort(422, 'Gagal menyiapkan pembayaran Midtrans. Coba beberapa saat lagi.');
        }

        return response()->json([
            'snap_token' => $response->json('token'),
            'redirect_url' => $response->json('redirect_url'),
        ]);
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
            ->get($this->apiBaseUrl() . '/v2/' . $transaction->transaction_code . '/status');

        if ($response->failed()) {
            abort(422, 'Gagal mengambil status transaksi dari Midtrans.');
        }

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

    public function notification(Request $request): JsonResponse
    {
        $serverKey = config('services.midtrans.server_key');
        abort_if(blank($serverKey), 422, 'Midtrans server key belum dikonfigurasi.');

        $payload = $request->all();
        $orderId = (string) ($payload['order_id'] ?? '');
        $statusCode = (string) ($payload['status_code'] ?? '');
        $grossAmount = (string) ($payload['gross_amount'] ?? '');
        $signature = (string) ($payload['signature_key'] ?? '');

        $expectedSignature = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);
        abort_unless(hash_equals($expectedSignature, $signature), 403, 'Invalid Midtrans signature.');

        $transaction = Transaksi::where('transaction_code', $orderId)->firstOrFail();
        $this->applyMidtransStatus($transaction, $payload, null, 'Callback Midtrans diterima.');

        return response()->json(['message' => 'OK']);
    }

    private function applyMidtransStatus(Transaksi $transaction, array $payload, ?int $changedBy, string $notes): void
    {
        $oldStatus = $transaction->status;
        $newStatus = $this->mapStatus($payload['transaction_status'] ?? null, $payload['fraud_status'] ?? null);

        DB::transaction(function () use ($transaction, $oldStatus, $newStatus, $payload, $changedBy, $notes) {
            $transaction->update([
                'status' => $newStatus,
                'processed_at' => $newStatus === 'pending' ? null : now(),
                'notes' => 'Midtrans status: ' . ($payload['transaction_status'] ?? '-') . '; fraud: ' . ($payload['fraud_status'] ?? '-'),
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
                        ['transaction_id' => $activatedTransaction->id, 'source' => 'midtrans']
                    );
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
                        true
                    );
                }

                $this->notifySuperadminTransaction(
                    $failedTransaction,
                    $newStatus === 'expired' ? 'payment_expired' : 'payment_failed',
                    $newStatus === 'expired' ? 'Pembayaran Midtrans kedaluwarsa' : 'Pembayaran Midtrans gagal',
                    'danger'
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

    private function mapStatus(?string $transactionStatus, ?string $fraudStatus): string
    {
        return match ($transactionStatus) {
            'capture' => $fraudStatus === 'challenge' ? 'pending' : 'success',
            'settlement' => 'success',
            'pending' => 'pending',
            'deny', 'cancel', 'failure' => 'failed',
            'expire' => 'expired',
            default => 'pending',
        };
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
