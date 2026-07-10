<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Models\LogReward;
use App\Models\Pengguna;
use App\Services\GamifikasiConfigService;
use App\Services\PencapaianService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SuperAdminGamifikasiController extends SuperAdminDasarController
{
    public function __invoke(GamifikasiConfigService $gamifikasiConfig)
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
            'settings' => $gamifikasiConfig->all(),
        ]);
    }

    public function updateSettings(Request $request, GamifikasiConfigService $gamifikasiConfig)
    {
        $validated = $request->validate([
            'quiz_xp.perfect' => ['required', 'integer', 'min:0', 'max:10000'],
            'quiz_xp.score_80' => ['required', 'integer', 'min:0', 'max:10000'],
            'quiz_xp.score_60' => ['required', 'integer', 'min:0', 'max:10000'],
            'quiz_xp.participation' => ['required', 'integer', 'min:0', 'max:10000'],
            'streak.enabled' => ['required', 'boolean'],
            'streak.milestones' => ['required', 'array', 'max:10'],
            'streak.milestones.*.days' => ['required', 'integer', 'min:1', 'max:3650'],
            'streak.milestones.*.xp' => ['required', 'integer', 'min:0', 'max:100000'],
        ]);

        $validated['streak']['milestones'] = collect($validated['streak']['milestones'])
            ->map(fn (array $milestone) => [
                'days' => (int) $milestone['days'],
                'xp' => (int) $milestone['xp'],
            ])
            ->unique('days')
            ->sortBy('days')
            ->values()
            ->all();

        $gamifikasiConfig->update($validated);

        $this->logActivity(
            $request,
            'update_gamification_settings',
            'gamification',
            null,
            'Mengubah konfigurasi XP kuis dan streak.'
        );

        return back()->with('success', 'Konfigurasi gamifikasi berhasil disimpan.');
    }

    public function recalculateAchievements(Request $request, PencapaianService $pencapaianService)
    {
        $checkedUsers = 0;
        $unlockedAchievements = 0;

        Pengguna::query()
            ->where('role', 'user')
            ->select(['id', 'username', 'xp', 'level', 'streak_count'])
            ->chunkById(100, function ($users) use ($pencapaianService, &$checkedUsers, &$unlockedAchievements) {
                foreach ($users as $user) {
                    $checkedUsers++;
                    $unlockedAchievements += count($pencapaianService->evaluateAchievements($user, 'recalculate'));
                }
            });

        $this->logActivity(
            $request,
            'recalculate_achievements',
            'gamification',
            null,
            "Evaluasi ulang pencapaian untuk {$checkedUsers} user."
        );

        return back()->with('success', "Evaluasi ulang selesai. {$checkedUsers} user dicek, {$unlockedAchievements} lencana baru terbuka.");
    }
}
