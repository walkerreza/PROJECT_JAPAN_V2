<?php

namespace App\Services;

use App\Models\Kuis;
use App\Models\Pengguna;
use App\Models\ReviewSoal;
use App\Models\SetFlashcard;
use Illuminate\Support\Collection;

class PembelajaranPenggunaService
{
    public function __construct(
        private AksesKuisPenggunaService $aksesKuis
    ) {
    }

    public function quizLobby(Pengguna $user): Collection
    {
        $quizzes = Kuis::with('module.level')
            ->withCount('questions')
            ->where('status', 'published')
            ->whereHas('module', fn ($query) => $query->where('status', 'published'))
            ->get();

        $completedModuleIds = $this->completedModuleIds($user);

        return $quizzes->map(function (Kuis $quiz) use ($completedModuleIds, $user) {
            $module = $quiz->module;
            $accessStatus = $this->aksesKuis->status($user, $quiz);

            return [
                'id' => $quiz->id,
                'title' => $this->quizTitle($quiz),
                'description' => $quiz->description ?? 'Kuis evaluasi modul mingguan.',
                'xpReward' => 50,
                'durationEstimate' => $this->durationEstimate($quiz->time_limit),
                'totalQuestions' => $quiz->questions_count,
                'level' => $module?->level?->level_name ?? 'General',
                'isPremium' => (bool) ($module?->level?->is_premium),
                'status' => $accessStatus['allowed'] ? 'available' : 'locked',
                'lockReason' => $accessStatus['reason'],
                'isCompleted' => $module ? in_array($module->id, $completedModuleIds, true) : false,
            ];
        });
    }

    public function quizPayload(Pengguna $user, Kuis $quiz): array
    {
        $module = $quiz->module;
        $questionReviews = ReviewSoal::where('user_id', $user->id)
            ->whereIn('question_id', $quiz->questions->pluck('id'))
            ->get()
            ->keyBy('question_id');

        return [
            'quiz' => [
                'id' => $quiz->id,
                'type' => $quiz->type,
                'time_limit' => $quiz->time_limit,
                'passing_score' => $quiz->passing_score ?? 70,
                'lesson' => [
                    'id' => $module?->id,
                    'title' => $module?->title ?? 'Modul Mingguan',
                ],
                'module' => [
                    'id' => $module?->id,
                    'title' => $module?->title,
                    'week_number' => $module?->week_number,
                ],
            ],
            'questions' => $quiz->questions->map(function ($question) use ($questionReviews) {
                $review = $questionReviews->get($question->id);

                return [
                    'id' => $question->id,
                    'question' => $question->question_text,
                    'kanji' => '',
                    'type' => $question->type,
                    'options' => $question->options,
                    'audio_url' => $question->audio_url,
                    'review_status' => $review?->status ?? 'new',
                    'mastery_level' => $review?->mastery_level ?? 0,
                    'correct_streak' => $review?->correct_streak ?? 0,
                    'review_count' => $review?->review_count ?? 0,
                    'next_review_at' => $review?->next_review_at?->toISOString(),
                    'review_due' => $review?->next_review_at ? $review->next_review_at->isPast() : false,
                ];
            }),
            'flashcards' => $this->quizFlashcards($quiz),
        ];
    }

    public function hasCompletedModule(Pengguna $user, ?int $moduleId): bool
    {
        if (! $moduleId) {
            return true;
        }

        return $user->progress()
            ->where('module_id', $moduleId)
            ->whereNotNull('completed_at')
            ->exists();
    }

    private function completedModuleIds(Pengguna $user): array
    {
        return $user->progress()
            ->whereNotNull('completed_at')
            ->pluck('module_id')
            ->all();
    }

    private function quizTitle(Kuis $quiz): string
    {
        $moduleTitle = $quiz->module?->title;
        $type = str($quiz->type)->replace('_', ' ')->title();

        return $moduleTitle ? "Kuis {$moduleTitle} ({$type})" : "Kuis {$type}";
    }

    private function durationEstimate(?int $timeLimit): string
    {
        if (! $timeLimit) {
            return '10 Menit';
        }

        return max(1, (int) ceil($timeLimit / 60)) . ' Menit';
    }

    private function quizFlashcards(Kuis $quiz): Collection
    {
        $moduleId = $quiz->module_id;
        $levelId = $quiz->module?->level_id;

        $sets = SetFlashcard::with('flashcards')
            ->where('status', 'published')
            ->whereHas('flashcards')
            ->where(function ($query) use ($moduleId, $levelId) {
                if ($moduleId) {
                    $query->where('module_id', $moduleId);
                }

                if ($levelId) {
                    $moduleId ? $query->orWhere('level_id', $levelId) : $query->where('level_id', $levelId);
                }
            })
            ->get()
            ->sortBy(function (SetFlashcard $set) use ($moduleId, $levelId) {
                return match (true) {
                    $moduleId && $set->module_id === $moduleId => 1,
                    $levelId && $set->level_id === $levelId => 2,
                    default => 3,
                };
            });

        return $sets
            ->flatMap(fn (SetFlashcard $set) => $set->flashcards)
            ->unique('id')
            ->take(5)
            ->values()
            ->map(fn ($card) => [
                'id' => $card->id,
                'front_text' => $card->front_text,
                'reading' => $card->reading,
                'back_text' => $card->back_text,
                'hint' => $card->hint,
                'example_sentence' => $card->example_sentence,
                'example_meaning' => $card->example_meaning,
                'audio_url' => $card->audio_url,
            ]);
    }
}
