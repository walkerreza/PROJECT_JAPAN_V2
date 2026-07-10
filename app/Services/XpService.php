<?php

namespace App\Services;

use App\Models\Pengguna;
use App\Models\LogReward;

class XpService
{
    private const LEVEL_THRESHOLDS = [
        1 => 0,
        2 => 100,
        3 => 300,
        4 => 600,
        5 => 1000,
        6 => 1500,
    ];

    /**
     * Award XP to a user and update their level if necessary
     */
    public function awardXP(Pengguna $user, int $amount, string $sourceType, ?int $sourceId = null, string $description = ''): array
    {
        // 1. Prevent Double Reward for the same lesson/quiz
        if ($sourceId !== null && in_array($sourceType, ['lesson', 'quiz'])) {
            $alreadyRewarded = LogReward::where('user_id', $user->id)
                ->where('source_type', $sourceType)
                ->where('source_id', $sourceId)
                ->exists();

            if ($alreadyRewarded) {
                return [
                    'xp_awarded' => 0,
                    'level_up' => false,
                    'new_level' => $user->level,
                    'duplicate' => true
                ];
            }
        }

        // 2. Grant XP
        if ($amount > 0) {
            $user->xp += $amount;
            
            // 3. Log the reward
            LogReward::create([
                'user_id' => $user->id,
                'source_type' => $sourceType,
                'source_id' => $sourceId,
                'xp_amount' => $amount,
                'description' => $description
            ]);
        }

        // 4. Calculate LevelPembelajaran Up
        $newLevel = $this->calculateLevel($user->xp);
        
        $levelUp = false;
        if ($newLevel > $user->level) {
            $user->level = $newLevel;
            $levelUp = true;
        }

        $user->save();

        return [
            'xp_awarded' => $amount,
            'level_up' => $levelUp,
            'new_level' => $user->level,
            'duplicate' => false
        ];
    }

    /**
     * Calculate the level for a given XP total
     */
    public function calculateLevel(int $xp): int
    {
        $level = 1;
        foreach (self::LEVEL_THRESHOLDS as $lvl => $threshold) {
            if ($xp >= $threshold) {
                $level = $lvl;
            } else {
                break;
            }
        }
        return $level;
    }

    /**
     * Calculate quiz XP based on score percentage
     */
    public function calculateQuizXP(float $scorePercentage): int
    {
        $config = app(GamifikasiConfigService::class)->quizXp();

        if ($scorePercentage >= 100) return (int) ($config['perfect'] ?? 50);
        if ($scorePercentage >= 80) return (int) ($config['score_80'] ?? 35);
        if ($scorePercentage >= 60) return (int) ($config['score_60'] ?? 20);
        return 0;
    }
}
