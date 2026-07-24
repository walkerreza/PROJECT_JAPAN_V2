<?php

namespace App\Services;

use App\Models\Flashcard;
use App\Models\HariModul;
use App\Models\Kuis;
use App\Models\Modul;
use App\Models\Pengguna;
use App\Models\Progres;
use App\Models\ProgresHariModul;
use App\Models\ReviewFlashcard;
use App\Models\SetFlashcard;
use Illuminate\Support\Facades\DB;

class ProgresRoadmapService
{
    public function __construct(
        private readonly NotifikasiPenggunaService $notifikasi
    ) {}

    public function statusAksesHari(Pengguna $user, HariModul $day): array
    {
        $day->loadMissing('module');

        if ($day->status !== 'published') {
            return ['allowed' => false, 'reason' => 'day_unavailable', 'message' => 'Day ini belum tersedia.'];
        }

        $previousDay = HariModul::query()
            ->where('module_id', $day->module_id)
            ->where('status', 'published')
            ->where('day_number', '<', $day->day_number)
            ->orderByDesc('day_number')
            ->first();

        if ($previousDay && ! $this->hariSelesai($user, $previousDay)) {
            return ['allowed' => false, 'reason' => 'previous_day_required', 'message' => 'Selesaikan Day sebelumnya terlebih dahulu.'];
        }

        return ['allowed' => true, 'reason' => null, 'message' => null];
    }

    public function hariSelesai(Pengguna $user, HariModul $day): bool
    {
        return ProgresHariModul::query()
            ->where('user_id', $user->id)
            ->where('module_day_id', $day->id)
            ->whereNotNull('completed_at')
            ->exists();
    }

    public function selesaikanDariKuis(Pengguna $user, Kuis $quiz, int $score): array
    {
        $quiz->loadMissing('day.module');
        $day = $quiz->day;

        if (! $day || (int) $day->checkpoint_quiz_id !== (int) $quiz->id) {
            return ['day_completed' => false, 'module_completed' => false, 'was_module_completed' => false];
        }

        return $this->selesaikanHari($user, $day, $score);
    }

    public function selesaikanDariFlashcard(Pengguna $user, SetFlashcard $flashcardSet): array
    {
        $flashcardSet->loadMissing('day.module.programPembelajaran');
        $day = $flashcardSet->day;

        if (! $day || $day->checkpoint_quiz_id) {
            return $this->incompleteResult();
        }

        $cardIds = Flashcard::query()
            ->whereHas('set', fn ($query) => $query
                ->where('module_day_id', $day->id)
                ->where('status', 'published'))
            ->pluck('id');
        $reviewedCount = ReviewFlashcard::query()
            ->where('user_id', $user->id)
            ->whereIn('flashcard_id', $cardIds)
            ->distinct()
            ->count('flashcard_id');

        if ($cardIds->isEmpty() || $reviewedCount < $cardIds->count()) {
            return [
                ...$this->incompleteResult(),
                'flashcards_total' => $cardIds->count(),
                'flashcards_reviewed' => $reviewedCount,
            ];
        }

        return [
            ...$this->selesaikanHari($user, $day),
            'flashcards_total' => $cardIds->count(),
            'flashcards_reviewed' => $reviewedCount,
        ];
    }

    private function selesaikanHari(Pengguna $user, HariModul $day, ?int $score = null): array
    {
        return DB::transaction(function () use ($user, $day, $score) {
            $access = $this->statusAksesHari($user, $day);
            abort_unless($access['allowed'], 403, $access['message']);

            ProgresHariModul::updateOrCreate(
                ['user_id' => $user->id, 'module_day_id' => $day->id],
                ['score' => $score, 'completed_at' => now()]
            );

            $progress = Progres::firstOrNew([
                'user_id' => $user->id,
                'module_id' => $day->module_id,
            ]);
            $wasModuleCompleted = (bool) $progress->completed_at;
            $progress->score = max((int) ($progress->score ?? 0), (int) ($score ?? 0));

            $publishedDayIds = HariModul::query()
                ->where('module_id', $day->module_id)
                ->where('status', 'published')
                ->pluck('id');
            $completedDayCount = ProgresHariModul::query()
                ->where('user_id', $user->id)
                ->whereIn('module_day_id', $publishedDayIds)
                ->whereNotNull('completed_at')
                ->count();
            $moduleCompleted = $publishedDayIds->isNotEmpty() && $completedDayCount === $publishedDayIds->count();

            if ($moduleCompleted) {
                $progress->completed_at = $progress->completed_at ?: now();
            }

            $progress->save();

            if ($moduleCompleted && ! $wasModuleCompleted) {
                $this->notifyWeekUnlocked($user, $day->module, $score);
            }

            return [
                'day_completed' => true,
                'module_completed' => $moduleCompleted,
                'was_module_completed' => $wasModuleCompleted,
            ];
        });
    }

    public function notifyWeekUnlocked(Pengguna $user, Modul $module, ?int $score = null): void
    {
        $module->loadMissing('programPembelajaran');
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
        $scoreText = $score !== null ? " dengan skor {$score}" : '';
        $message = $nextModule
            ? "Kamu menyelesaikan Minggu {$module->week_number}{$scoreText}. Minggu {$nextModule->week_number} sudah bisa dilanjutkan."
            : "Kamu menyelesaikan {$module->title}{$scoreText}.";

        $this->notifikasi->kirimKePengguna(
            $user,
            $nextModule ? 'week_unlocked' : 'module_completed',
            $title,
            $message,
            $url,
            [
                'module_id' => $targetModule->id,
                'completed_module_id' => $module->id,
                'score' => $score,
                'dedupe_key' => 'module_completed:'.$module->id,
            ],
            'progress',
            'success',
            false
        );
    }

    private function incompleteResult(): array
    {
        return [
            'day_completed' => false,
            'module_completed' => false,
            'was_module_completed' => false,
        ];
    }
}
