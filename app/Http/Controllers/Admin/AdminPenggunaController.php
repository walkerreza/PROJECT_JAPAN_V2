<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PengerjaanKuis;
use App\Models\LevelPembelajaran;
use App\Models\Progres;
use App\Models\LogReward;
use App\Models\Pengguna;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminPenggunaController extends Controller
{
    public function index(Request $request)
    {
        $search = (string) $request->string('search');

        $students = Pengguna::query()
            ->where('role', 'user')
            ->when($search, function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('username', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->withCount([
                'progress as lessons_done',
                'attempts as quizzes_done',
            ])
            ->withAvg('attempts as average_score', 'score')
            ->withMax('progress as last_lesson_activity', 'updated_at')
            ->withMax('attempts as last_quiz_activity', 'attempted_at')
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Pengguna $student) => $this->mapStudent($student));

        return Inertia::render('Admin/DataUser/DataUser', [
            'students' => $students,
            'filters' => ['search' => $search],
        ]);
    }

    public function show(Pengguna $user)
    {
        abort_unless($user->role === 'user', 404);

        $user->load([
            'progress.module.level',
            'attempts.quiz.module.level',
            'certificates.level',
            'achievements',
        ]);

        $completedModuleIds = $user->progress->pluck('module_id')->all();
        $levels = LevelPembelajaran::with('modules')->orderBy('stage')->get();

        $levelProgress = $levels->map(function (LevelPembelajaran $level) use ($completedModuleIds) {
            $modules = $level->modules;
            $total = $modules->count();
            $completed = $modules->whereIn('id', $completedModuleIds)->count();

            return [
                'id' => $level->id,
                'name' => $level->level_name,
                'total_lessons' => $total,
                'completed_lessons' => $completed,
                'percentage' => $total > 0 ? round(($completed / $total) * 100) : 0,
            ];
        });

        return Inertia::render('Admin/DataUser/DetailUser', [
            'student' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'status' => $user->status,
                'subscription_status' => $user->subscription_status,
                'xp' => (int) $user->xp,
                'level' => (int) $user->level,
                'streak_count' => (int) $user->streak_count,
                'lessons_done' => $user->progress->count(),
                'quizzes_done' => $user->attempts->count(),
                'average_score' => round((float) $user->attempts->avg('score'), 1),
            ],
            'levelProgress' => $levelProgress,
            'recentProgress' => $user->progress
                ->sortByDesc('updated_at')
                ->take(10)
                ->values()
                ->map(fn (Progres $progress) => [
                    'id' => $progress->id,
                    'lesson' => $progress->module?->title,
                    'module' => $progress->module?->title,
                    'level' => $progress->module?->level?->level_name,
                    'score' => $progress->score,
                    'completed_at' => optional($progress->completed_at ?? $progress->updated_at)->format('d M Y H:i'),
                ]),
            'recentAttempts' => $user->attempts
                ->sortByDesc('attempted_at')
                ->take(10)
                ->values()
                ->map(fn (PengerjaanKuis $attempt) => [
                    'id' => $attempt->id,
                    'quiz' => $attempt->quiz?->type,
                    'lesson' => $attempt->quiz?->module?->title,
                    'module' => $attempt->quiz?->module?->title,
                    'score' => $attempt->score,
                    'xp_earned' => $attempt->xp_earned,
                    'attempted_at' => optional($attempt->attempted_at)->format('d M Y H:i'),
                ]),
            'rewardHistory' => LogReward::where('user_id', $user->id)
                ->latest()
                ->take(10)
                ->get()
                ->map(fn (LogReward $log) => [
                    'id' => $log->id,
                    'description' => $log->description,
                    'source_type' => $log->source_type,
                    'xp_amount' => $log->xp_amount,
                    'created_at' => $log->created_at->format('d M Y H:i'),
                ]),
            'certificates' => $user->certificates->map(fn ($certificate) => [
                'id' => $certificate->id,
                'level' => $certificate->level?->level_name,
                'certificate_number' => $certificate->certificate_number,
                'issued_at' => optional($certificate->issued_at)->format('d M Y'),
            ]),
        ]);
    }

    private function mapStudent(Pengguna $student): array
    {
        $lastActivity = collect([
            $student->last_lesson_activity,
            $student->last_quiz_activity,
            $student->last_activity_date,
        ])->filter()->max();

        return [
            'id' => $student->id,
            'username' => $student->username,
            'email' => $student->email,
            'status' => $student->status,
            'subscription_status' => $student->subscription_status,
            'xp' => (int) $student->xp,
            'level' => (int) $student->level,
            'streak_count' => (int) $student->streak_count,
            'lessons_done' => (int) $student->lessons_done,
            'quizzes_done' => (int) $student->quizzes_done,
            'average_score' => round((float) $student->average_score, 1),
            'last_activity' => $lastActivity ? date('d M Y H:i', strtotime($lastActivity)) : 'Belum aktif',
        ];
    }
}
