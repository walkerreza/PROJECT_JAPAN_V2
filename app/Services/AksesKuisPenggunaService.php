<?php

namespace App\Services;

use App\Models\Flashcard;
use App\Models\Kuis;
use App\Models\Pengguna;
use App\Models\ReviewFlashcard;
use App\Models\SetFlashcard;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;

class AksesKuisPenggunaService
{
    public function __construct(
        private AksesPremiumService $aksesPremium,
        private KloterBelajarService $kloterBelajar,
        private ProgresRoadmapService $roadmapProgress
    ) {}

    public function redirectJikaTerkunci(Pengguna $user, Kuis $quiz): ?RedirectResponse
    {
        $status = $this->status($user, $quiz);

        if (! $status['allowed']) {
            if ($status['reason'] === 'flashcard_required' && $status['flashcard_set']) {
                return redirect()
                    ->route('user.flashcards.show', $status['flashcard_set'])
                    ->with('warning', $status['message']);
            }

            if ($status['reason'] === 'flashcard_required' && $status['module']) {
                return redirect()
                    ->route('user.modul.lesson', $status['module']->id)
                    ->with('warning', $status['message']);
            }

            abort(403, $status['message']);
        }

        return null;
    }

    public function abortJikaTerkunci(Pengguna $user, Kuis $quiz): void
    {
        $status = $this->status($user, $quiz);

        abort_unless($status['allowed'], 403, $status['message']);
    }

    public function status(Pengguna $user, Kuis $quiz): array
    {
        $quiz->loadMissing('module.programPembelajaran');
        $module = $quiz->module;

        if (! $module || $module->status !== 'published') {
            return $this->blocked('module_unavailable', 'Modul kuis belum tersedia.', $module);
        }

        if (! $this->aksesPremium->bolehAksesModul($user, $module)) {
            return $this->blocked('subscription_required', 'Akses modul ini belum terbuka.', $module);
        }

        $programId = $module->program_pembelajaran_id;
        $kloter = $programId ? $this->kloterBelajar->kloterAktifUser($user, $programId) : null;
        $mingguAktif = $this->kloterBelajar->mingguAktif($kloter);

        if ($kloter && $mingguAktif !== null && (int) $module->week_number > $mingguAktif) {
            return $this->blocked('kloter_locked', 'Minggu ini belum terbuka untuk kloter kamu.', $module);
        }

        $isWeeklyExam = $quiz->isWeeklyExam();

        if ($quiz->day) {
            $dayAccess = $this->roadmapProgress->statusAksesHari($user, $quiz->day);
            if (! $dayAccess['allowed']) {
                return $this->blocked($dayAccess['reason'], $dayAccess['message'], $module);
            }
        } elseif ($module->days()->where('status', 'published')->exists() && ! $isWeeklyExam) {
            return $this->blocked(
                'quiz_not_assigned',
                'Kuis ini belum ditetapkan sebagai ujian Mingguan.',
                $module
            );
        } elseif ($isWeeklyExam) {
            if ($quiz->available_at?->isFuture()) {
                return $this->blocked(
                    'exam_scheduled',
                    'Ujian Mingguan dibuka '.$quiz->available_at->translatedFormat('d M Y H:i').'.',
                    $module
                );
            }

            $publishedDayIds = $module->days()
                ->where('status', 'published')
                ->pluck('id');
            $completedDayCount = $user->dayProgress()
                ->whereIn('module_day_id', $publishedDayIds)
                ->whereNotNull('completed_at')
                ->count();

            if ($completedDayCount !== $publishedDayIds->count()) {
                return $this->blocked(
                    'days_required',
                    'Selesaikan semua Hari sebelum mengikuti ujian Mingguan.',
                    $module
                );
            }

            return [
                'allowed' => true,
                'reason' => null,
                'message' => null,
                'module' => $module,
                'flashcard_set' => null,
                'flashcard_stats' => ['total' => 0, 'reviewed' => 0],
            ];
        }

        $flashcardSets = $this->flashcardSetsFor($module->id, $quiz->module_day_id);
        $flashcardSet = $flashcardSets->first();
        $flashcardStats = $this->flashcardStats($user->id, $flashcardSets);

        if ($flashcardStats['total'] > 0 && $flashcardStats['reviewed'] < $flashcardStats['total']) {
            $scope = $quiz->module_day_id ? 'Hari ini' : 'minggu ini';

            return $this->blocked('flashcard_required', "Review semua flashcard {$scope} untuk membuka kuis.", $module, $flashcardSet, $flashcardStats);
        }

        return [
            'allowed' => true,
            'reason' => null,
            'message' => null,
            'module' => $module,
            'flashcard_set' => $flashcardSet,
            'flashcard_stats' => $flashcardStats,
        ];
    }

    private function flashcardSetsFor(int $moduleId, ?int $moduleDayId = null): Collection
    {
        return SetFlashcard::where('module_id', $moduleId)
            ->when($moduleDayId, fn ($query) => $query->where('module_day_id', $moduleDayId))
            ->where('status', 'published')
            ->whereHas('flashcards')
            ->orderBy('id')
            ->get();
    }

    private function flashcardStats(int $userId, Collection $flashcardSets): array
    {
        if ($flashcardSets->isEmpty()) {
            return ['total' => 0, 'reviewed' => 0];
        }

        $cardIds = Flashcard::query()
            ->whereIn('flashcard_set_id', $flashcardSets->pluck('id'))
            ->pluck('id');

        return [
            'total' => $cardIds->count(),
            'reviewed' => ReviewFlashcard::where('user_id', $userId)
                ->whereIn('flashcard_id', $cardIds)
                ->distinct()
                ->count('flashcard_id'),
        ];
    }

    private function blocked(
        string $reason,
        string $message,
        $module,
        ?SetFlashcard $flashcardSet = null,
        ?array $flashcardStats = null
    ): array {
        return [
            'allowed' => false,
            'reason' => $reason,
            'message' => $message,
            'module' => $module,
            'flashcard_set' => $flashcardSet,
            'flashcard_stats' => $flashcardStats ?? ['total' => 0, 'reviewed' => 0],
        ];
    }
}
