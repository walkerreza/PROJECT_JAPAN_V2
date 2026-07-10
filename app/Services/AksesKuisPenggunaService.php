<?php

namespace App\Services;

use App\Models\Kuis;
use App\Models\Pengguna;
use App\Models\ReviewFlashcard;
use App\Models\SetFlashcard;
use Illuminate\Http\RedirectResponse;

class AksesKuisPenggunaService
{
    public function __construct(
        private AksesPremiumService $aksesPremium,
        private KloterBelajarService $kloterBelajar
    ) {
    }

    public function redirectJikaTerkunci(Pengguna $user, Kuis $quiz): ?RedirectResponse
    {
        $status = $this->status($user, $quiz);

        if (! $status['allowed']) {
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

        $flashcardSet = $this->firstFlashcardSetFor($module->id);
        $flashcardStats = $this->flashcardStats($user->id, $flashcardSet);

        if ($flashcardStats['total'] > 0 && $flashcardStats['reviewed'] < $flashcardStats['total']) {
            return $this->blocked('flashcard_required', 'Selesaikan flashcard dulu untuk membuka kuis minggu ini.', $module);
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

    private function firstFlashcardSetFor(int $moduleId): ?SetFlashcard
    {
        return SetFlashcard::where('module_id', $moduleId)
            ->where('status', 'published')
            ->whereHas('flashcards')
            ->orderBy('id')
            ->first();
    }

    private function flashcardStats(int $userId, ?SetFlashcard $flashcardSet): array
    {
        if (! $flashcardSet) {
            return ['total' => 0, 'reviewed' => 0];
        }

        $cardIds = $flashcardSet->flashcards()->pluck('id');

        return [
            'total' => $cardIds->count(),
            'reviewed' => ReviewFlashcard::where('user_id', $userId)
                ->whereIn('flashcard_id', $cardIds)
                ->count(),
        ];
    }

    private function blocked(string $reason, string $message, $module): array
    {
        return [
            'allowed' => false,
            'reason' => $reason,
            'message' => $message,
            'module' => $module,
            'flashcard_set' => null,
            'flashcard_stats' => ['total' => 0, 'reviewed' => 0],
        ];
    }
}
