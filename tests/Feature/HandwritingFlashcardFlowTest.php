<?php

use App\Models\Kuis;
use App\Models\Pengguna;
use App\Models\ReviewFlashcard;
use App\Models\SetFlashcard;
use App\Models\Soal;
use App\Services\PembelajaranPenggunaService;
use Database\Seeders\KelasDemoSeeder;

it('prioritizes due flashcards and excludes legacy handwriting questions from quiz payloads', function () {
    $this->seed(KelasDemoSeeder::class);

    $user = Pengguna::factory()->create(['role' => 'user']);
    $quiz = Kuis::query()
        ->whereNotNull('module_day_id')
        ->with(['module', 'questions'])
        ->firstOrFail();
    $set = SetFlashcard::query()
        ->where('module_id', $quiz->module_id)
        ->where('module_day_id', $quiz->module_day_id)
        ->whereHas('flashcards')
        ->with('flashcards')
        ->firstOrFail();
    $dueCard = $set->flashcards->first();

    ReviewFlashcard::create([
        'user_id' => $user->id,
        'flashcard_id' => $dueCard->id,
        'status' => 'learning',
        'next_review_at' => now()->subMinute(),
    ]);
    Soal::create([
        'quiz_id' => $quiz->id,
        'type' => 'handwriting',
        'question_text' => 'Soal handwriting lama.',
        'correct_answer' => '新',
        'options' => ['practice_only' => true],
        'order' => 99,
        'points' => 1,
    ]);
    $quiz->load('questions');

    $payload = app(PembelajaranPenggunaService::class)->quizPayload($user, $quiz);

    expect($payload['questions']->pluck('type'))->not->toContain('handwriting')
        ->and($payload['flashcards'])->not->toBeEmpty()
        ->and($payload['flashcards']->first()['id'])->toBe($dueCard->id)
        ->and($payload['flashcards']->first()['review_due'])->toBeTrue();
});

it('cleans legacy handwriting questions only when force is supplied', function () {
    $this->seed(KelasDemoSeeder::class);

    $quiz = Kuis::query()->firstOrFail();
    $regularQuestionId = $quiz->questions()->firstOrFail()->id;
    Soal::create([
        'quiz_id' => $quiz->id,
        'type' => 'handwriting',
        'question_text' => 'Soal handwriting lama.',
        'correct_answer' => '新',
        'options' => ['practice_only' => true],
        'order' => 99,
        'points' => 1,
    ]);

    $this->artisan('questions:cleanup-handwriting', ['--dry-run' => true])
        ->assertSuccessful();
    expect(Soal::query()->where('type', 'handwriting')->count())->toBe(1);

    $this->artisan('questions:cleanup-handwriting', ['--force' => true])
        ->assertSuccessful();

    expect(Soal::query()->where('type', 'handwriting')->count())->toBe(0)
        ->and(Soal::query()->whereKey($regularQuestionId)->exists())->toBeTrue();
});
