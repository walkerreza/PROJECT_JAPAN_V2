<?php

namespace App\Services;

use App\Models\KodeAkses;
use App\Models\Langganan;
use App\Models\PaketPembayaran;
use App\Models\Pengguna;
use App\Models\Transaksi;
use Illuminate\Support\Facades\DB;

class AksesLanggananService
{
    public const SCOPE_GLOBAL = 'global';
    public const SCOPE_PROGRAM = 'program';

    public function activateFromTransaction(Transaksi $transaction): Langganan
    {
        return DB::transaction(function () use ($transaction) {
            $transaction->loadMissing(['paymentPlan', 'user', 'kloterBelajar']);

            $plan = $transaction->paymentPlan;
            $scope = $this->scopeFromPlan($plan);
            $user = $transaction->user;
            $kloter = $transaction->kloterBelajar
                ?: app(KloterBelajarService::class)->kloterUntukPembayaran($scope['program_pembelajaran_id']);

            $this->expireOverlappingSubscriptions($user, $scope);

            $subscription = Langganan::create([
                'user_id' => $transaction->user_id,
                'payment_plan_id' => $transaction->payment_plan_id,
                ...$scope,
                'kloter_belajar_id' => $kloter?->id,
                'status' => 'active',
                'start_date' => now()->toDateString(),
                'end_date' => now()->addDays($plan?->duration_days ?? 30)->toDateString(),
                'auto_renew' => false,
            ]);

            $transaction->update([
                'subscription_id' => $subscription->id,
                ...$scope,
                'kloter_belajar_id' => $kloter?->id,
            ]);

            if ($user && $kloter) {
                app(KloterBelajarService::class)->assignUser(
                    $user,
                    $kloter,
                    $subscription,
                    $transaction,
                    null,
                    'Masuk kloter otomatis dari pembayaran.'
                );
            } elseif ($user) {
                $this->notifyMissingKloter($user, $subscription->id, 'payment');
            }

            $this->markUserPremium($user);

            return $subscription;
        });
    }

    public function activateFromAccessKey(Pengguna $user, KodeAkses $accessKey): Langganan
    {
        return DB::transaction(function () use ($user, $accessKey) {
            $accessKey->loadMissing(['paymentPlan', 'kloterBelajar']);

            $plan = $accessKey->paymentPlan ?: $this->defaultAccessKeyPlan();
            $scope = $this->scopeFromAccessKey($accessKey);
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

    public function defaultAccessKeyPlan(): PaketPembayaran
    {
        return PaketPembayaran::firstOrCreate(
            ['slug' => 'access-key-premium'],
            [
                'name' => 'Access Key Premium',
                'scope_type' => self::SCOPE_GLOBAL,
                'program_pembelajaran_id' => null,
                'description' => 'Akses manual via kode akses',
                'price' => 0,
                'duration_days' => 30,
                'features' => ['Akses manual dari admin'],
                'is_active' => true,
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
        if ($scopeType === self::SCOPE_PROGRAM && $programPembelajaranId) {
            return [
                'scope_type' => self::SCOPE_PROGRAM,
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
        if ($scopeType === self::SCOPE_PROGRAM && $programTitle) {
            return "Kelas {$programTitle}";
        }

        return 'Semua kelas';
    }

    private function expireOverlappingSubscriptions(?Pengguna $user, array $scope): void
    {
        if (! $user) {
            return;
        }

        $query = Langganan::where('user_id', $user->id)->where('status', 'active');

        if ($scope['scope_type'] === self::SCOPE_PROGRAM) {
            $query->where('scope_type', self::SCOPE_PROGRAM)
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
