<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Pengguna;
use Inertia\Inertia;

class PapanPeringkatController extends Controller
{
    public function __invoke()
    {
        $players = Pengguna::where('role', 'user')
            ->orderByDesc('xp')
            ->take(10)
            ->get(['id', 'username', 'level', 'xp', 'streak_count'])
            ->map(fn ($user, $index) => [
                'rank' => $index + 1,
                'name' => $user->username,
                'level' => 'LevelPembelajaran ' . $user->level,
                'xp' => $user->xp,
                'streak' => $user->streak_count,
                'avatar' => $user->username,
                'isMe' => $user->id === auth()->id(),
            ]);

        return Inertia::render('User/Leaderboard', ['players' => $players]);
    }
}
