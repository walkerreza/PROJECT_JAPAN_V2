<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PengerjaanKuis;
use App\Models\Modul;
use App\Models\Soal;
use App\Models\Pengguna;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminAnalitikController extends Controller
{
    public function __invoke()
    {
        $lowScoreQuizzes = PengerjaanKuis::query()
            ->select('quiz_id', DB::raw('AVG(score) as average_score'), DB::raw('COUNT(*) as attempts_count'))
            ->with('quiz.module')
            ->groupBy('quiz_id')
            ->havingRaw('COUNT(*) > 0')
            ->orderBy('average_score')
            ->take(8)
            ->get()
            ->map(fn (PengerjaanKuis $attempt) => [
                'quiz_id' => $attempt->quiz_id,
                'quiz_type' => $attempt->quiz?->type,
                'lesson' => $attempt->quiz?->module?->title,
                'module' => $attempt->quiz?->module?->title,
                'average_score' => round((float) $attempt->average_score, 1),
                'attempts_count' => (int) $attempt->attempts_count,
            ]);

        $popularModules = Modul::query()
            ->select('modules.id', 'modules.title', DB::raw('COUNT(progress.id) as completions_count'))
            ->leftJoin('progress', 'progress.module_id', '=', 'modules.id')
            ->groupBy('modules.id', 'modules.title')
            ->orderByDesc('completions_count')
            ->take(8)
            ->get();

        $inactiveStudents = Pengguna::query()
            ->where('role', 'user')
            ->withMax('progress as last_lesson_activity', 'updated_at')
            ->withMax('attempts as last_quiz_activity', 'attempted_at')
            ->get()
            ->map(function (Pengguna $student) {
                $lastActivity = collect([
                    $student->last_lesson_activity,
                    $student->last_quiz_activity,
                    $student->last_activity_date,
                ])->filter()->max();

                return [
                    'id' => $student->id,
                    'username' => $student->username,
                    'email' => $student->email,
                    'last_activity' => $lastActivity,
                    'last_activity_label' => $lastActivity ? date('d M Y', strtotime($lastActivity)) : 'Belum aktif',
                    'xp' => (int) $student->xp,
                ];
            })
            ->filter(fn ($student) => ! $student['last_activity'] || strtotime($student['last_activity']) < now()->subDays(7)->timestamp)
            ->sortBy('last_activity')
            ->values();

        $inactiveStudentsCount = $inactiveStudents->count();

        $inactiveStudents = $inactiveStudents
            ->take(8)
            ->values();

        $recentAttempts = PengerjaanKuis::with(['user:id,username,email', 'quiz.module'])
            ->latest('attempted_at')
            ->take(10)
            ->get()
            ->map(fn (PengerjaanKuis $attempt) => [
                'id' => $attempt->id,
                'student' => $attempt->user?->username,
                'lesson' => $attempt->quiz?->module?->title,
                'quiz_type' => $attempt->quiz?->type,
                'score' => $attempt->score,
                'xp_earned' => $attempt->xp_earned,
                'attempted_at' => optional($attempt->attempted_at)->format('d M Y H:i'),
            ]);

        $questionPerformance = Soal::query()
            ->with('quiz.module')
            ->withCount([
                'attemptAnswers as attempts_count',
                'attemptAnswers as correct_count' => fn ($query) => $query->where('is_correct', true),
            ])
            ->get()
            ->filter(fn (Soal $question) => $question->attempts_count > 0)
            ->map(function (Soal $question) {
                $correctRate = $question->attempts_count > 0
                    ? round(($question->correct_count / $question->attempts_count) * 100, 1)
                    : 0;

                return [
                    'id' => $question->id,
                    'question_text' => $question->question_text,
                    'quiz_type' => $question->quiz?->type,
                    'lesson' => $question->quiz?->module?->title,
                    'module' => $question->quiz?->module?->title,
                    'attempts_count' => (int) $question->attempts_count,
                    'correct_count' => (int) $question->correct_count,
                    'correct_rate' => $correctRate,
                ];
            })
            ->sortBy('correct_rate')
            ->take(12)
            ->values();

        return Inertia::render('Admin/Analitik/Analitik', [
            'summary' => [
                'total_students' => Pengguna::where('role', 'user')->count(),
                'total_attempts' => PengerjaanKuis::count(),
                'average_score' => round((float) PengerjaanKuis::avg('score'), 1),
                'inactive_students' => $inactiveStudentsCount,
            ],
            'lowScoreQuizzes' => $lowScoreQuizzes,
            'popularModules' => $popularModules,
            'inactiveStudents' => $inactiveStudents,
            'recentAttempts' => $recentAttempts,
            'questionPerformance' => $questionPerformance,
        ]);
    }
}
