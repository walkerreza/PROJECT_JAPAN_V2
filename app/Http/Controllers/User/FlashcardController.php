<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Flashcard;
use App\Models\SetFlashcard;
use App\Models\LogReward;
use App\Services\RepetisiPembelajaranService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class FlashcardController extends Controller
{
    public function show(SetFlashcard $flashcardSet)
    {
        abort_unless($flashcardSet->status === 'published', 404);

        $user = Auth::user();
        $flashcardSet->load(['flashcards.vocabulary', 'flashcards.reviews' => fn ($query) => $query->where('user_id', $user->id)]);

        $cards = $flashcardSet->flashcards->values()->map(function ($card) {
            $review = $card->reviews->first();

            return [
                'id' => $card->id,
                'front_text' => $card->front_text,
                'reading' => $card->reading,
                'back_text' => $card->back_text,
                'hint' => $card->hint,
                'example_sentence' => $card->example_sentence,
                'example_meaning' => $card->example_meaning,
                'audio_url' => $card->audio_url,
                'status' => $review?->status ?? 'new',
                'known_count' => $review?->known_count ?? 0,
                'learning_count' => $review?->learning_count ?? 0,
                'mastery_level' => $review?->mastery_level ?? 0,
                'correct_streak' => $review?->correct_streak ?? 0,
                'review_count' => $review?->review_count ?? 0,
                'next_review_at' => $review?->next_review_at?->toISOString(),
            ];
        });

        return Inertia::render('User/Flashcard/LatihanFlashcard', [
            'set' => [
                'id' => $flashcardSet->id,
                'title' => $flashcardSet->title,
                'description' => $flashcardSet->description,
            ],
            'cards' => $cards,
        ]);
    }

    public function review(Request $request, Flashcard $flashcard, RepetisiPembelajaranService $repetisi)
    {
        $validated = $request->validate([
            'action' => ['required', 'in:known,learning'],
            'completed' => ['nullable', 'boolean'],
        ]);

        $user = Auth::user();
        $repetisi->catatReviewFlashcard($user, $flashcard, $validated['action'] === 'known');

        if ($request->boolean('completed')) {
            $exists = LogReward::where('user_id', $user->id)
                ->where('source_type', 'flashcard')
                ->where('source_id', $flashcard->flashcard_set_id)
                ->exists();

            if (! $exists) {
                $user->increment('xp', 10);
                LogReward::create([
                    'user_id' => $user->id,
                    'source_type' => 'flashcard',
                    'source_id' => $flashcard->flashcard_set_id,
                    'xp_amount' => 10,
                    'description' => 'Menyelesaikan sesi flashcard.',
                ]);
            }
        }

        return redirect()->back()->with('success', 'Progres flashcard disimpan.');
    }
}
