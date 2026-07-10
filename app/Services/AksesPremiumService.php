<?php

namespace App\Services;

use App\Models\Langganan;
use App\Models\Modul;
use App\Models\Pengguna;

class AksesPremiumService
{
    private const BATAS_PREVIEW_WEEK = 1;

    public function isPremium(Pengguna $user): bool
    {
        return $this->punyaLanggananAktif($user) || $user->subscription_status === 'premium';
    }

    public function punyaAksesPenuh(Pengguna $user): bool
    {
        return $this->punyaAksesGlobal($user);
    }

    public function bolehAksesModul(Pengguna $user, ?Modul $module): bool
    {
        $bolehAksesDasar = false;

        if ($this->punyaAksesGlobal($user)) {
            $bolehAksesDasar = true;
        }

        if (! $bolehAksesDasar && $module?->program_pembelajaran_id && $this->punyaAksesProgram($user, (int) $module->program_pembelajaran_id)) {
            $bolehAksesDasar = true;
        }

        if (! $bolehAksesDasar) {
            $bolehAksesDasar = $this->isModulPreviewGratis($module);
        }

        if (! $bolehAksesDasar) {
            return false;
        }

        return $this->bolehAksesJadwalKloter($user, $module);
    }

    public function isModulPreviewGratis(?Modul $module): bool
    {
        return $module !== null && (int) $module->week_number <= self::BATAS_PREVIEW_WEEK;
    }

    public function punyaAksesKelas(Pengguna $user, ?int $programPembelajaranId): bool
    {
        if ($this->punyaAksesGlobal($user)) {
            return true;
        }

        return $programPembelajaranId !== null && $this->punyaAksesProgram($user, $programPembelajaranId);
    }

    public function bolehAksesJadwalKloter(Pengguna $user, ?Modul $module): bool
    {
        if (! $module?->program_pembelajaran_id || ! $module->week_number) {
            return true;
        }

        $kloter = app(KloterBelajarService::class)->kloterAktifUser($user, (int) $module->program_pembelajaran_id);

        if (! $kloter) {
            return true;
        }

        $mingguAktif = app(KloterBelajarService::class)->mingguAktif($kloter);

        return $mingguAktif === null || (int) $module->week_number <= $mingguAktif;
    }

    public function statusAkses(Pengguna $user): array
    {
        $isPremium = $this->isPremium($user);
        $punyaAksesPenuh = $this->punyaAksesPenuh($user);
        $langgananAktif = $this->langgananAktif($user);
        $premiumAktifSampai = $langgananAktif?->end_date?->copy()->endOfDay();
        $sisaHariPremium = $premiumAktifSampai ? $this->sisaHariSampai($premiumAktifSampai) : null;
        $programAktifIds = $this->programAktifIds($user);

        return [
            'subscription_status' => $user->subscription_status,
            'is_premium' => $isPremium,
            'has_full_access' => $punyaAksesPenuh,
            'scope_type' => $punyaAksesPenuh ? AksesLanggananService::SCOPE_GLOBAL : ($programAktifIds->isNotEmpty() ? AksesLanggananService::SCOPE_PROGRAM : null),
            'active_program_ids' => $programAktifIds->values()->all(),
            'active_program_count' => $programAktifIds->count(),
            'free_preview_week_limit' => self::BATAS_PREVIEW_WEEK,
            'active_until' => optional($premiumAktifSampai)->toIso8601String(),
            'active_until_label' => $premiumAktifSampai ? $premiumAktifSampai->copy()->locale('id')->translatedFormat('j F Y') : null,
            'premium_days_left' => $sisaHariPremium,
            'should_show_upgrade' => $isPremium ? ($sisaHariPremium !== null && $sisaHariPremium <= 3) : true,
        ];
    }

    private function sisaHariSampai($tanggal): int
    {
        if (! $tanggal || $tanggal->isPast()) {
            return 0;
        }

        return max(1, (int) ceil(now()->diffInDays($tanggal, false)));
    }

    private function langgananAktif(Pengguna $user): ?Langganan
    {
        return $user->subscriptions()
            ->where('status', 'active')
            ->whereDate('end_date', '>=', now()->toDateString())
            ->latest('end_date')
            ->first();
    }

    private function punyaLanggananAktif(Pengguna $user): bool
    {
        return $user->subscriptions()
            ->where('status', 'active')
            ->whereDate('end_date', '>=', now()->toDateString())
            ->exists();
    }

    private function punyaAksesGlobal(Pengguna $user): bool
    {
        $punyaGlobalAktif = $user->subscriptions()
            ->where('status', 'active')
            ->whereDate('end_date', '>=', now()->toDateString())
            ->where(function ($query) {
                $query->where('scope_type', AksesLanggananService::SCOPE_GLOBAL)
                    ->orWhereNull('scope_type');
            })
            ->exists();

        if ($punyaGlobalAktif) {
            return true;
        }

        return $user->subscription_status === 'premium' && ! $this->punyaLanggananAktif($user);
    }

    private function punyaAksesProgram(Pengguna $user, int $programPembelajaranId): bool
    {
        return $user->subscriptions()
            ->where('status', 'active')
            ->whereDate('end_date', '>=', now()->toDateString())
            ->where('scope_type', AksesLanggananService::SCOPE_PROGRAM)
            ->where('program_pembelajaran_id', $programPembelajaranId)
            ->exists();
    }

    private function programAktifIds(Pengguna $user)
    {
        return $user->subscriptions()
            ->where('status', 'active')
            ->whereDate('end_date', '>=', now()->toDateString())
            ->where('scope_type', AksesLanggananService::SCOPE_PROGRAM)
            ->whereNotNull('program_pembelajaran_id')
            ->pluck('program_pembelajaran_id')
            ->unique();
    }
}
