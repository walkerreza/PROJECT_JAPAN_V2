<?php

namespace Database\Seeders;

use App\Models\DeckPresentasi;
use App\Models\Flashcard;
use App\Models\Kuis;
use App\Models\LevelPembelajaran;
use App\Models\Materi;
use App\Models\Modul;
use App\Models\ProgramPembelajaran;
use App\Models\SetFlashcard;
use App\Models\SlidePresentasi;
use App\Models\Soal;
use Illuminate\Database\Seeder;

class KelasDemoSeeder extends Seeder
{
    public function run(): void
    {
        $level = LevelPembelajaran::updateOrCreate(
            ['level_name' => 'JLPT N3'],
            ['stage' => 3, 'is_premium' => true]
        );

        collect($this->kelas())->each(function (array $kelas, int $index) use ($level) {
            $program = ProgramPembelajaran::updateOrCreate(
                ['slug' => $kelas['slug']],
                [
                    'level_id' => $level->id,
                    'title' => $kelas['title'],
                    'description' => $kelas['description'],
                    'instructor_name' => $kelas['instructor_name'],
                    'thumbnail_url' => $kelas['thumbnail_url'],
                    'status' => 'published',
                    'sort_order' => $index + 1,
                ]
            );

            foreach ($kelas['modules'] as $week => $moduleData) {
                $module = Modul::updateOrCreate(
                    ['program_pembelajaran_id' => $program->id, 'week_number' => $week + 1],
                    [
                        'level_id' => $level->id,
                        'title' => $moduleData['title'],
                        'description' => $moduleData['description'],
                        'status' => 'published',
                    ]
                );

                $lesson = Materi::updateOrCreate(
                    ['module_id' => $module->id, 'order' => 1],
                    [
                        'title' => $moduleData['lesson_title'],
                        'type' => 'text',
                        'content' => '<p>' . $moduleData['lesson_body'] . '</p>',
                        'duration_minutes' => $moduleData['duration_minutes'],
                        'status' => 'published',
                    ]
                );

                $flashcardSet = SetFlashcard::updateOrCreate(
                    ['module_id' => $module->id, 'title' => $moduleData['flashcard_title']],
                    [
                        'level_id' => $level->id,
                        'lesson_id' => $lesson->id,
                        'description' => $moduleData['flashcard_description'],
                        'source_type' => 'manual',
                        'status' => 'published',
                    ]
                );

                foreach ($moduleData['flashcards'] as $order => $card) {
                    Flashcard::updateOrCreate(
                        ['flashcard_set_id' => $flashcardSet->id, 'order' => $order + 1],
                        [
                            'front_text' => $card['front'],
                            'reading' => $card['reading'],
                            'back_text' => $card['back'],
                            'hint' => $card['hint'],
                            'example_sentence' => $card['example'],
                            'example_meaning' => $card['meaning'],
                        ]
                    );
                }

                $quiz = Kuis::updateOrCreate(
                    ['module_id' => $module->id, 'lesson_id' => $lesson->id],
                    [
                        'type' => 'multiple_choice',
                        'time_limit' => $moduleData['time_limit'],
                        'status' => 'published',
                    ]
                );

                foreach ($moduleData['questions'] as $order => $question) {
                    Soal::updateOrCreate(
                        ['quiz_id' => $quiz->id, 'order' => $order + 1],
                        [
                            'type' => 'multiple_choice',
                            'question_text' => $question['text'],
                            'correct_answer' => $question['answer'],
                            'options' => $question['options'],
                            'explanation' => $question['explanation'],
                        ]
                    );
                }

                $deck = DeckPresentasi::updateOrCreate(
                    ['module_id' => $module->id, 'title' => $moduleData['presentation_title']],
                    [
                        'level_id' => $level->id,
                        'lesson_id' => $lesson->id,
                        'description' => $moduleData['presentation_description'],
                        'status' => 'published',
                    ]
                );

                SlidePresentasi::updateOrCreate(
                    ['presentation_deck_id' => $deck->id, 'order' => 1],
                    [
                        'title' => $moduleData['presentation_title'],
                        'layout' => 'title',
                        'content' => $moduleData['presentation_description'],
                        'background' => 'light',
                        'accent_color' => $kelas['accent_color'],
                        'speaker_notes' => 'Gunakan slide ini sebagai pembuka kelas.',
                    ]
                );
            }
        });
    }

