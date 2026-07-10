<?php

namespace App\Services;

use App\Models\Pencapaian;
use App\Models\Pengguna;
use App\Models\Progres;
use App\Models\PengerjaanKuis;

class PencapaianService
{
    protected XpService $xpService;
    protected NotifikasiPenggunaService $notifikasiPengguna;

    public function __construct(XpService $xpService, NotifikasiPenggunaService $notifikasiPengguna)
    {
        $this->xpService = $xpService;
        $this->notifikasiPengguna = $notifikasiPengguna;
    }

    public function evaluateAchievements(Pengguna $user, string $activityType, array $context = []): array
    {
        $newlyUnlocked = [];
        $alreadyUnlockedIds = $user->achievements()->pluck('achievements.id')->toArray();
        $achievements = Pencapaian::whereNotIn('id', $alreadyUnlockedIds)->get();

        foreach ($achievements as $achievement) {
            if ($this->checkCondition($user, $achievement)) {
                $user->achievements()->attach($achievement->id, [
                    'unlocked_at' => now(),
                ]);

                if ($achievement->xp_reward > 0) {
                    $this->xpService->awardXP(
                        $user,
                        $achievement->xp_reward,
                        'achievement',
                        $achievement->id,
                        "Lencana: {$achievement->name}"
                    );
                }

                $newlyUnlocked[] = [
                    'id' => $achievement->id,
                    'name' => $achievement->name,
                    'description' => $achievement->description,
                    'icon' => $achievement->icon,
                    'xp_reward' => $achievement->xp_reward,
                ];

                $this->notifikasiPengguna->kirimKePengguna(
                    $user,
                    'achievement_unlocked',
                    'Pencapaian terbuka',
                    "Kamu mendapatkan lencana {$achievement->name}.",
                    route('user.progress'),
                    ['achievement_id' => $achievement->id]
                );
            }
        }

        return $newlyUnlocked;
    }

    protected function checkCondition(Pengguna $user, Pencapaian $achievement): bool
    {
        return match ($achievement->condition_type) {
            'lessons_completed' => Progres::where('user_id', $user->id)->whereNotNull('completed_at')->count() >= $achievement->condition_value,
            'quiz_perfect' => PengerjaanKuis::where('user_id', $user->id)->where('score', 100)->count() >= $achievement->condition_value,
            'streak_days' => ($user->streak_count ?? 0) >= $achievement->condition_value,
            default => false,
        };
    }
}
