<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Pengguna;
use App\Services\GamifikasiConfigService;
use Inertia\Inertia;

class PapanPeringkatController extends Controller
{
    public function __invoke(GamifikasiConfigService $gamifikasiConfig)
    {
        $leagues = $gamifikasiConfig->leagues();

        $players = Pengguna::where('role', 'user')
            ->orderByDesc('xp')
            ->take(50)
            ->get(['id', 'username', 'level', 'xp', 'streak_count'])
            ->map(function ($user, $index) use ($leagues) {
                $league = $this->leagueFor((int) ($user->xp ?? 0), $leagues);

                return [
                    'rank' => $index + 1,
                    'name' => $user->username,
                    'level' => 'LevelPembelajaran ' . $user->level,
                    'xp' => $user->xp,
                    'streak' => $user->streak_count,
                    'avatar' => $user->username,
                    'isMe' => $user->id === auth()->id(),
                    'league' => $league,
                ];
            });

        return Inertia::render('User/Leaderboard', [
            'players' => $players,
            'leagues' => $leagues,
        ]);
    }

    private function leagueFor(int $xp, array $leagues): array
    {
        $sortedLeagues = collect($leagues)
            ->sortBy('min_xp')
            ->values();

        return $sortedLeagues
            ->reverse()
            ->first(fn (array $league) => $xp >= (int) ($league['min_xp'] ?? 0))
            ?? $sortedLeagues->first()
            ?? ['name' => 'Bronze', 'min_xp' => 0, 'icon' => 'bronze_kabuto'];
    }
}