    private function kelas(): array
    {
        return [
            [
                'slug' => 'jlpt-n3-mingguan',
                'title' => 'JLPT N3 Mingguan',
                'description' => 'Roadmap inti N3 untuk belajar bertahap dari kosakata, kanji, flashcard, kuis, dan PPT.',
                'instructor_name' => 'Mas Fuad',
                'thumbnail_url' => '/images/kelas-n3-mingguan.jpg',
                'accent_color' => '#E64A19',
                'modules' => [
                    $this->module('Lingkungan Sekitar', 'Kosakata tempat umum', 'waribiki', 'discount', 'Apa arti waribiki?', 'discount'),
                    $this->module('Rutinitas Harian', 'Pola kalimat kegiatan harian', 'hitsuyou', 'perlu', 'Apa arti hitsuyou?', 'perlu'),
                    $this->module('Percakapan Ringan', 'Ungkapan saat bertanya arah', 'annai', 'panduan', 'Apa arti annai?', 'panduan'),
                ],
            ],
            [
                'slug' => 'n3-kosakata-50d',
                'title' => 'N3 Kosakata 50D',
                'description' => 'Kelas drill kosakata intensif 50 hari untuk memperkuat ingatan kata N3.',
                'instructor_name' => 'Sensei Dewi',
                'thumbnail_url' => '/images/kelas-n3-kosakata.jpg',
                'accent_color' => '#0EA5E9',
                'modules' => [
                    $this->module('Kata Kerja Penting', 'Latihan kata kerja yang sering muncul', 'tsuzukeru', 'melanjutkan', 'Apa arti tsuzukeru?', 'melanjutkan'),
                    $this->module('Kata Sifat N3', 'Latihan i-keiyoushi dan na-keiyoushi', 'anzen', 'aman', 'Apa arti anzen?', 'aman'),
                    $this->module('Ekspresi Formal', 'Kosakata untuk situasi formal', 'shinsei', 'permohonan', 'Apa arti shinsei?', 'permohonan'),
                ],
            ],
            [
                'slug' => 'n3-kanji-repetition',
                'title' => 'N3 Kanji Repetition',
                'description' => 'Kelas repetisi kanji ala drill untuk membaca bentuk, arti, dan contoh kata.',
                'instructor_name' => 'Sensei Johan',
                'thumbnail_url' => '/images/kelas-n3-kanji.jpg',
                'accent_color' => '#7C3AED',
                'modules' => [
                    $this->module('Kanji Aktivitas', 'Kanji yang sering dipakai dalam aktivitas', 'undou', 'olahraga', 'Apa arti undou?', 'olahraga'),
                    $this->module('Kanji Tempat', 'Kanji lokasi dan fasilitas umum', 'byouin', 'rumah sakit', 'Apa arti byouin?', 'rumah sakit'),
                    $this->module('Kanji Waktu', 'Kanji jadwal, waktu, dan kebiasaan', 'yotei', 'rencana', 'Apa arti yotei?', 'rencana'),
                ],
            ],
            [
                'slug' => 'n3-tryout-ujian',
                'title' => 'N3 Tryout Ujian',
                'description' => 'Kelas latihan ujian untuk membiasakan timing, soal pilihan ganda, dan review jawaban.',
                'instructor_name' => 'Sensei Ade',
                'thumbnail_url' => '/images/kelas-n3-ujian.jpg',
                'accent_color' => '#16A34A',
                'modules' => [
                    $this->module('Mondai 1', 'Latihan kanji dan kosakata cepat', 'seikai', 'jawaban benar', 'Apa arti seikai?', 'jawaban benar'),
                    $this->module('Mondai 2', 'Latihan konteks kalimat', 'sentaku', 'pilihan', 'Apa arti sentaku?', 'pilihan'),
                    $this->module('Review Tryout', 'Review strategi setelah latihan', 'fukushuu', 'review', 'Apa arti fukushuu?', 'review'),
                ],
            ],
        ];
    }

    private function module(string $topic, string $focus, string $word, string $meaning, string $question, string $answer): array
    {
        return [
            'title' => 'Minggu ' . $topic,
            'description' => $focus,
            'lesson_title' => 'Materi: ' . $topic,
            'lesson_body' => $focus . '. Pelajari flashcard, baca ringkasan, lalu selesaikan kuis.',
            'duration_minutes' => 15,
            'flashcard_title' => 'Flashcard ' . $topic,
            'flashcard_description' => 'Flashcard pendamping untuk ' . $topic . '.',
            'flashcards' => [
                ['front' => $word, 'reading' => $word, 'back' => $meaning, 'hint' => $focus, 'example' => $word . ' o oboemashou.', 'meaning' => 'Ingat arti: ' . $meaning],
                ['front' => $topic, 'reading' => null, 'back' => $focus, 'hint' => 'Topik modul', 'example' => $topic . ' no renshuu.', 'meaning' => 'Latihan ' . $topic],
            ],
            'time_limit' => 300,
            'questions' => [
                ['text' => $question, 'answer' => $answer, 'options' => [$answer, 'membeli', 'berangkat', 'menulis'], 'explanation' => $word . ' berarti ' . $answer . '.'],
                ['text' => 'Apa fokus modul ini?', 'answer' => $focus, 'options' => [$focus, 'Latihan N1', 'Percakapan bisnis lanjut', 'Menulis sakubun'], 'explanation' => 'Modul ini fokus pada ' . $focus . '.'],
            ],
            'presentation_title' => 'PPT ' . $topic,
            'presentation_description' => 'Slide pembuka untuk ' . $focus . '.',
        ];
    }
}
