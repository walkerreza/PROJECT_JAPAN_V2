<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Services\GamifikasiConfigService;
use App\Services\LeaderboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PapanPeringkatController extends Controller
{
    public function __invoke(
        Request $request,
        GamifikasiConfigService $gamifikasiConfig,
        LeaderboardService $leaderboard
    )
    {
        return Inertia::render('User/Peringkat/Leaderboard', $leaderboard->payload(
            $request->user(),
            $request->query('period'),
            $gamifikasiConfig->leagues(),
        ));
    }
}
