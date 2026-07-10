<?php

namespace Database\Seeders;

use App\Models\Pencapaian;
use Illuminate\Database\Seeder;

class AchievementSeeder extends Seeder
{
    public function run(): void
    {
        $achievements = [
            [
                'name' => 'First Steps',
                'description' => 'Selesaikan pelajaran pertamamu.',
                'icon' => '👣',
                'xp_reward' => 10,
                'condition_type' => 'lessons_completed',
                'condition_value' => 1,
            ],
            [
                'name' => 'First Kuis Pass',
                'description' => 'Raih skor sempurna 100% di kuis pertamamu.',
                'icon' => '🎯',
                'xp_reward' => 20,
                'condition_type' => 'quiz_perfect',
                'condition_value' => 1,
            ],
            [
                'name' => '7-Day Warrior',
                'description' => 'Pertahankan streak belajar selama 7 hari berturut-turut.',
                'icon' => '🔥',
                'xp_reward' => 50,
                'condition_type' => 'streak_days',
                'condition_value' => 7,
            ],
            [
                'name' => 'Perfect 10',
                'description' => 'Raih skor sempurna 100% di 10 kuis berbeda.',
                'icon' => '🏆',
                'xp_reward' => 100,
                'condition_type' => 'quiz_perfect',
                'condition_value' => 10,
            ],
        ];

        foreach ($achievements as $data) {
            Pencapaian::updateOrCreate(
                ['name' => $data['name']],
                $data
            );
        }
    }
}
