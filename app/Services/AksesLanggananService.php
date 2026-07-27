<?php

namespace App\Services;

use App\Models\AnggotaKloter;
use App\Models\KodeAkses;
use App\Models\Langganan;
use App\Models\PaketPembayaran;
use App\Models\Pengguna;
use App\Models\ProgramPembelajaran;
use App\Models\Transaksi;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AksesLanggananService
{
    public const SCOPE_GLOBAL = 'global';

    public const SCOPE_PROGRAM = 'program';

    public const SCOPE_KLOTER = 'kloter';

    public function activateFromTransaction(Transaksi $transaction): ?Langganan
    {
        return DB::transaction(function () use ($transaction) {
            $transaction = Transaksi::query()
                ->with(['paymentPlan', 'user', 'kloterBelajar', 'subscription'])
                ->lockForUpdate()
                ->findOrFail($transaction->id);

            $plan = $transaction->paymentPlan;
            $scope = $this->normalizeScope(
                $transaction->scope_type,
                $transaction->program_pembelajaran_id
            );
            $user = $transaction->user;

            if ($transaction->subscription) {
                return $transaction->subscription;
            }

            if ($scope['scope_type'] === self::SCOPE_KLOTER) {
                if (! $user || ! $transaction->kloterBelajar) {
                    throw ValidationException::withMessages([
                        'kloter_belajar_id' => 'Transaksi kelas mentor tidak memiliki user atau kloter yang valid.',
                    ]);
                }

                $anggota = AnggotaKloter::query()
                    ->where('transaction_id', $transaction->id)
                    ->lockForUpdate()
                    ->first();

                if (! $anggota) {
                    $anggota = app(KloterBelajarService::class)->reservePaymentSeat(
                        $user,
                        $transaction->kloterBelajar,
                        $transaction
                    );
                }

                $anggota->update([
                    'status' => 'paid_pending_approval',
                    'catatan' => 'Pembayaran berhasil. Menunggu persetujuan mentor.',
                ]);

                return null;
            }

            $this->expireOverlappingSubscriptions($user, $scope);

            $subscription = Langganan::create([
                'user_id' => $transaction->user_id,
                'payment_plan_id' => $transaction->payment_plan_id,
                ...$scope,
                'kloter_belajar_id' => null,
                'status' => 'active',
                'start_date' => now()->toDateString(),
                'end_date' => now()->addDays($plan?->duration_days ?? 30)->toDateString(),
                'auto_renew' => false,
            ]);

            $transaction->update([
                'subscription_id' => $subscription->id,
                ...$scope,
                'kloter_belajar_id' => null,
            ]);

            $this->markUserPremium($user);

            return $subscription;
        });
    }

    public function cancelFromTransaction(Transaksi $transaction): void
    {
        DB::transaction(function () use ($transaction) {
            $transaction->loadMissing(['subscription.user', 'user']);
            $subscription = $transaction->subscription;

            if ($subscription && $subscription->status === 'active') {
                $subscription->update(['status' => 'cancelled']);
            }

            app(KloterBelajarService::class)->releasePaymentReservation($transaction);

            $hasOtherActiveSubscription = Langganan::query()
                ->where('user_id', $transaction->user_id)
                ->when($subscription, fn ($query) => $query->where('id', '!=', $subscription->id))
                ->where('status', 'active')
                ->whereDate('end_date', '>=', now()->toDateString())
                ->exists();

            if (! $hasOtherActiveSubscription) {
                $transaction->user?->update(['subscription_status' => 'free']);
            }
        });
    }

    public function approveMentorEnrollment(AnggotaKloter $anggota, Pengguna $approver): Langganan
    {
        return DB::transaction(function () use ($anggota, $approver) {
            $anggota = AnggotaKloter::query()
                ->with(['transaction.paymentPlan', 'user', 'kloterBelajar'])
                ->lockForUpdate()
                ->findOrFail($anggota->id);

            if ($anggota->status === 'active' && $anggota->subscription_id) {
                return Langganan::findOrFail($anggota->subscription_id);
            }

            if ($anggota->status !== 'paid_pending_approval' || $anggota->transaction?->status !== 'success') {
                throw ValidationException::withMessages([
                    'approval' => 'Pendaftaran belum dibayar atau sudah diproses.',
                ]);
            }

            $transaction = Transaksi::query()->lockForUpdate()->findOrFail($anggota->transaction_id);
            $plan = $transaction->paymentPlan;
            $scope = $this->normalizeScope(self::SCOPE_KLOTER, $anggota->kloterBelajar?->program_pembelajaran_id);

            $this->expireOverlappingSubscriptions($anggota->user, $scope);

            $subscription = Langganan::create([
                'user_id' => $anggota->user_id,
                'payment_plan_id' => $transaction->payment_plan_id,
                ...$scope,
                'kloter_belajar_id' => $anggota->kloter_belajar_id,
                'status' => 'active',
                'start_date' => now()->toDateString(),
                'end_date' => now()->addDays($plan?->duration_days ?? 30)->toDateString(),
                'auto_renew' => false,
            ]);

            $transaction->update(['subscription_id' => $subscription->id]);
            $anggota->update([
                'subscription_id' => $subscription->id,
                'status' => 'active',
                'joined_at' => now(),
                'catatan' => 'Disetujui oleh '.$approver->username.' pada '.now()->format('d M Y H:i').'.',
            ]);
            $this->markUserPremium($anggota->user);

            return $subscription;
        });
    }

    public function rejectMentorEnrollment(AnggotaKloter $anggota, Pengguna $approver, string $reason): void
    {
        DB::transaction(function () use ($anggota, $approver, $reason) {
            $anggota = AnggotaKloter::query()
                ->with('transaction')
                ->lockForUpdate()
                ->findOrFail($anggota->id);

            if ($anggota->status === 'rejected') {
                return;
            }

            if ($anggota->status !== 'paid_pending_approval' || $anggota->transaction?->status !== 'success') {
                throw ValidationException::withMessages([
                    'rejection' => 'Pendaftaran belum dibayar atau sudah diproses.',
                ]);
            }

            $anggota->update([
                'status' => 'rejected',
                'catatan' => "Ditolak oleh {$approver->username}. Alasan: {$reason}. Refund perlu diproses manual.",
            ]);
        });
    }

    public function activateFromAccessKey(Pengguna $user, KodeAkses $accessKey): Langganan
    {
        return DB::transaction(function () use ($user, $accessKey) {
            $accessKey->loadMissing(['paymentPlan', 'kloterBelajar']);

            $scope = $this->scopeFromAccessKey($accessKey);
            if ($scope['scope_type'] === self::SCOPE_GLOBAL || ! $scope['program_pembelajaran_id']) {
                throw ValidationException::withMessages([
                    'access_key' => 'Access key global lama sudah tidak dapat digunakan.',
                ]);
            }

            $plan = $accessKey->paymentPlan
                ?: $this->accessKeyPlanForProgram(
                    ProgramPembelajaran::findOrFail($scope['program_pembelajaran_id'])
                );
            $kloter = $accessKey->kloterBelajar
                ?: app(KloterBelajarService::class)->kloterUntukPembayaran($scope['program_pembelajaran_id']);

            $this->expireOverlappingSubscriptions($user, $scope);

            $subscription = Langganan::create([
                'user_id' => $user->id,
                'payment_plan_id' => $plan->id,
                ...$scope,
                'kloter_belajar_id' => $kloter?->id,
                'status' => 'active',
                'start_date' => now()->toDateString(),
                'end_date' => now()->addDays($accessKey->duration_days)->toDateString(),
                'auto_renew' => false,
            ]);

            if ($kloter) {
                app(KloterBelajarService::class)->assignUser(
                    $user,
                    $kloter,
                    $subscription,
                    null,
                    $accessKey,
                    'Masuk kloter dari access key.'
                );
            } else {
                $this->notifyMissingKloter($user, $subscription->id, 'access_key');
            }

            $this->markUserPremium($user);

            return $subscription;
        });
    }

    public function accessKeyPlanForProgram(ProgramPembelajaran $program): PaketPembayaran
    {
        return PaketPembayaran::firstOrCreate(
            ['slug' => 'access-key-'.$program->slug],
            [
                'name' => 'Access Key '.$program->title,
                'scope_type' => self::SCOPE_PROGRAM,
                'program_pembelajaran_id' => $program->id,
                'description' => 'Plan teknis untuk access key kelas.',
                'price' => 0,
                'duration_days' => 30,
                'features' => ['Akses manual dari admin'],
                'is_active' => false,
            ]
        );
    }

    public function scopeFromPlan(?PaketPembayaran $plan): array
    {
        return $this->normalizeScope($plan?->scope_type, $plan?->program_pembelajaran_id);
    }

    public function scopeFromAccessKey(KodeAkses $accessKey): array
    {
        if ($accessKey->kloter_belajar_id) {
            $accessKey->loadMissing('kloterBelajar');

            return $this->normalizeScope(
                self::SCOPE_PROGRAM,
                $accessKey->kloterBelajar?->program_pembelajaran_id
            );
        }

        if ($accessKey->scope_type || $accessKey->program_pembelajaran_id) {
            return $this->normalizeScope($accessKey->scope_type, $accessKey->program_pembelajaran_id);
        }

        return $this->scopeFromPlan($accessKey->paymentPlan);
    }

    public function normalizeScope(?string $scopeType, ?int $programPembelajaranId): array
    {
        if (in_array($scopeType, [self::SCOPE_PROGRAM, self::SCOPE_KLOTER], true) && $programPembelajaranId) {
            return [
                'scope_type' => $scopeType,
                'program_pembelajaran_id' => $programPembelajaranId,
            ];
        }

        return [
            'scope_type' => self::SCOPE_GLOBAL,
            'program_pembelajaran_id' => null,
        ];
    }

    public function labelScope(?string $scopeType, ?string $programTitle = null): string
    {
        if ($scopeType === self::SCOPE_KLOTER && $programTitle) {
            return "Kelas Mentor {$programTitle}";
        }

        if ($scopeType === self::SCOPE_PROGRAM && $programTitle) {
            return "Kelas Mandiri {$programTitle}";
        }

        return 'Semua kelas';
    }

    private function expireOverlappingSubscriptions(?Pengguna $user, array $scope): void
    {
        if (! $user) {
            return;
        }

        $query = Langganan::where('user_id', $user->id)->where('status', 'active');

        if (in_array($scope['scope_type'], [self::SCOPE_PROGRAM, self::SCOPE_KLOTER], true)) {
            $query->whereIn('scope_type', [self::SCOPE_PROGRAM, self::SCOPE_KLOTER])
                ->where('program_pembelajaran_id', $scope['program_pembelajaran_id']);
        }

        $query->update(['status' => 'expired']);
    }

    private function markUserPremium(?Pengguna $user): void
    {
        $user?->update(['subscription_status' => 'premium']);
    }

    private function notifyMissingKloter(Pengguna $user, int $subscriptionId, string $source): void
    {
        app(NotifikasiPenggunaService::class)->kirimKeRole(
            'superadmin',
            'manual_action_required',
            'User belum masuk kloter',
            "{$user->username} sudah aktif aksesnya, tetapi belum ada kloter yang cocok.",
            route('superadmin.kloters'),
            [
                'user_id' => $user->id,
                'subscription_id' => $subscriptionId,
                'source' => $source,
            ],
            'access',
            'warning',
            true
        );
    }
}
