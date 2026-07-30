<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Models\LogReward;
use App\Models\Pencapaian;
use App\Models\Pengguna;
use App\Services\GamifikasiConfigService;
use App\Services\ChartDataService;
use App\Services\PencapaianService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SuperAdminGamifikasiController extends SuperAdminDasarController
{
    public function __invoke(
        Request $request,
        GamifikasiConfigService $gamifikasiConfig,
        ChartDataService $chartData
    )
    {
        $topUsers = Pengguna::where('role', 'user')->orderByDesc('xp')->take(5)->get();
        $period = $chartData->resolvePeriod($request);
        $leagues = collect($gamifikasiConfig->leagues())->sortBy('min_xp')->values();
        $leagueCounts = $leagues->mapWithKeys(fn (array $league) => [$league['name'] => 0])->all();

        Pengguna::query()
            ->where('role', 'user')
            ->select(['xp'])
            ->cursor()
            ->each(function (Pengguna $user) use ($leagues, &$leagueCounts) {
                $league = $leagues
                    ->filter(fn (array $item) => (int) $user->xp >= (int) $item['min_xp'])
                    ->last();

                if ($league) {
                    $leagueCounts[$league['name']]++;
                }
            });

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
            'xpSeries' => $chartData->dailySeries($period, [
                'xp' => LogReward::query()
                    ->where('created_at', '>=', $chartData->fromDate($period))
                    ->selectRaw('DATE(created_at) as day, SUM(xp_amount) as total')
                    ->groupBy('day')
                    ->pluck('total', 'day'),
            ]),
            'leagueDistribution' => $leagues
                ->map(fn (array $league, int $index) => [
                    'label' => $league['name'],
                    'value' => $leagueCounts[$league['name']] ?? 0,
                    'chart_key' => "league-{$index}",
                    'color' => ['#b45309', '#64748b', '#d97706', '#0284c7', '#7c3aed', '#db2777'][$index % 6],
                    'fill' => "var(--color-league-{$index})",
                ])
                ->values(),
            'filters' => ['period' => $period],
            'settings' => $gamifikasiConfig->all(),
            'achievements' => Pencapaian::query()
                ->withCount('users')
                ->latest()
                ->get(),
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
            'leagues' => ['required', 'array', 'min:1', 'max:10'],
            'leagues.*.name' => ['required', 'string', 'max:50'],
            'leagues.*.min_xp' => ['required', 'integer', 'min:0', 'max:10000000'],
            'leagues.*.icon' => ['nullable', 'string', 'max:50'],
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

        $validated['leagues'] = collect($validated['leagues'])
            ->map(fn (array $league) => [
                'name' => trim($league['name']),
                'min_xp' => (int) $league['min_xp'],
                'icon' => trim((string) ($league['icon'] ?? '')) ?: 'bronze_kabuto',
            ])
            ->unique('min_xp')
            ->sortBy('min_xp')
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

    public function storeAchievement(Request $request)
    {
        $achievement = Pencapaian::create($this->validatedAchievement($request));

        $this->logActivity(
            $request,
            'create_achievement',
            'achievement',
            $achievement->id,
            "Menambahkan lencana {$achievement->name}."
        );

        return back()->with('success', 'Lencana berhasil ditambahkan.');
    }

    public function updateAchievement(Request $request, Pencapaian $achievement)
    {
        $achievement->update($this->validatedAchievement($request));

        $this->logActivity(
            $request,
            'update_achievement',
            'achievement',
            $achievement->id,
            "Memperbarui lencana {$achievement->name}."
        );

        return back()->with('success', 'Lencana berhasil diperbarui.');
    }

    public function destroyAchievement(Request $request, Pencapaian $achievement)
    {
        $achievementName = $achievement->name;
        $achievementId = $achievement->id;
        $achievement->delete();

        $this->logActivity(
            $request,
            'delete_achievement',
            'achievement',
            $achievementId,
            "Menghapus lencana {$achievementName}."
        );

        return back()->with('success', 'Lencana berhasil dihapus.');
    }

    private function validatedAchievement(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:10'],
            'xp_reward' => ['required', 'integer', 'min:0'],
            'condition_type' => ['required', 'in:lessons_completed,quiz_perfect,streak_days'],
            'condition_value' => ['required', 'integer', 'min:1'],
        ]);
    }
}
