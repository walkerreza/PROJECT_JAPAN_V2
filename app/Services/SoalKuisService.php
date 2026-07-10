<?php

namespace App\Services;

use App\Models\Kuis;
use App\Models\Kosakata;
use App\Models\Soal;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SoalKuisService
{
    public function importHeaders(): array
    {
        return ['type', 'question_text', 'correct_answer', 'options', 'explanation', 'audio_url'];
    }

    public function syncQuestions(Kuis $quiz, array $validated): void
    {
        $questionIds = [];

        DB::transaction(function () use ($quiz, $validated, &$questionIds) {
            $quiz->update([
                'time_limit' => $validated['time_limit'] ?? null,
            ]);

            foreach ($validated['questions'] as $index => $data) {
                $normalized = $this->normalizePayload($data, $index);

                if ($normalized['error']) {
                    throw ValidationException::withMessages([
                        'questions' => $normalized['error'],
                    ]);
                }

                $question = $quiz->questions()->updateOrCreate(
                    ['id' => $data['id'] ?? null],
                    [
                        'type' => $normalized['type'],
                        'question_text' => $normalized['question_text'],
                        'correct_answer' => $normalized['correct_answer'],
                        'options' => $normalized['options'],
                        'explanation' => $normalized['explanation'],
                        'audio_url' => $normalized['audio_url'],
                        'order' => $index,
                    ]
                );

                $questionIds[] = $question->id;
            }

            $quiz->questions()->whereNotIn('id', $questionIds)->delete();
        });
    }

    public function importRows(Kuis $quiz, array $rows): int
    {
        $nextOrder = (int) $quiz->questions()->max('order') + 1;
        $created = 0;

        DB::transaction(function () use ($rows, $quiz, $nextOrder, &$created) {
            foreach ($rows as $index => $row) {
                $normalized = $this->normalizeImportRow($quiz, $row, $index);

                if ($normalized['error']) {
                    continue;
                }

                Soal::create([
                    'quiz_id' => $quiz->id,
                    'type' => $normalized['type'],
                    'question_text' => $normalized['question_text'],
                    'correct_answer' => $normalized['correct_answer'],
                    'options' => $normalized['options'],
                    'explanation' => $normalized['explanation'],
                    'audio_url' => $normalized['audio_url'],
                    'order' => $nextOrder + $index,
                ]);

                $created++;
            }
        });

        return $created;
    }

    public function previewRows(Kuis $quiz, array $rows): array
    {
        $validRows = [];
        $errors = [];

        foreach ($rows as $index => $row) {
            $normalized = $this->normalizeImportRow($quiz, $row, $index);

            if ($normalized['error']) {
                $errors[] = [
                    'row' => $index + 2,
                    'message' => $normalized['error'],
                    'question_text' => $normalized['question_text'],
                ];
                continue;
            }

            $validRows[] = [
                'row' => $index + 2,
                'type' => $normalized['type'],
                'question_text' => $normalized['question_text'],
                'correct_answer' => $normalized['correct_answer'],
                'options' => $normalized['options'] ?? [],
                'explanation' => $normalized['explanation'],
                'audio_url' => $normalized['audio_url'],
            ];
        }

        return [
            'total_rows' => count($rows),
            'valid_count' => count($validRows),
            'invalid_count' => count($errors),
            'valid_rows' => array_slice($validRows, 0, 10),
            'errors' => array_slice($errors, 0, 30),
            'has_more_valid_rows' => count($validRows) > 10,
            'has_more_errors' => count($errors) > 30,
        ];
    }

    public function generateFromVocabulary(Kuis $quiz, array $filters): int
    {
        $mode = $filters['mode'] ?? 'word_to_meaning';
        $count = min(50, max(1, (int) ($filters['count'] ?? 10)));
        $status = $filters['status'] ?? 'published';

        $query = Kosakata::query()
            ->whereNotNull('word')
            ->where('word', '!=', '')
            ->when(! empty($filters['jlpt_level']) && $filters['jlpt_level'] !== 'all', fn ($query) => $query->where('jlpt_level', $filters['jlpt_level']))
            ->when(! empty($filters['category']) && $filters['category'] !== 'all', fn ($query) => $query->where('category', $filters['category']))
            ->when($status !== 'all', fn ($query) => $query->where('status', $status));

        if (in_array($mode, ['word_to_meaning', 'meaning_to_word'], true)) {
            $query->where(function ($query) {
                $query->whereNotNull('meaning_id')->where('meaning_id', '!=', '')
                    ->orWhere(fn ($query) => $query->whereNotNull('meaning_en')->where('meaning_en', '!=', ''));
            });
        }

        if ($mode === 'reading_to_word') {
            $query->whereNotNull('reading')->where('reading', '!=', '');
        }

        $pool = $query
            ->inRandomOrder()
            ->limit(max(20, $count * 4))
            ->get();

        if ($pool->count() < 2) {
            throw ValidationException::withMessages([
                'generate' => 'Kosakata belum cukup untuk membuat soal. Minimal butuh 2 kosakata valid.',
            ]);
        }

        $nextOrder = (int) $quiz->questions()->max('order') + 1;
        $created = 0;

        DB::transaction(function () use ($quiz, $pool, $mode, $count, $nextOrder, &$created) {
            foreach ($pool->take($count) as $vocabulary) {
                $payload = $this->questionPayloadFromVocabulary($vocabulary, $pool, $mode);

                if (! $payload) {
                    continue;
                }

                Soal::create([
                    'quiz_id' => $quiz->id,
                    'type' => 'multiple_choice',
                    'question_text' => $payload['question_text'],
                    'correct_answer' => $payload['correct_answer'],
                    'options' => $payload['options'],
                    'explanation' => $payload['explanation'],
                    'audio_url' => $payload['audio_url'],
                    'order' => $nextOrder + $created,
                ]);

                $created++;
            }
        });

        if ($created === 0) {
            throw ValidationException::withMessages([
                'generate' => 'Tidak ada kosakata valid yang bisa dijadikan soal.',
            ]);
        }

        return $created;
    }

    public function templateRows(): array
    {
        return [
            ['multiple_choice', 'Apa arti dari kanji 火?', 'api', 'api|air|tanah|angin', '火 berarti api. Untuk multiple_choice, correct_answer harus sama persis dengan salah satu opsi.', ''],
            ['fill_blank', '彼は___に行きました。', '学校', 'がっこう', 'Gunakan ___ untuk bagian kosong. Kolom options dipakai sebagai hint opsional.', ''],
            ['listening', 'Ketik kata yang kamu dengar dari audio.', '天気予報', '', 'Untuk listening, audio_url wajib diisi.', 'https://example.com/audio.mp3'],
        ];
    }

    public function normalizeType(?string $type): string
    {
        $type = strtolower(trim((string) $type));

        return match ($type) {
            'fill_blank', 'fill-in-blank', 'fill in blank', 'typing' => 'fill_blank',
            'listening', 'listen' => 'listening',
            default => 'multiple_choice',
        };
    }

    public function normalizePayload(array $data, int $index): array
    {
        $type = $this->normalizeType($data['type'] ?? 'multiple_choice');
        $questionText = trim((string) ($data['question_text'] ?? ''));
        $correctAnswer = trim((string) ($data['correct_answer'] ?? ''));
        $audioUrl = trim((string) ($data['audio_url'] ?? ''));
        $options = array_values(array_unique(array_filter(array_map(
            fn ($option) => trim((string) $option),
            $data['options'] ?? []
        ), fn ($option) => $option !== '')));

        $number = $index + 1;
        $error = null;

        if ($type === 'multiple_choice') {
            if (count($options) < 2) {
                $error = "Soal {$number}: multiple choice wajib memiliki minimal 2 opsi.";
            } elseif (! in_array($correctAnswer, $options, true)) {
                $error = "Soal {$number}: jawaban benar wajib sama dengan salah satu opsi.";
            }
        }

        if ($type === 'listening' && $audioUrl === '') {
            $error = "Soal {$number}: listening wajib memiliki Audio URL.";
        }

        return [
            'error' => $error,
            'type' => $type,
            'question_text' => $questionText,
            'correct_answer' => $correctAnswer,
            'options' => $type === 'multiple_choice' ? $options : ($type === 'fill_blank' ? array_slice($options, 0, 1) : null),
            'explanation' => $data['explanation'] ?? null,
            'audio_url' => $audioUrl !== '' ? $audioUrl : null,
        ];
    }

    private function parseOptions(array $row): ?array
    {
        if (! empty($row['options'])) {
            $options = preg_split('/\s*\|\s*/', (string) $row['options']);
        } else {
            $options = [
                $row['option_a'] ?? $row['opsi_a'] ?? null,
                $row['option_b'] ?? $row['opsi_b'] ?? null,
                $row['option_c'] ?? $row['opsi_c'] ?? null,
                $row['option_d'] ?? $row['opsi_d'] ?? null,
            ];
        }

        $options = array_values(array_filter(array_map(
            fn ($option) => trim((string) $option),
            $options
        ), fn ($option) => $option !== ''));

        return count($options) > 0 ? $options : null;
    }

    private function normalizeImportRow(Kuis $quiz, array $row, int $index): array
    {
        $questionText = trim((string) ($row['question_text'] ?? $row['question'] ?? $row['soal'] ?? ''));
        $correctAnswer = trim((string) ($row['correct_answer'] ?? $row['answer'] ?? $row['jawaban_benar'] ?? ''));
        $type = $this->normalizeType($row['type'] ?? $row['tipe'] ?? $quiz->type);
        $options = $this->parseOptions($row);

        if ($questionText === '' || $correctAnswer === '') {
            $missing = $questionText === '' ? 'question_text' : 'correct_answer';

            return [
                'error' => 'Baris ' . ($index + 2) . ": kolom {$missing} wajib diisi.",
                'type' => $type,
                'question_text' => $questionText,
                'correct_answer' => $correctAnswer,
                'options' => $options,
                'explanation' => $row['explanation'] ?? $row['pembahasan'] ?? null,
                'audio_url' => $row['audio_url'] ?? null,
            ];
        }

        $normalized = $this->normalizePayload([
            'type' => $type,
            'question_text' => $questionText,
            'correct_answer' => $correctAnswer,
            'options' => $options,
            'explanation' => $row['explanation'] ?? $row['pembahasan'] ?? null,
            'audio_url' => $row['audio_url'] ?? null,
        ], $index);

        if ($normalized['error']) {
            $normalized['error'] = str_replace('Soal ' . ($index + 1) . ':', 'Baris ' . ($index + 2) . ':', $normalized['error']);
        }

        return $normalized;
    }

    private function questionPayloadFromVocabulary(Kosakata $vocabulary, $pool, string $mode): ?array
    {
        $meaning = trim((string) ($vocabulary->meaning_id ?: $vocabulary->meaning_en));
        $reading = trim((string) $vocabulary->reading);

        if ($mode === 'meaning_to_word') {
            if ($meaning === '') {
                return null;
            }

            $correct = $vocabulary->word;
            $options = $this->optionsFromVocabularyPool($pool, $correct, 'word');

            return [
                'question_text' => "Pilih kosakata Jepang untuk arti: {$meaning}",
                'correct_answer' => $correct,
                'options' => $options,
                'explanation' => $this->vocabularyExplanation($vocabulary),
                'audio_url' => $vocabulary->audio_url,
            ];
        }

        if ($mode === 'reading_to_word') {
            if ($reading === '') {
                return null;
            }

            $correct = $vocabulary->word;
            $options = $this->optionsFromVocabularyPool($pool, $correct, 'word');

            return [
                'question_text' => "Pilih kosakata untuk reading: {$reading}",
                'correct_answer' => $correct,
                'options' => $options,
                'explanation' => $this->vocabularyExplanation($vocabulary),
                'audio_url' => $vocabulary->audio_url,
            ];
        }

        if ($meaning === '') {
            return null;
        }

        $label = $vocabulary->word . ($reading !== '' ? " ({$reading})" : '');
        $options = $this->optionsFromVocabularyPool($pool, $meaning, 'meaning');

        return [
            'question_text' => "Apa arti dari {$label}?",
            'correct_answer' => $meaning,
            'options' => $options,
            'explanation' => $this->vocabularyExplanation($vocabulary),
            'audio_url' => $vocabulary->audio_url,
        ];
    }

    private function optionsFromVocabularyPool($pool, string $correct, string $field): array
    {
        $values = $pool
            ->map(function (Kosakata $item) use ($field) {
                if ($field === 'meaning') {
                    return trim((string) ($item->meaning_id ?: $item->meaning_en));
                }

                return trim((string) $item->{$field});
            })
            ->filter(fn ($value) => $value !== '')
            ->unique()
            ->reject(fn ($value) => $value === $correct)
            ->shuffle()
            ->take(3)
            ->values()
            ->all();

        $options = array_values(array_unique(array_filter([$correct, ...$values])));
        shuffle($options);

        return $options;
    }

    private function vocabularyExplanation(Kosakata $vocabulary): string
    {
        $parts = array_filter([
            $vocabulary->word,
            $vocabulary->reading,
            $vocabulary->meaning_id ?: $vocabulary->meaning_en,
        ]);

        return implode(' / ', $parts);
    }
}
