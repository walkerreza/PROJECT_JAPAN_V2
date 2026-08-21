<?php

namespace App\Services;

use App\Models\Soal;

class PenilaianJawabanKuisService
{
    public function benar(Soal $question, ?string $answer = null, array $payload = []): bool
    {
        if ($this->soalLatihan($question)) {
            return $this->handwritingDikuasai($payload, $question);
        }

        return $this->jawabanSama((string) $answer, (string) $question->correct_answer);
    }

    public function soalLatihan(Soal $question): bool
    {
        return $question->type === 'handwriting'
            || (bool) data_get($question->options, 'practice_only', false);
    }

    public function jawabanSama(string $answer, string $correctAnswer): bool
    {
        return $this->normalisasi($answer) === $this->normalisasi($correctAnswer);
    }

    public function handwritingDikuasai(array $payload, ?Soal $question = null): bool
    {
        $completed = (int) ($payload['completed_strokes'] ?? 0);
        $total = (int) ($payload['total_strokes'] ?? 0);
        $expected = (int) data_get($question?->options, 'stroke_count', $total);

        return $expected > 0
            && $completed >= $expected
            && ! (bool) ($payload['revealed'] ?? false);
    }

    private function normalisasi(string $value): string
    {
        return mb_strtolower(trim(preg_replace('/\s+/u', ' ', $value)));
    }
}
