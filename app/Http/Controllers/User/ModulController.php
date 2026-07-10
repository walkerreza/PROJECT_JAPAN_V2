<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\DeckPresentasi;
use App\Models\Flashcard;
use App\Models\Kuis;
use App\Models\Kosakata;
use App\Models\Modul;
use App\Models\PengerjaanKuis;
use App\Models\ProgramPembelajaran;
use App\Models\ReviewFlashcard;
use App\Models\SetFlashcard;
use App\Models\Soal;
use App\Services\AksesPremiumService;
use App\Services\AksesKuisPenggunaService;
use App\Services\KloterBelajarService;
use App\Services\PembelajaranPenggunaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ModulController extends Controller
{
    public function program(ProgramPembelajaran $program, AksesPremiumService $aksesPremium, KloterBelajarService $kloterService)
    {
        $user = Auth::user();

        abort_unless($program->status === 'published', 404);

        $moduls = $program->modules()
            ->with(['level'])
            ->where('status', 'published')
            ->orderBy('week_number')
            ->orderBy('id')
            ->get();
        $kloterAktif = $kloterService->kloterAktifUser($user, $program->id);
        $mingguAktifKloter = $kloterService->mingguAktif($kloterAktif);

        $completedModulIds = collect();

        $weeks = $moduls->values()->map(function (Modul $modul, int $index) use (&$completedModulIds, $user, $aksesPremium, $moduls, $program, $kloterAktif, $mingguAktifKloter) {
            $flashcardSet = $this->firstFlashcardSetFor($modul);
            $quiz = $this->firstQuizFor($modul);
            $flashcardStats = $this->flashcardStats($user->id, $flashcardSet);
            $quizStats = $this->quizStats($user->id, $quiz);
            $passingScore = (int) ($quiz?->passing_score ?? 70);
            $presentationCount = DeckPresentasi::where('module_id', $modul->id)
                ->where('status', 'published')
                ->whereHas('slides')
                ->count();
            $vocabularyCount = $this->vocabularyQueryForModules(collect([$modul->id]))->count('vocabulary_bank.id');

            $hasFlashcard = $flashcardStats['total'] > 0;
            $hasQuiz = (bool) $quiz;
            $hasPresentation = $presentationCount > 0;
            $hasVocabulary = $vocabularyCount > 0;
            $flashcardDone = ! $hasFlashcard || $flashcardStats['reviewed'] >= $flashcardStats['total'];
            $quizDone = ! $hasQuiz || $quizStats['done'];
            $quizUnlocked = (bool) $hasQuiz;
            $isDone = $hasQuiz ? $quizDone : ($hasFlashcard && $flashcardDone);
            $isSubscriptionLocked = ! $aksesPremium->bolehAksesModul($user, $modul);
            $isKloterLocked = $kloterAktif && $mingguAktifKloter !== null && (int) $modul->week_number > $mingguAktifKloter;
            $hasContent = $hasFlashcard || $hasQuiz || $hasPresentation || $hasVocabulary;
            $primaryUrl = null;
            $primaryLabel = 'Pilih Resource';

            if ($quiz && ! $quizDone) {
                $primaryUrl = route('user.modul.quiz', $modul->id);
                $primaryLabel = 'Mulai Sesi';
            } elseif ($quiz) {
                $primaryUrl = route('user.modul.quiz', $modul->id);
                $primaryLabel = 'Review Sesi';
            } elseif ($flashcardSet) {
                $primaryUrl = route('user.modul.lesson', $modul->id);
                $primaryLabel = 'Review Flashcard';
            }

            $status = 'unavailable';
            if (! $hasContent) {
                $status = 'unavailable';
            } elseif ($isDone) {
                $status = 'done';
                $completedModulIds->push($modul->id);
            } elseif ($index === 0 || $completedModulIds->contains($moduls[$index - 1]->id ?? null)) {
                $status = $isSubscriptionLocked ? 'locked' : 'active';
            }

            return [
                'id' => $modul->id,
                'title' => 'Week ' . ($modul->week_number ?? ($index + 1)) . ' - ' . $modul->title,
                'week_number' => $modul->week_number ?? ($index + 1),
                'subtitle' => $modul->description ?? 'Flashcard dan kuis mingguan.',
                'status' => $status,
                'is_premium' => (bool) $modul->level?->is_premium,
                'lock_reason' => ! $hasContent
                    ? 'Konten minggu ini belum tersedia.'
                    : ($isKloterLocked
                        ? 'Minggu ini belum terbuka untuk kloter kamu.'
                        : ($isSubscriptionLocked ? 'Preview gratis hanya membuka Week 1.' : 'Selesaikan minggu sebelumnya.')),
                'has_content' => $hasContent,
                'has_study_content' => $hasFlashcard || $hasQuiz,
                'flashcard_set_id' => $flashcardSet?->id,
                'quiz_id' => $quiz?->id,
                'flashcard_done' => $flashcardDone,
                'quiz_done' => $quizDone,
                'quiz_unlocked' => $quizUnlocked,
                'quiz_locked_reason' => null,
                'passing_score' => $passingScore,
                'flashcard_total' => $flashcardStats['total'],
                'flashcard_reviewed' => $flashcardStats['reviewed'],
                'questions_count' => $quiz?->questions()->count() ?? 0,
                'presentations_count' => $presentationCount,
                'vocabulary_count' => $vocabularyCount,
                'presentation_url' => $hasPresentation ? route('user.modul.program.presentasi', ['program' => $program->slug, 'module' => $modul->id]) : null,
                'vocabulary_url' => $hasVocabulary ? route('user.modul.program.kosakata', ['program' => $program->slug, 'module' => $modul->id]) : null,
                'flashcard_url' => $flashcardSet ? route('user.modul.lesson', $modul->id) : null,
                'quiz_url' => $quiz ? route('user.modul.quiz', $modul->id) : null,
                'primary_url' => $primaryUrl,
                'primary_label' => $primaryLabel,
                'best_score' => $quizStats['best_score'],
                'kloter_locked' => (bool) $isKloterLocked,
                'isFinal' => $index === $moduls->count() - 1,
            ];
        });

        $moduleIds = $moduls->pluck('id');
        $accessibleModuleIds = $moduls
            ->filter(fn (Modul $modul) => $aksesPremium->bolehAksesModul($user, $modul))
            ->pluck('id');
        $resourceWeek = $weeks->first(fn ($week) => in_array($week['status'], ['active', 'done'], true) && $week['has_content']);

        return Inertia::render('User/Modul/DaftarModul', [
            'weeks' => $weeks,
            'program' => [
                'id' => $program->id,
                'title' => $program->title,
                'slug' => $program->slug,
                'description' => $program->description,
                'level' => $program->level?->level_name,
                'resources' => [
                    'presentations_count' => DeckPresentasi::whereIn('module_id', $accessibleModuleIds)->where('status', 'published')->count(),
                    'vocabulary_count' => $this->vocabularyQueryForModules($accessibleModuleIds)->count('vocabulary_bank.id'),
                    'flashcard_count' => Flashcard::whereHas('set', fn ($query) => $query
                        ->whereIn('module_id', $accessibleModuleIds)
                        ->where('status', 'published'))
                        ->count(),
                    'quiz_count' => Kuis::whereIn('module_id', $accessibleModuleIds)
                        ->where('status', 'published')
                        ->whereHas('questions')
                        ->count(),
                    'presentations_url' => route('user.modul.program.presentasi', $program->slug),
                    'vocabulary_url' => route('user.modul.program.kosakata', $program->slug),
                    'flashcards_url' => $resourceWeek['flashcard_url'] ?? null,
                    'quizzes_url' => $resourceWeek['quiz_url'] ?? null,
                ],
                'kloter' => $kloterAktif ? [
                    'id' => $kloterAktif->id,
                    'nama' => $kloterAktif->nama,
                    'kode' => $kloterAktif->kode,
                    'admin_name' => $kloterAktif->admin?->username,
                    'tanggal_mulai' => optional($kloterAktif->tanggal_mulai)->format('d M Y'),
                    'minggu_aktif' => $mingguAktifKloter,
                ] : null,
            ],
            'back_url' => route('user.kelas.index'),
        ]);
    }

    public function kosakata(ProgramPembelajaran $program, Request $request, AksesPremiumService $aksesPremium)
    {
        $user = Auth::user();

        abort_unless($program->status === 'published', 404);

        $moduleIds = $this->accessibleModuleIdsForProgram($program, $user, $aksesPremium);
        $selectedModuleId = $this->selectedAccessibleModuleId($request, $moduleIds);
        $queryModuleIds = $selectedModuleId ? collect([$selectedModuleId]) : $moduleIds;
        $query = $this->vocabularyQueryForModules($queryModuleIds);

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($query) use ($search) {
                $query->where('word', 'like', "%{$search}%")
                    ->orWhere('reading', 'like', "%{$search}%")
                    ->orWhere('meaning_id', 'like', "%{$search}%")
                    ->orWhere('meaning_en', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->filled('jlpt_level') && $request->jlpt_level !== 'all') {
            $query->where('jlpt_level', $request->jlpt_level);
        }

        $categories = $this->vocabularyQueryForModules($queryModuleIds)
            ->whereNotNull('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->filter()
            ->values();

        return Inertia::render('User/KosakataPage', [
            'program' => [
                'title' => $program->title,
                'slug' => $program->slug,
                'level' => $program->level?->level_name,
                'roadmap_url' => route('user.modul.program', $program->slug),
            ],
            'modules' => $program->modules()
                ->whereIn('id', $moduleIds)
                ->orderBy('week_number')
                ->get(['id', 'title', 'week_number']),
            'selected_module_id' => $selectedModuleId,
            'vocabulary' => $query
                ->orderBy('jlpt_level')
                ->orderBy('word')
                ->paginate(18)
                ->withQueryString(),
            'filters' => $request->only('search', 'category', 'jlpt_level', 'module'),
            'categories' => $categories,
        ]);
    }

    public function presentasi(ProgramPembelajaran $program, Request $request, AksesPremiumService $aksesPremium)
    {
        $user = Auth::user();

        abort_unless($program->status === 'published', 404);

        $moduleIds = $this->accessibleModuleIdsForProgram($program, $user, $aksesPremium);
        $selectedModuleId = $this->selectedAccessibleModuleId($request, $moduleIds);
        $queryModuleIds = $selectedModuleId ? collect([$selectedModuleId]) : $moduleIds;

        $decks = DeckPresentasi::with(['module:id,title,week_number', 'slides'])
            ->withCount('slides')
            ->whereIn('module_id', $queryModuleIds)
            ->where('status', 'published')
            ->orderBy('module_id')
            ->orderBy('id')
            ->get();

        return Inertia::render('User/PresentasiPage', [
            'program' => [
                'title' => $program->title,
                'slug' => $program->slug,
                'level' => $program->level?->level_name,
                'roadmap_url' => route('user.modul.program', $program->slug),
            ],
            'modules' => $program->modules()
                ->whereIn('id', $moduleIds)
                ->orderBy('week_number')
                ->get(['id', 'title', 'week_number']),
            'selected_module_id' => $selectedModuleId,
            'decks' => $decks,
        ]);
    }

    public function lesson($weekId, AksesPremiumService $aksesPremium)
    {
        $user = Auth::user();

        $modul = Modul::where('status', 'published')->findOrFail($weekId);

        abort_unless($aksesPremium->bolehAksesModul($user, $modul), 403);

        $flashcardSet = $this->firstFlashcardSetFor($modul);

        if (! $flashcardSet) {
            return redirect()->route('user.modul.quiz', $modul->id);
        }

        $cards = $flashcardSet
            ? $flashcardSet->flashcards()
                ->with(['reviews' => fn ($query) => $query->where('user_id', $user->id)])
                ->orderBy('order')
                ->get()
                ->map(fn ($card) => [
                    'id' => $card->id,
                    'front_text' => $card->front_text,
                    'back_text' => $card->back_text,
                    'reading' => $card->reading,
                    'audio_url' => $card->audio_url,
                    'example_sentence' => $card->example_sentence,
                    'example_meaning' => $card->example_meaning,
                    'status' => $card->reviews->first()?->status ?? 'new',
                    'mastery_level' => $card->reviews->first()?->mastery_level ?? 0,
                    'correct_streak' => $card->reviews->first()?->correct_streak ?? 0,
                    'review_count' => $card->reviews->first()?->review_count ?? 0,
                    'next_review_at' => $card->reviews->first()?->next_review_at?->toISOString(),
                ])
            : collect();

        return Inertia::render('User/Flashcard/LatihanFlashcard', [
            'set' => [
                'id' => $flashcardSet->id,
                'title' => $flashcardSet->title,
                'description' => $flashcardSet->description,
            ],
            'cards' => $cards,
            'back_url' => $modul->programPembelajaran
                ? route('user.modul.program', $modul->programPembelajaran->slug)
                : route('user.kelas.index'),
            'next_url' => route('user.modul.quiz', $modul->id),
            'next_label' => 'Lanjut ke Kuis',
        ]);
    }

    public function quiz(
        $weekId,
        AksesPremiumService $aksesPremium,
        PembelajaranPenggunaService $learning,
        AksesKuisPenggunaService $aksesKuis
    )
    {
        $user = Auth::user();
        $modul = Modul::where('status', 'published')->findOrFail($weekId);

        abort_unless($aksesPremium->bolehAksesModul($user, $modul), 403);

        $quiz = $this->firstQuizFor($modul, true);

        abort_unless($quiz, 404, 'Kuis modul belum tersedia.');

        if ($redirect = $aksesKuis->redirectJikaTerkunci($user, $quiz)) {
            return $redirect;
        }

        $payload = $learning->quizPayload($user, $quiz);

        return Inertia::render('User/Kuis/KerjakanKuis', $payload + [
            'module_flow' => true,
            'back_url' => $modul->programPembelajaran
                ? route('user.modul.program', $modul->programPembelajaran->slug)
                : route('user.kelas.index'),
            'finish_url' => $modul->programPembelajaran
                ? route('user.modul.program', $modul->programPembelajaran->slug)
                : route('user.kelas.index'),
        ]);
    }

    public function checkQuestion(Request $request, Soal $question, AksesKuisPenggunaService $aksesKuis)
    {
        $validated = $request->validate([
            'answer' => ['required', 'string', 'max:2000'],
        ]);

        $question->load('quiz.module');

        abort_unless($question->quiz?->status === 'published', 404);
        $aksesKuis->abortJikaTerkunci($request->user(), $question->quiz);

        return response()->json([
            'is_correct' => $this->isAnswerCorrect($validated['answer'], (string) $question->correct_answer),
            'explanation' => $question->explanation,
        ]);
    }

    private function firstFlashcardSetFor(Modul $modul): ?SetFlashcard
    {
        return SetFlashcard::where('module_id', $modul->id)
            ->where('status', 'published')
            ->whereHas('flashcards')
            ->orderBy('id')
            ->first();
    }

    private function firstQuizFor(Modul $modul, bool $withQuestions = false): ?Kuis
    {
        $query = Kuis::query()
            ->where('module_id', $modul->id)
            ->where('status', 'published')
            ->whereHas('questions')
            ->orderBy('id');

        if ($withQuestions) {
            $query->with(['questions' => fn ($query) => $query->orderBy('order')]);
        }

        return $query->first();
    }

    private function flashcardStats(int $userId, ?SetFlashcard $flashcardSet): array
    {
        if (! $flashcardSet) {
            return ['total' => 0, 'reviewed' => 0];
        }

        $cardIds = Flashcard::where('flashcard_set_id', $flashcardSet->id)->pluck('id');

        return [
            'total' => $cardIds->count(),
            'reviewed' => ReviewFlashcard::where('user_id', $userId)
                ->whereIn('flashcard_id', $cardIds)
                ->count(),
        ];
    }

    private function quizStats(int $userId, ?Kuis $quiz): array
    {
        if (! $quiz) {
            return ['done' => false, 'best_score' => null];
        }

        $bestScore = PengerjaanKuis::where('user_id', $userId)
            ->where('quiz_id', $quiz->id)
            ->max('score');

        return [
            'done' => $bestScore !== null && (int) $bestScore >= (int) ($quiz->passing_score ?? 70),
            'best_score' => $bestScore,
        ];
    }

    private function accessibleModuleIdsForProgram(ProgramPembelajaran $program, $user, AksesPremiumService $aksesPremium)
    {
        return $program->modules()
            ->where('status', 'published')
            ->get()
            ->filter(fn (Modul $modul) => $aksesPremium->bolehAksesModul($user, $modul))
            ->pluck('id');
    }

    private function selectedAccessibleModuleId(Request $request, $moduleIds): ?int
    {
        if (! $request->filled('module')) {
            return null;
        }

        $moduleId = $request->integer('module');

        return $moduleIds->contains($moduleId) ? $moduleId : null;
    }

    private function vocabularyQueryForModules($moduleIds)
    {
        return Kosakata::query()
            ->select('vocabulary_bank.*')
            ->where('status', 'published')
            ->whereHas('flashcards.set', fn ($query) => $query
                ->whereIn('module_id', $moduleIds)
                ->where('status', 'published'))
            ->distinct();
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
