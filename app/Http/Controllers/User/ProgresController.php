<?php

namespace App\Http\Controllers\User;

use App\Events\KuisSelesai;
use App\Http\Controllers\Controller;
use App\Models\PengerjaanKuis;
use App\Models\Progres;
use App\Models\Kuis;
use App\Models\LogReward;
use App\Models\Modul;
use App\Services\AksesPremiumService;
use App\Services\AksesKuisPenggunaService;
use App\Services\GamifikasiConfigService;
use App\Services\NotifikasiPenggunaService;
use App\Services\RepetisiPembelajaranService;
use App\Services\RingkasanProgresPenggunaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProgresController extends Controller
{
    public function index(RingkasanProgresPenggunaService $summary)
    {
        return Inertia::render('User/Progress', $summary->summary(Auth::user()));
    }

    public function storeAttempt(
        Request $request,
        AksesKuisPenggunaService $aksesKuis,
        RepetisiPembelajaranService $repetisi,
        GamifikasiConfigService $gamifikasiConfig
    ) {
        $validated = $request->validate([
            'quiz_id' => ['required', 'exists:quizzes,id'],
            'answers' => ['present', 'array'],
            'answers.*.question_id' => ['required', 'integer', 'exists:questions,id'],
            'answers.*.answer_text' => ['nullable', 'string', 'max:2000'],
            'answers.*.answer_payload' => ['nullable', 'array'],
            'module_flow' => ['nullable', 'boolean'],
            'finished_by_timeout' => ['nullable', 'boolean'],
        ]);

        $user = Auth::user();
        $quiz = Kuis::with([
            'questions',
            'module.programPembelajaran',
        ])
            ->where('status', 'published')
            ->whereHas('module', fn ($moduleQuery) => $moduleQuery->where('status', 'published'))
            ->findOrFail($validated['quiz_id']);

        $module = $quiz->module;

        $aksesKuis->abortJikaTerkunci($user, $quiz);
        abort_if($quiz->questions->isEmpty(), 422, 'Kuis belum memiliki soal.');

        $wrongAttemptCount = 0;
        $answeredUniqueCount = 0;
        $passingScore = (int) ($quiz->passing_score ?? 70);
        $maxLives = 5;
        $passed = false;
        $wasCompleted = false;
        $rewardAlreadyGranted = LogReward::where('user_id', $user->id)
            ->where('source_type', 'quiz')
            ->where('source_id', $quiz->id)
            ->exists();

        $attempt = DB::transaction(function () use ($validated, $quiz, $user, $repetisi, $gamifikasiConfig, &$wrongAttemptCount, &$answeredUniqueCount) {
            $answerEvents = collect($validated['answers'] ?? [])
                ->filter(fn ($answer) => isset($answer['question_id']))
                ->values();
            $answers = $answerEvents
                ->keyBy(fn ($answer) => (int) $answer['question_id'])
                ->values();
            $questionMap = $quiz->questions->keyBy('id');
            $answeredUniqueCount = $answers->count();
            $correctCount = $this->scoreAnswers($answers, $questionMap);
            $totalQuestions = $quiz->questions->count();
            $score = $totalQuestions > 0 ? (int) round(($correctCount / $totalQuestions) * 100) : 0;
            $xpEarned = $gamifikasiConfig->quizXpForScore($correctCount, $totalQuestions);
            $wrongAttemptCount = $answerEvents
                ->filter(function ($answer) use ($questionMap) {
                    $question = $questionMap->get((int) $answer['question_id']);

                    return $question && ! $this->isAnswerCorrect($answer['answer_text'] ?? '', $question->correct_answer);
                })
                ->count();

            $attempt = PengerjaanKuis::create([
                'user_id' => $user->id,
                'quiz_id' => $quiz->id,
                'score' => $score,
                'xp_earned' => $xpEarned,
                'attempted_at' => now(),
            ]);

            $answers->each(function ($answer) use ($attempt, $questionMap) {
                $question = $questionMap->get((int) $answer['question_id']);

                if (! $question) {
                    return;
                }

                $answerText = $answer['answer_text'] ?? '';
                $isCorrect = $this->isAnswerCorrect($answerText, $question->correct_answer);

                $attempt->answers()->create([
                    'question_id' => $question->id,
                    'answer_text' => $answerText,
                    'answer_payload' => $answer['answer_payload'] ?? null,
                    'is_correct' => $isCorrect,
                    'earned_points' => $isCorrect ? 10 : 0,
                ]);
            });

            $answerEvents->each(function ($answer) use ($questionMap, $user, $quiz, $repetisi) {
                $question = $questionMap->get((int) $answer['question_id']);

                if (! $question) {
                    return;
                }

                $repetisi->catatJawabanSoal(
                    $user,
                    $question,
                    $this->isAnswerCorrect($answer['answer_text'] ?? '', $question->correct_answer),
                    $quiz
                );
            });

            return $attempt;
        });

        if ($module) {
            $passed = $attempt->score >= $passingScore
                && $wrongAttemptCount < $maxLives
                && $answeredUniqueCount >= $quiz->questions->count()
                && ! ($validated['finished_by_timeout'] ?? false);

            $progress = Progres::firstOrNew([
                'user_id' => $user->id,
                'module_id' => $module->id,
            ]);
            $wasCompleted = (bool) $progress->completed_at;

            $progress->score = max((int) ($progress->score ?? 0), (int) $attempt->score);

            if ($passed) {
                $progress->completed_at = $progress->completed_at ?: now();
            }

            $progress->save();

            if ($passed && ! $wasCompleted) {
                $this->notifyWeekUnlocked($user, $module, $attempt->score);
            }
        }

        event(new KuisSelesai($user, $quiz->id, $attempt->score, $attempt->xp_earned));

        if ($request->expectsJson()) {
            $finishUrl = $module?->programPembelajaran
                ? route('user.modul.program', $module->programPembelajaran->slug)
                : route('user.kelas.index');

            return response()->json([
                'attempt_id' => $attempt->id,
                'score' => $attempt->score,
                'xp_earned' => $rewardAlreadyGranted ? 0 : $attempt->xp_earned,
                'passed' => $passed,
                'completed_module' => $passed,
                'was_completed' => $wasCompleted,
                'answered_count' => $answeredUniqueCount,
                'total_questions' => $quiz->questions->count(),
                'wrong_attempt_count' => $wrongAttemptCount,
                'passing_score' => $passingScore,
                'finished_by_timeout' => (bool) ($validated['finished_by_timeout'] ?? false),
                'next_url' => $finishUrl,
                'message' => $passed
                    ? 'Kuis lulus. Progress modul berhasil diperbarui.'
                    : 'Kuis tersimpan. Ulangi sampai skor dan mastery cukup.',
            ]);
        }

        return redirect()->back()->with('success', 'Jawaban kuis berhasil dikirim.');
    }

    public function completeModule(Request $request, AksesPremiumService $aksesPremium)
    {
        $validated = $request->validate([
            'module_id' => ['required', 'exists:modules,id'],
            'score' => ['nullable', 'integer'],
        ]);

        $user = Auth::user();
        $module = Modul::where('status', 'published')->findOrFail($validated['module_id']);

        abort_unless($aksesPremium->bolehAksesModul($user, $module), 403);
        abort_if(
            $module->quizzes()->where('status', 'published')->whereHas('questions')->exists(),
            422,
            'Modul ini harus diselesaikan lewat kuis agar unlock roadmap tetap valid.'
        );

        $progress = Progres::firstOrCreate([
            'user_id' => $user->id,
            'module_id' => $module->id,
        ], [
            'score' => $validated['score'] ?? null,
            'completed_at' => now(),
        ]);

        return redirect()->back()->with('success', $progress->wasRecentlyCreated ? 'Modul ditandai selesai.' : 'Progress modul sudah tercatat.');
    }

    private function scoreAnswers($answers, $questionMap): int
    {
        return $answers
            ->filter(fn ($answer) => $questionMap->has((int) $answer['question_id']))
            ->filter(fn ($answer) => $this->isAnswerCorrect(
                $answer['answer_text'] ?? '',
                $questionMap->get((int) $answer['question_id'])->correct_answer
            ))
            ->count();
    }

    private function notifyWeekUnlocked($user, Modul $module, int $score): void
    {
        $program = $module->programPembelajaran;
        $nextModule = Modul::query()
            ->where('status', 'published')
            ->when($program, fn ($query) => $query->where('program_pembelajaran_id', $program->id))
            ->where('week_number', '>', (int) ($module->week_number ?? 0))
            ->orderBy('week_number')
            ->first();

        $targetModule = $nextModule ?: $module;
        $url = $program
            ? route('user.modul.program', $program->slug)
            : route('user.kelas.index');
        $title = $nextModule ? 'Minggu berikutnya terbuka' : 'Modul selesai';
        $message = $nextModule
            ? "Kamu lulus Week {$module->week_number} dengan skor {$score}. Week {$nextModule->week_number} sudah bisa dilanjutkan."
            : "Kamu lulus {$module->title} dengan skor {$score}.";

        app(NotifikasiPenggunaService::class)->kirimKePengguna(
            $user,
            $nextModule ? 'week_unlocked' : 'module_completed',
            $title,
            $message,
            $url,
            [
                'module_id' => $targetModule->id,
                'completed_module_id' => $module->id,
                'score' => $score,
                'dedupe_key' => 'module_completed:' . $module->id,
            ],
            'progress',
            'success',
            false
        );
    }

    private function xpForScore(int $score, int $total): int
    {
        if ($score <= 0 || $total <= 0) {
            return 0;
        }

        $percentage = $total > 0 ? $score / $total : 0;

        return match (true) {
            $percentage === 1.0 => 50,
            $percentage >= 0.8 => 35,
            $percentage >= 0.6 => 20,
            default => 10,
        };
    }

    private function isAnswerCorrect(string $answer, string $correctAnswer): bool
    {
        return $this->normalizeAnswer($answer) === $this->normalizeAnswer($correctAnswer);
    }

    private function normalizeAnswer(string $value): string
    {
        return mb_strtolower(trim(preg_replace('/\s+/u', ' ', $value)));
    }
}
