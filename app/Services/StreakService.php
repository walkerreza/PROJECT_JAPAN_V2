<?php

namespace App\Services;

use App\Models\Pengguna;

class StreakService
{
    private const STREAK_MILESTONES = [
        7 => 50,
        30 => 200,
        100 => 1000
    ];

    /**
     * Update user's streak based on current activity
     */
    public function updateStreak(Pengguna $user): array
    {
        $today = now();
        $lastActivity = $user->last_activity_date ? \Carbon\Carbon::parse($user->last_activity_date) : null;
        
        $milestoneReached = false;
        $bonusXP = 0;

        if (!$lastActivity) {
            $user->streak_count = 1;
        } else {
            // Compare calendar dates accurately
            $diffDays = $lastActivity->startOfDay()->diffInDays($today->copy()->startOfDay());

            if ($diffDays == 1) {
                // Increment streak
                $user->streak_count += 1;
                $bonusXP = $this->checkMilestone($user->streak_count - 1, $user->streak_count);
                if ($bonusXP > 0) $milestoneReached = true;
            } elseif ($diffDays > 1) {
                // Reset streak
                $user->streak_count = 1;
            }
        }

        $user->last_activity_date = $today->toDateString();
        $user->save();

        return [
            'streak_count' => $user->streak_count,
            'milestone_reached' => $milestoneReached,
            'bonus_xp' => $bonusXP
        ];
    }

    /**
     * Check if a streak milestone was reached
     */
    public function checkMilestone(int $oldStreak, int $newStreak): int
    {
        return self::STREAK_MILESTONES[$newStreak] ?? 0;
    }
}
