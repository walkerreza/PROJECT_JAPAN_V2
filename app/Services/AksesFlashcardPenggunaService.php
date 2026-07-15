<?php

namespace App\Services;

use App\Models\Flashcard;
use App\Models\Pengguna;
use App\Models\SetFlashcard;

class AksesFlashcardPenggunaService
{
    public function __construct(private readonly AksesPremiumService $aksesPremium) {}

    public function abortJikaTerkunci(Pengguna $user, SetFlashcard $flashcardSet): void
    {
        $flashcardSet->loadMissing('module');

        abort_unless($flashcardSet->status === 'published', 404);
        abort_unless($flashcardSet->module?->status === 'published', 404);
        abort_unless(
            $this->aksesPremium->bolehAksesModul($user, $flashcardSet->module),
            403,
            'Akses flashcard ini belum terbuka.'
        );
    }

    public function abortJikaKartuTerkunci(Pengguna $user, Flashcard $flashcard): void
    {
        $flashcard->loadMissing('set.module');

        abort_unless($flashcard->set, 404);

        $this->abortJikaTerkunci($user, $flashcard->set);
    }
}
