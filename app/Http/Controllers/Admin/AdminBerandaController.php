<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Modul;
use App\Models\Kuis;
use App\Models\Soal;
use App\Models\PengerjaanKuis;
use App\Models\Progres;
use App\Models\Pengguna;
use Inertia\Inertia;

class AdminBerandaController extends Controller
{
    public function index()
    {
        $activeUsers = Pengguna::where('role', 'user')
            ->where(function ($query) {
                $query->whereHas('progress', fn ($query) => $query->where('updated_at', '>=', now()->subDays(7)))
                    ->orWhereHas('attempts', fn ($query) => $query->where('attempted_at', '>=', now()->subDays(7)));
            })
            ->count();

        return Inertia::render('Admin/Beranda/Beranda', [
            'totalModules'   => Modul::count(),
            'totalLessons'   => Modul::count(),
            'totalQuizzes'   => Kuis::count(),
            'totalQuestions' => Soal::count(),
            'totalUsers'     => Pengguna::where('role', 'user')->count(),
            'activeUsers'    => $activeUsers,
            'completedLessons' => Progres::count(),
            'totalAttempts' => PengerjaanKuis::count(),
            'averageScore' => round((float) PengerjaanKuis::avg('score'), 1),
            'popularModules' => Modul::query()
                ->select('modules.id', 'modules.title')
                ->selectRaw('COUNT(progress.id) as completions_count')
                ->leftJoin('progress', 'progress.module_id', '=', 'modules.id')
                ->groupBy('modules.id', 'modules.title')
                ->orderByDesc('completions_count')
                ->take(5)
                ->get(),
            'recentAttempts' => PengerjaanKuis::with(['user:id,username', 'quiz.module'])
                ->latest('attempted_at')
                ->take(5)
                ->get()
                ->map(fn (PengerjaanKuis $attempt) => [
                    'id' => $attempt->id,
                    'student' => $attempt->user?->username,
                    'lesson' => $attempt->quiz?->module?->title,
                    'score' => $attempt->score,
                    'attempted_at' => optional($attempt->attempted_at)->format('d M Y H:i'),
                ]),
        ]);
    }
}
