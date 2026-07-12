<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Models\PaketPembayaran;
use App\Models\Langganan;
use App\Models\Transaksi;
use App\Models\LogTransaksi;
use App\Models\Pengguna;
use App\Models\KodeAkses;
use App\Models\KloterBelajar;
use App\Models\ProgramPembelajaran;
use App\Services\AksesLanggananService;
use App\Services\NotifikasiPenggunaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SuperAdminPembayaranController extends SuperAdminDasarController
{
    public function __invoke(Request $request)
    {
        $filters = [
            'search' => (string) $request->string('search'),
            'status' => $request->string('status')->value() ?: 'all',
            'payment_method' => $request->string('payment_method')->value() ?: 'all',
        ];

        $transactions = Transaksi::with(['user:id,username,email', 'paymentPlan:id,name', 'programPembelajaran:id,title'])
            ->when($filters['search'], function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('transaction_code', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($userQuery) => $userQuery
                            ->where('username', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%"));
                });
            })
            ->when($filters['status'] !== 'all', fn ($query) => $query->where('status', $filters['status']))
            ->when($filters['payment_method'] !== 'all', fn ($query) => $query->where('payment_method', $filters['payment_method']))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('SuperAdmin/Pemasukan/Pemasukan', [
            'stats' => [
                $this->stat('Pending Payments', number_format(Transaksi::where('status', 'pending')->count()), 'P'),
                $this->stat('Success Transactions', number_format(Transaksi::where('status', 'success')->count()), 'S'),
                $this->stat('Active Premium Users', number_format(Langganan::where('status', 'active')->distinct('user_id')->count('user_id')), 'U'),
                $this->stat('Revenue', 'Rp ' . number_format((int) Transaksi::where('status', 'success')->sum('amount')), '$'),
            ],
            'transactions' => $transactions->through(fn (Transaksi $transaction) => [
                'id' => $transaction->id,
                'transaction_code' => $transaction->transaction_code,
                'user_name' => $transaction->user?->username ?? '-',
                'user_email' => $transaction->user?->email ?? '-',
                'payment_plan_id' => $transaction->payment_plan_id,
                'plan_name' => $transaction->paymentPlan?->name ?? '-',
                'scope_type' => $transaction->scope_type ?? AksesLanggananService::SCOPE_GLOBAL,
                'scope_label' => app(AksesLanggananService::class)->labelScope($transaction->scope_type, $transaction->programPembelajaran?->title),
                'program_name' => $transaction->programPembelajaran?->title,
                'amount' => $transaction->amount,
                'amount_formatted' => 'Rp ' . number_format($transaction->amount),
                'payment_method' => $transaction->payment_method,
                'status' => $transaction->status,
                'notes' => $transaction->notes,
                'processed_at' => optional($transaction->processed_at)->diffForHumans(),
                'created_at' => optional($transaction->created_at)->format('d M Y H:i'),
                'proof_url' => $transaction->proof_of_payment_path ? asset("storage/{$transaction->proof_of_payment_path}") : null,
            ]),
            'plans' => PaketPembayaran::query()
                ->with('programPembelajaran:id,title')
                ->orderBy('price')
                ->get(['id', 'name', 'slug', 'scope_type', 'program_pembelajaran_id', 'description', 'price', 'duration_days', 'features', 'is_active'])
                ->map(fn (PaketPembayaran $plan) => [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'scope_type' => $plan->scope_type ?? AksesLanggananService::SCOPE_GLOBAL,
                    'program_pembelajaran_id' => $plan->program_pembelajaran_id,
                    'scope_label' => app(AksesLanggananService::class)->labelScope($plan->scope_type, $plan->programPembelajaran?->title),
                    'program_name' => $plan->programPembelajaran?->title,
                    'description' => $plan->description,
                    'price' => $plan->price,
                    'price_formatted' => 'Rp ' . number_format($plan->price),
                    'duration_days' => $plan->duration_days,
                    'features' => collect($plan->features ?? [])->implode("\n"),
                    'is_active' => $plan->is_active,
                ]),
            'users' => Pengguna::where('role', 'user')->orderBy('username')->get(['id', 'username', 'email'])->map(fn (Pengguna $user) => [
                'id' => $user->id,
                'label' => "{$user->username} ({$user->email})",
            ]),
            'programs' => ProgramPembelajaran::query()
                ->where('status', 'published')
                ->orderBy('sort_order')
                ->orderBy('title')
                ->get(['id', 'title'])
                ->map(fn (ProgramPembelajaran $program) => [
                    'id' => $program->id,
                    'title' => $program->title,
                ]),
            'accessKeys' => KodeAkses::with(['paymentPlan:id,name', 'programPembelajaran:id,title', 'kloterBelajar:id,nama,kode'])
                ->latest()
                ->take(12)
                ->get()
                ->map(fn (KodeAkses $key) => [
                    'id' => $key->id,
                    'code' => $key->code,
                    'name' => $key->name,
                    'plan_name' => $key->paymentPlan?->name ?? 'Access Key Premium',
                    'scope_type' => $key->scope_type ?? AksesLanggananService::SCOPE_GLOBAL,
                    'scope_label' => app(AksesLanggananService::class)->labelScope($key->scope_type, $key->programPembelajaran?->title),
                    'program_name' => $key->programPembelajaran?->title,
                    'kloter_name' => $key->kloterBelajar?->nama,
                    'duration_days' => $key->duration_days,
                    'usage' => "{$key->used_count}/{$key->max_uses}",
                    'status' => $key->status,
                    'expires_at' => optional($key->expires_at)->format('d M Y H:i'),
                    'created_at' => optional($key->created_at)->format('d M Y H:i'),
                ]),
            'filters' => $filters,
        ]);
    }

    public function storePlan(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:payment_plans,slug'],
            'description' => ['nullable', 'string', 'max:500'],
            'price' => ['required', 'integer', 'min:0'],
            'duration_days' => ['required', 'integer', 'min:1'],
            'scope_type' => ['required', Rule::in([AksesLanggananService::SCOPE_GLOBAL, AksesLanggananService::SCOPE_PROGRAM])],
            'kloter_belajar_id' => ['nullable', 'exists:kloter_belajar,id'],
            'program_pembelajaran_id' => [
                Rule::requiredIf($request->input('scope_type') === AksesLanggananService::SCOPE_PROGRAM && ! $request->filled('kloter_belajar_id')),
                'nullable',
                'exists:program_pembelajaran,id',
            ],
            'features' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $scope = app(AksesLanggananService::class)->normalizeScope(
            $validated['scope_type'],
            $validated['program_pembelajaran_id'] ?? null
        );

        $plan = PaketPembayaran::create([
            ...$validated,
            ...$scope,
            'features' => $validated['features']
                ? collect(explode("\n", $validated['features']))->map(fn ($item) => trim($item))->filter()->values()->all()
                : [],
        ]);

        $this->logActivity($request, 'payment.plan_created', 'payment_plan', $plan->id, "Membuat payment plan {$plan->name}");

        return redirect()->back()->with('success', 'Payment plan berhasil dibuat');
    }

    public function updatePlan(Request $request, PaketPembayaran $plan)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', Rule::unique('payment_plans', 'slug')->ignore($plan->id)],
            'description' => ['nullable', 'string', 'max:500'],
            'price' => ['required', 'integer', 'min:0'],
            'duration_days' => ['required', 'integer', 'min:1'],
            'scope_type' => ['required', Rule::in([AksesLanggananService::SCOPE_GLOBAL, AksesLanggananService::SCOPE_PROGRAM])],
            'program_pembelajaran_id' => [
                Rule::requiredIf($request->input('scope_type') === AksesLanggananService::SCOPE_PROGRAM),
                'nullable',
                'exists:program_pembelajaran,id',
            ],
            'features' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $scope = app(AksesLanggananService::class)->normalizeScope(
            $validated['scope_type'],
            $validated['program_pembelajaran_id'] ?? null
        );

        $plan->update([
            ...$validated,
            ...$scope,
            'features' => $validated['features']
                ? collect(explode("\n", $validated['features']))->map(fn ($item) => trim($item))->filter()->values()->all()
                : [],
        ]);

        $this->logActivity($request, 'payment.plan_updated', 'payment_plan', $plan->id, "Mengubah payment plan {$plan->name}");

        return redirect()->back()->with('success', 'Payment plan berhasil diperbarui');
    }

    public function storeTransaction(Request $request)
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'payment_plan_id' => ['required', 'exists:payment_plans,id'],
            'amount' => ['required', 'integer', 'min:0'],
            'payment_method' => ['required', 'in:manual,bank_transfer,e-wallet,credit_card,midtrans'],
            'status' => ['required', 'in:pending,success,failed,expired'],
            'notes' => ['nullable', 'string'],
            'proof_of_payment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:2048'],
        ]);

        $proofPath = $request->hasFile('proof_of_payment')
            ? $request->file('proof_of_payment')->store('uploads/payments/proofs', 'public')
            : null;
        $plan = PaketPembayaran::findOrFail($validated['payment_plan_id']);
        $scope = app(AksesLanggananService::class)->scopeFromPlan($plan);

        $transaction = DB::transaction(function () use ($request, $validated, $proofPath, $scope) {
            $transaction = Transaksi::create([
                'transaction_code' => 'TRX-' . strtoupper(Str::random(10)),
                'user_id' => $validated['user_id'],
                'payment_plan_id' => $validated['payment_plan_id'],
                ...$scope,
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
                'proof_of_payment_path' => $proofPath,
                'processed_at' => $validated['status'] === 'pending' ? null : now(),
            ]);

            if ($validated['status'] === 'success') {
                $activatedTransaction = $transaction->fresh(['paymentPlan.programPembelajaran', 'programPembelajaran', 'user']);
                app(AksesLanggananService::class)->activateFromTransaction($activatedTransaction);
                $this->notifyAccessActivated($activatedTransaction, 'Pembayaran disetujui', 'manual_transaction');
            }

            LogTransaksi::create([
                'transaction_id' => $transaction->id,
                'changed_by' => $request->user()->id,
                'new_status' => $transaction->status,
                'notes' => $transaction->notes,
            ]);

            return $transaction;
        });

        if ($transaction->status === 'pending' && $transaction->user) {
            app(NotifikasiPenggunaService::class)->kirimKePengguna(
                $transaction->user,
                'payment_pending',
                'Transaksi menunggu pembayaran',
                'Transaksi premium kamu sudah dibuat dan sedang menunggu pembayaran.',
                route('user.kelas.index'),
                ['transaction_id' => $transaction->id, 'source' => 'manual_transaction']
            );
        }

        $this->logActivity($request, 'payment.transaction_created', 'transaction', $transaction->id, "Membuat transaksi {$transaction->transaction_code}");

        return redirect()->back()->with('success', 'Transaksi berhasil dibuat');
    }

    public function approve(Request $request, Transaksi $transaction)
    {
        $request->validate([
            'notes' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($request, $transaction) {
            $oldStatus = $transaction->status;

            $transaction->update([
                'status' => 'success',
                'processed_at' => now(),
                'notes' => $request->input('notes') ?: $transaction->notes,
            ]);

            $activatedTransaction = $transaction->fresh(['paymentPlan.programPembelajaran', 'programPembelajaran', 'user']);
            app(AksesLanggananService::class)->activateFromTransaction($activatedTransaction);
            $this->notifyAccessActivated($activatedTransaction, 'Pembayaran disetujui', 'manual_approval');

            LogTransaksi::create([
                'transaction_id' => $transaction->id,
                'changed_by' => $request->user()->id,
                'old_status' => $oldStatus,
                'new_status' => 'success',
                'notes' => $request->input('notes'),
            ]);
        });

        $this->logActivity($request, 'payment.transaction_approved', 'transaction', $transaction->id, "Approve transaksi {$transaction->transaction_code}");

        return redirect()->back()->with('success', 'Transaksi berhasil di-approve');
    }

    public function reject(Request $request, Transaksi $transaction)
    {
        $validated = $request->validate([
            'notes' => ['required', 'string'],
        ]);

        $oldStatus = $transaction->status;

        $transaction->update([
            'status' => 'failed',
            'processed_at' => now(),
            'notes' => $validated['notes'],
        ]);

        LogTransaksi::create([
            'transaction_id' => $transaction->id,
            'changed_by' => $request->user()->id,
            'old_status' => $oldStatus,
            'new_status' => 'failed',
            'notes' => $validated['notes'],
        ]);

        $this->logActivity($request, 'payment.transaction_rejected', 'transaction', $transaction->id, "Reject transaksi {$transaction->transaction_code}");

        return redirect()->back()->with('success', 'Transaksi berhasil ditolak');
    }

    public function storeAccessKey(Request $request)
    {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'payment_plan_id' => ['nullable', 'exists:payment_plans,id'],
            'duration_days' => ['required', 'integer', 'min:1', 'max:366'],
            'max_uses' => ['required', 'integer', 'min:1', 'max:500'],
            'scope_type' => ['required', Rule::in([AksesLanggananService::SCOPE_GLOBAL, AksesLanggananService::SCOPE_PROGRAM])],
            'program_pembelajaran_id' => [
                Rule::requiredIf($request->input('scope_type') === AksesLanggananService::SCOPE_PROGRAM),
                'nullable',
                'exists:program_pembelajaran,id',
            ],
            'expires_at' => ['nullable', 'date', 'after:now'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $plan = ! empty($validated['payment_plan_id'])
            ? PaketPembayaran::findOrFail($validated['payment_plan_id'])
            : app(AksesLanggananService::class)->defaultAccessKeyPlan();
        $kloter = ! empty($validated['kloter_belajar_id'])
            ? KloterBelajar::findOrFail($validated['kloter_belajar_id'])
            : null;
        $scope = $kloter
            ? app(AksesLanggananService::class)->normalizeScope(AksesLanggananService::SCOPE_PROGRAM, $kloter->program_pembelajaran_id)
            : (! empty($validated['payment_plan_id'])
            ? app(AksesLanggananService::class)->scopeFromPlan($plan)
            : app(AksesLanggananService::class)->normalizeScope($validated['scope_type'], $validated['program_pembelajaran_id'] ?? null));

        $accessKey = KodeAkses::create([
            'payment_plan_id' => $plan->id,
            ...$scope,
            'kloter_belajar_id' => $kloter?->id,
            'created_by' => $request->user()->id,
            'code' => $this->generateAccessCode(),
            'name' => $validated['name'] ?? null,
            'duration_days' => $validated['duration_days'],
            'max_uses' => $validated['max_uses'],
            'expires_at' => $validated['expires_at'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'status' => 'active',
        ]);

        $this->logActivity($request, 'access_key.created', 'access_key', $accessKey->id, "Membuat access key {$accessKey->code}");

        return redirect()->back()->with('success', 'Access key berhasil dibuat');
    }

    public function revokeAccessKey(Request $request, KodeAkses $accessKey)
    {
        $accessKey->update(['status' => 'revoked']);

        $this->logActivity($request, 'access_key.revoked', 'access_key', $accessKey->id, "Revoke access key {$accessKey->code}");

        return redirect()->back()->with('success', 'Access key berhasil dinonaktifkan');
    }

    private function notifyAccessActivated(Transaksi $transaction, string $title, string $source): void
    {
        if (! $transaction->user) {
            return;
        }

        $scopeLabel = app(AksesLanggananService::class)->labelScope(
            $transaction->scope_type,
            $transaction->programPembelajaran?->title ?? $transaction->paymentPlan?->programPembelajaran?->title
        );

        app(NotifikasiPenggunaService::class)->kirimKePengguna(
            $transaction->user,
            'payment_success',
            $title,
            "Akses {$scopeLabel} sudah aktif.",
            route('user.kelas.index'),
            ['transaction_id' => $transaction->id, 'source' => $source]
        );
    }

    private function generateAccessCode(): string
    {
        do {
            $code = 'JL-' . strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4));
        } while (KodeAkses::where('code', $code)->exists());

        return $code;
    }
}
