<?php

namespace Tests\Unit;

use App\Services\SoalKuisService;
use Tests\TestCase;

class SoalKuisHandwritingTest extends TestCase
{
    public function test_n3_kanji_and_kana_assets_are_available(): void
    {
        $characters = collect(app(SoalKuisService::class)->writingCharacters('環かな'))
            ->pluck('character');

        $this->assertSame(['環', 'か', 'な'], $characters->all());
    }

    public function test_handwriting_cannot_be_normalized_as_a_quiz_question(): void
    {
        $payload = app(SoalKuisService::class)->normalizePayload([
            'type' => 'handwriting',
            'question_text' => 'Tulis karakter lingkungan.',
            'correct_answer' => '環',
            'options' => [],
            'points' => 50,
        ], 0);

        $this->assertNotNull($payload['error']);
        $this->assertSame('handwriting', $payload['type']);
        $this->assertStringContainsString('flashcard', $payload['error']);
        $this->assertNull($payload['options']);
    }
}
