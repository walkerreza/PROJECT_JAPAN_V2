<?php

namespace App\Services;

use App\Models\Flashcard;
use App\Models\Pengguna;
use App\Models\SetFlashcard;

class AksesFlashcardPenggunaService
{
    public function __construct(
        private readonly AksesPremiumService $aksesPremium,
        private readonly KloterBelajarService $kloterBelajar,
        private readonly ProgresRoadmapService $roadmapProgress
    ) {}

    public function abortJikaTerkunci(Pengguna $user, SetFlashcard $flashcardSet): void
    {
        $flashcardSet->loadMissing('module.programPembelajaran', 'day');

        abort_unless($flashcardSet->status === 'published', 404);
        abort_unless($flashcardSet->module?->status === 'published', 404);
        abort_unless(
            $this->aksesPremium->bolehAksesModul($user, $flashcardSet->module),
            403,
            'Akses flashcard ini belum terbuka.'
        );

        $module = $flashcardSet->module;
        $kloter = $module->program_pembelajaran_id
            ? $this->kloterBelajar->kloterAktifUser($user, $module->program_pembelajaran_id)
            : null;
        $mingguAktif = $this->kloterBelajar->mingguAktif($kloter);

        abort_if(
            $kloter && $mingguAktif !== null && (int) $module->week_number > $mingguAktif,
            403,
            'Minggu ini belum terbuka untuk kloter kamu.'
        );

        if ($flashcardSet->day) {
            $status = $this->roadmapProgress->statusAksesHari($user, $flashcardSet->day);
            abort_unless($status['allowed'], 403, $status['message']);
        }
    }

    public function abortJikaKartuTerkunci(Pengguna $user, Flashcard $flashcard): void
    {
        $flashcard->loadMissing('set.module');

        abort_unless($flashcard->set, 404);

        $this->abortJikaTerkunci($user, $flashcard->set);
    }
}
