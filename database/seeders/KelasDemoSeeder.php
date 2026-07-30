<?php

namespace Database\Seeders;

use App\Models\DeckPresentasi;
use App\Models\Flashcard;
use App\Models\HariModul;
use App\Models\Kosakata;
use App\Models\Kuis;
use App\Models\LevelPembelajaran;
use App\Models\Modul;
use App\Models\ProgramPembelajaran;
use App\Models\SetFlashcard;
use App\Models\SlidePresentasi;
use App\Models\Soal;
use App\Services\SoalKuisService;
use Illuminate\Database\Seeder;

class KelasDemoSeeder extends Seeder
{
    public function run(SoalKuisService $questions): void
    {
        $level = LevelPembelajaran::updateOrCreate(
            ['level_name' => 'JLPT N3'],
            ['stage' => 3, 'is_premium' => true]
        );

        collect($this->kelas())->each(function (array $kelas, int $index) use ($level, $questions) {
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

                $dayOne = HariModul::updateOrCreate(
                    ['module_id' => $module->id, 'day_number' => 1],
                    [
                        'title' => 'Pengenalan Materi',
                        'description' => 'Pelajari ringkasan, presentasi, dan flashcard sebelum masuk ke evaluasi.',
                        'status' => 'published',
                        'checkpoint_quiz_id' => null,
                    ]
                );
                $dayTwo = HariModul::updateOrCreate(
                    ['module_id' => $module->id, 'day_number' => 2],
                    [
                        'title' => 'Latihan dan Evaluasi',
                        'description' => 'Uji pemahaman melalui kuis checkpoint untuk menyelesaikan Week.',
                        'status' => 'published',
                    ]
                );

                $flashcardSet = SetFlashcard::updateOrCreate(
                    ['module_id' => $module->id, 'title' => $moduleData['flashcard_title']],
                    [
                        'level_id' => $level->id,
                        'module_day_id' => $dayOne->id,
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
                    ['module_id' => $module->id],
                    [
                        'module_day_id' => $dayTwo->id,
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

                $writing = $moduleData['handwriting'];
                $vocabulary = Kosakata::updateOrCreate(
                    ['module_id' => $module->id, 'word' => $writing['word']],
                    [
                        'content_type' => 'kanji',
                        'reading' => $writing['reading'],
                        'meaning_id' => $writing['meaning'],
                        'jlpt_level' => 'N3',
                        'category' => 'latihan-menulis',
                        'status' => 'published',
                    ]
                );
                $vocabulary->days()->syncWithoutDetaching([
                    $dayTwo->id => ['sort_order' => 1],
                ]);

                $writingSet = SetFlashcard::updateOrCreate(
                    [
                        'module_id' => $module->id,
                        'module_day_id' => $dayTwo->id,
                        'source_type' => 'handwriting-demo',
                    ],
                    [
                        'level_id' => $level->id,
                        'title' => 'Latihan Kanji '.$moduleData['title'],
                        'description' => 'Flashcard penguatan sebelum latihan urutan stroke.',
                        'status' => 'published',
                    ]
                );
                Flashcard::updateOrCreate(
                    ['flashcard_set_id' => $writingSet->id, 'order' => 1],
                    [
                        'vocabulary_id' => $vocabulary->id,
                        'front_text' => $writing['word'],
                        'reading' => $writing['reading'],
                        'back_text' => $writing['meaning'],
                        'hint' => 'Perhatikan bentuk dan urutan stroke.',
                    ]
                );

                $dayTwo->update(['checkpoint_quiz_id' => $quiz->id]);

                $deck = DeckPresentasi::updateOrCreate(
                    ['module_id' => $module->id, 'title' => $moduleData['presentation_title']],
                    [
                        'level_id' => $level->id,
                        'module_day_id' => $dayOne->id,
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
                'instructor_name' => 'Guru gembul',
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
            'title' => 'Minggu '.$topic,
            'description' => $focus,
            'lesson_title' => 'Materi: '.$topic,
            'lesson_body' => $focus.'. Pelajari flashcard, baca ringkasan, lalu selesaikan kuis.',
            'duration_minutes' => 15,
            'flashcard_title' => 'Flashcard '.$topic,
            'flashcard_description' => 'Flashcard pendamping untuk '.$topic.'.',
            'flashcards' => [
                ['front' => $word, 'reading' => $word, 'back' => $meaning, 'hint' => $focus, 'example' => $word.' o oboemashou.', 'meaning' => 'Ingat arti: '.$meaning],
                ['front' => $topic, 'reading' => null, 'back' => $focus, 'hint' => 'Topik modul', 'example' => $topic.' no renshuu.', 'meaning' => 'Latihan '.$topic],
            ],
            'time_limit' => 300,
            'questions' => [
                ['text' => $question, 'answer' => $answer, 'options' => [$answer, 'membeli', 'berangkat', 'menulis'], 'explanation' => $word.' berarti '.$answer.'.'],
                ['text' => 'Apa fokus modul ini?', 'answer' => $focus, 'options' => [$focus, 'Latihan N1', 'Percakapan bisnis lanjut', 'Menulis sakubun'], 'explanation' => 'Modul ini fokus pada '.$focus.'.'],
            ],
            'handwriting' => $this->handwritingFor($word, $meaning),
            'presentation_title' => 'PPT '.$topic,
            'presentation_description' => 'Slide pembuka untuk '.$focus.'.',
        ];
    }

    private function handwritingFor(string $word, string $meaning): array
    {
        return match ($word) {
            'waribiki' => ['character' => '割', 'word' => '割引', 'reading' => 'わりびき', 'meaning' => $meaning],
            'hitsuyou' => ['character' => '必', 'word' => '必要', 'reading' => 'ひつよう', 'meaning' => $meaning],
            'annai' => ['character' => '案', 'word' => '案内', 'reading' => 'あんない', 'meaning' => $meaning],
            'tsuzukeru' => ['character' => '続', 'word' => '続ける', 'reading' => 'つづける', 'meaning' => $meaning],
            'anzen' => ['character' => '安', 'word' => '安全', 'reading' => 'あんぜん', 'meaning' => $meaning],
            'shinsei' => ['character' => '申', 'word' => '申請', 'reading' => 'しんせい', 'meaning' => $meaning],
            'undou' => ['character' => '動', 'word' => '運動', 'reading' => 'うんどう', 'meaning' => $meaning],
            'byouin' => ['character' => '院', 'word' => '病院', 'reading' => 'びょういん', 'meaning' => $meaning],
            'yotei' => ['character' => '予', 'word' => '予定', 'reading' => 'よてい', 'meaning' => $meaning],
            'seikai' => ['character' => '正', 'word' => '正解', 'reading' => 'せいかい', 'meaning' => $meaning],
            'sentaku' => ['character' => '選', 'word' => '選択', 'reading' => 'せんたく', 'meaning' => $meaning],
            'fukushuu' => ['character' => '復', 'word' => '復習', 'reading' => 'ふくしゅう', 'meaning' => $meaning],
            default => ['character' => '新', 'word' => '新しい', 'reading' => 'あたらしい', 'meaning' => $meaning],
        };
    }
}
