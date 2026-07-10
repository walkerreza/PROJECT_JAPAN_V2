<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Models\LogReward;
use App\Models\Pengguna;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SuperAdminGamifikasiController extends SuperAdminDasarController
{
    public function __invoke()
    {
        $topUsers = Pengguna::where('role', 'user')->orderByDesc('xp')->take(5)->get();

        return Inertia::render('SuperAdmin/Gamifikasi/Gamifikasi', [
            'stats' => [
                $this->stat('XP Terdistribusi', number_format((int) LogReward::sum('xp_amount')), '⚡'),
                $this->stat('Pencapaian Unlock', number_format(DB::table('user_achievements')->count()), '🏆'),
                $this->stat('Rata-rata Streak', number_format((float) Pengguna::where('role', 'user')->avg('streak_count'), 1), '🔥'),
                $this->stat('Reward Logs', number_format(LogReward::count()), '🎯'),
            ],
            'leaderboard' => $topUsers->map(fn (Pengguna $user, int $index) => [
                'rank' => $index + 1,
                'name' => $user->username,
                'xp' => number_format($user->xp) . ' XP',
                'streak' => $user->streak_count . ' hari',
            ]),
        ]);
    }
}
