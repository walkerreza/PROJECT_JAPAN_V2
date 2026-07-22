<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Kuis;
use App\Models\Modul;
use App\Models\PengerjaanKuis;
use App\Models\Pengguna;
use App\Models\Progres;
use App\Models\Soal;
use App\Services\KloterBelajarService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminBerandaController extends Controller
{
    public function index(Request $request, KloterBelajarService $kloterService): Response
    {
        /** @var Pengguna $admin */
        $admin = $request->user();
        $selectedKloter = $kloterService->resolveKloterDikelola($admin, $request->integer('kloter') ?: null);
        $programIds = $kloterService->programIdsDikelola($admin, $selectedKloter);
        $studentsQuery = $kloterService->batasiSiswaDikelola(
            Pengguna::query()->where('role', 'user'),
            $admin,
            $selectedKloter
        );
        $studentIds = (clone $studentsQuery)->select('users.id');

        $attemptsQuery = PengerjaanKuis::query()
            ->whereIn('user_id', clone $studentIds)
            ->when($programIds !== null, fn (Builder $query) => $query
                ->whereHas('quiz.module', fn (Builder $query) => $query->whereIn('program_pembelajaran_id', $programIds)));
        $progressQuery = Progres::query()
            ->whereIn('user_id', clone $studentIds)
            ->when($programIds !== null, fn (Builder $query) => $query
                ->whereHas('module', fn (Builder $query) => $query->whereIn('program_pembelajaran_id', $programIds)));

        $activeUsers = (clone $studentsQuery)
            ->where(function (Builder $query) use ($programIds) {
                $query->whereHas('progress', function (Builder $progress) use ($programIds) {
                    $progress->where('updated_at', '>=', now()->subDays(7))
                        ->when($programIds !== null, fn (Builder $query) => $query
                            ->whereHas('module', fn (Builder $module) => $module->whereIn('program_pembelajaran_id', $programIds)));
                })->orWhereHas('attempts', function (Builder $attempt) use ($programIds) {
                    $attempt->where('attempted_at', '>=', now()->subDays(7))
                        ->when($programIds !== null, fn (Builder $query) => $query
                            ->whereHas('quiz.module', fn (Builder $module) => $module->whereIn('program_pembelajaran_id', $programIds)));
                });
            })
            ->count();

        return Inertia::render('Admin/Beranda/Beranda', [
            'adminScope' => $admin->admin_scope ?: Pengguna::ADMIN_SCOPE_GLOBAL,
            'kloters' => $kloterService->pilihanKloterAdmin($admin),
            'filters' => ['kloter' => $selectedKloter?->id],
            'totalModules' => Modul::count(),
            'totalLessons' => Modul::count(),
            'totalQuizzes' => Kuis::count(),
            'totalQuestions' => Soal::count(),
            'totalUsers' => (clone $studentsQuery)->count(),
            'activeUsers' => $activeUsers,
            'completedLessons' => (clone $progressQuery)->count(),
            'totalAttempts' => (clone $attemptsQuery)->count(),
            'averageScore' => round((float) (clone $attemptsQuery)->avg('score'), 1),
            'popularModules' => Modul::query()
                ->when($programIds !== null, fn (Builder $query) => $query->whereIn('program_pembelajaran_id', $programIds))
                ->withCount(['progress as completions_count' => fn (Builder $query) => $query->whereIn('user_id', clone $studentIds)])
                ->orderByDesc('completions_count')
                ->take(5)
                ->get(['id', 'title']),
            'recentAttempts' => (clone $attemptsQuery)
                ->with(['user:id,username', 'quiz.module'])
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
