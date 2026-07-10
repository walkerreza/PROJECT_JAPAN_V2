<?php

namespace App\Services;

use App\Models\Sertifikat;
use App\Models\LevelPembelajaran;
use App\Models\Progres;
use App\Models\Pengguna;

class SertifikatService
{
    public function checkAndIssueCertificate(Pengguna $user, int $levelId): ?Sertifikat
    {
        $existing = Sertifikat::where('user_id', $user->id)->where('level_id', $levelId)->first();
        if ($existing) {
            return $existing;
        }

        $level = LevelPembelajaran::with('modules')->find($levelId);
        if (!$level) return null;

        $moduleIds = $level->modules->pluck('id')->all();
        $totalModules = count($moduleIds);

        if ($totalModules === 0) return null;

        $completedCount = Progres::where('user_id', $user->id)
            ->whereIn('module_id', $moduleIds)
            ->whereNotNull('completed_at')
            ->count();

        if ($completedCount < $totalModules) return null;

        $certNumber = 'CERT-' . date('Y') . '-' . str_pad($user->id, 5, '0', STR_PAD_LEFT);

        return Sertifikat::create([
            'user_id' => $user->id,
            'level_id' => $levelId,
            'issued_at' => now(),
            'certificate_number' => $certNumber,
        ]);
    }

    public function getProgressPercentage(Pengguna $user, int $levelId): float
    {
        $level = LevelPembelajaran::with('modules')->find($levelId);
        if (!$level) return 0;

        $moduleIds = $level->modules->pluck('id')->all();
        $total = count($moduleIds);
        if ($total === 0) return 0;

        $completed = Progres::where('user_id', $user->id)
            ->whereIn('module_id', $moduleIds)
            ->whereNotNull('completed_at')
            ->count();

        return round(($completed / $total) * 100, 1);
    }
}
