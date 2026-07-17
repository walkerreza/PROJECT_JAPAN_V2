<?php

namespace Database\Seeders;

use App\Models\Berita;
use App\Models\Flashcard;
use App\Models\JawabanPengerjaanKuis;
use App\Models\KodeAkses;
use App\Models\Kosakata;
use App\Models\Kuis;
use App\Models\Langganan;
use App\Models\LevelPembelajaran;
use App\Models\LogAktivitas;
use App\Models\LogReward;
use App\Models\Modul;
use App\Models\PaketPembayaran;
use App\Models\PengerjaanKuis;
use App\Models\Pengguna;
use App\Models\Progres;
use App\Models\SetFlashcard;
use App\Models\Soal;
use App\Models\Transaksi;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $superadmin = Pengguna::where('email', 'superadmin@japanlingo.com')->first();
        $student = Pengguna::where('email', 'student@japanlingo.com')->first();
        $freeStudent = Pengguna::where('email', 'student2@japanlingo.com')->first();

        $level = LevelPembelajaran::updateOrCreate(
            ['level_name' => 'JLPT N3'],
            ['stage' => 3, 'is_premium' => true]
        );

        $module = Modul::updateOrCreate(
            ['level_id' => $level->id, 'week_number' => 1],
            [
                'title' => 'Minggu 1: Kosakata dan Kanji Harian',
                'description' => 'Demo modul N3 untuk validasi kelas, kuis, flashcard, progress, dan premium lock.',
                'status' => 'published',
            ]
        );

        $quiz = Kuis::updateOrCreate(
            ['module_id' => $module->id, 'type' => 'multiple_choice'],
            ['time_limit' => 300, 'passing_score' => 70, 'status' => 'published']
        );

        $questionOne = Soal::updateOrCreate(
            ['quiz_id' => $quiz->id, 'order' => 1],
            [
                'type' => 'multiple_choice',
                'question_text' => 'Apa arti dari 割引?',
                'correct_answer' => 'Diskon',
                'options' => ['Diskon', 'Harga tetap', 'Kasir', 'Belanja'],
                'explanation' => '割引 dibaca waribiki dan berarti diskon.',
            ]
        );

        $questionTwo = Soal::updateOrCreate(
            ['quiz_id' => $quiz->id, 'order' => 2],
            [
                'type' => 'multiple_choice',
                'question_text' => '半額 berarti apa?',
                'correct_answer' => 'Setengah harga',
                'options' => ['Setengah harga', 'Harga penuh', 'Barang baru', 'Tutup toko'],
                'explanation' => '半 berarti setengah dan 額 berarti nominal atau harga.',
            ]
        );

        $vocabularyItems = collect([
            [
                'word' => '会議',
                'reading' => 'かいぎ',
                'meaning_id' => 'rapat',
                'meaning_en' => 'meeting',
                'category' => 'noun',
                'content_type' => 'kosakata',
                'tags' => ['office', 'daily'],
                'example_sentence' => '今日は一時から会議があります。',
                'example_reading' => 'きょうはいちじからかいぎがあります。',
                'example_meaning' => 'Hari ini ada rapat mulai jam satu.',
            ],
            [
                'word' => '割引',
                'reading' => 'わりびき',
                'meaning_id' => 'diskon',
                'meaning_en' => 'discount',
                'category' => 'shopping',
                'content_type' => 'kosakata',
                'tags' => ['shopping', 'money'],
                'example_sentence' => 'この店では学生に割引があります。',
                'example_reading' => 'このみせではがくせいにわりびきがあります。',
                'example_meaning' => 'Di toko ini ada diskon untuk pelajar.',
            ],
            [
                'word' => '必要',
                'reading' => 'ひつよう',
                'meaning_id' => 'perlu',
                'meaning_en' => 'necessary',
                'category' => 'na-adjective',
                'content_type' => 'kosakata',
                'tags' => ['daily', 'n3'],
                'example_sentence' => '予約が必要です。',
                'example_reading' => 'よやくがひつようです。',
                'example_meaning' => 'Reservasi diperlukan.',
            ],
            [
                'word' => '割',
                'reading' => 'わり',
                'meaning_id' => 'membagi, rasio, diskon',
                'meaning_en' => 'divide, ratio, discount',
                'category' => 'kanji',
                'content_type' => 'kanji',
                'tags' => ['kanji', 'shopping'],
                'example_sentence' => '割引の商品を買いました。',
                'example_reading' => 'わりびきのしょうひんをかいました。',
                'example_meaning' => 'Saya membeli barang diskon.',
            ],
            [
                'word' => 'てもいい',
                'reading' => 'てもいい',
                'meaning_id' => 'boleh melakukan sesuatu',
                'meaning_en' => 'may do something',
                'category' => 'bunpo',
                'content_type' => 'bunpo',
                'tags' => ['grammar', 'permission'],
                'example_sentence' => 'ここで写真を撮ってもいいですか。',
                'example_reading' => 'ここでしゃしんをとってもいいですか。',
                'example_meaning' => 'Bolehkah saya mengambil foto di sini?',
            ],
        ])->map(fn (array $item) => Kosakata::updateOrCreate(
            ['word' => $item['word'], 'reading' => $item['reading']],
            $item + ['module_id' => $module->id, 'jlpt_level' => 'N3', 'status' => 'published']
        ));

        $flashcardSet = SetFlashcard::updateOrCreate(
            ['module_id' => $module->id, 'title' => 'Demo N3: Kosakata Minggu 1'],
            [
                'level_id' => $level->id,
                'description' => 'Set flashcard demo yang terhubung ke modul mingguan dan generator kuis.',
                'source_type' => 'vocabulary',
                'status' => 'published',
            ]
        );

        $vocabularyItems->values()->each(function (Kosakata $vocabulary, int $index) use ($flashcardSet) {
            Flashcard::updateOrCreate(
                ['flashcard_set_id' => $flashcardSet->id, 'vocabulary_id' => $vocabulary->id],
                [
                    'front_text' => $vocabulary->word,
                    'reading' => $vocabulary->reading,
                    'back_text' => $vocabulary->meaning_id,
                    'hint' => $vocabulary->category,
                    'example_sentence' => $vocabulary->example_sentence,
                    'example_meaning' => $vocabulary->example_meaning,
                    'audio_url' => $vocabulary->audio_url,
                    'order' => $index,
                ]
            );
        });

        $monthlyPlan = PaketPembayaran::updateOrCreate(
            ['slug' => 'premium-monthly'],
            [
                'name' => 'Premium Monthly',
                'scope_type' => 'global',
                'program_pembelajaran_id' => null,
                'description' => 'Akses premium 30 hari untuk demo.',
                'price' => 99000,
                'duration_days' => 30,
                'features' => ['Akses semua kelas N3', 'Priority access', 'Access key support'],
                'is_active' => true,
            ]
        );

        PaketPembayaran::updateOrCreate(
            ['slug' => 'free-plan'],
            [
                'name' => 'Free Plan',
                'scope_type' => 'global',
                'program_pembelajaran_id' => null,
                'description' => 'Akses dasar gratis.',
                'price' => 0,
                'duration_days' => 30,
                'features' => ['Preview konten minggu pertama'],
                'is_active' => true,
            ]
        );

        if ($superadmin) {
            KodeAkses::updateOrCreate(
                ['code' => 'DEMO-N3-PREMIUM'],
                [
                    'payment_plan_id' => $monthlyPlan->id,
                    'scope_type' => 'global',
                    'program_pembelajaran_id' => null,
                    'created_by' => $superadmin->id,
                    'name' => 'Demo Premium N3',
                    'duration_days' => 30,
                    'max_uses' => 20,
                    'used_count' => 0,
                    'status' => 'active',
                    'starts_at' => now()->subDay(),
                    'expires_at' => now()->addMonths(3),
                    'notes' => 'Kode demo untuk QA redeem access key.',
                ]
            );

            Berita::updateOrCreate(
                ['title' => 'Demo Portal Berita JapanLingo'],
                [
                    'created_by' => $superadmin->id,
                    'updated_by' => $superadmin->id,
                    'excerpt' => 'Berita demo untuk menguji portal berita user.',
                    'body' => '<p>Ini adalah berita demo untuk memastikan halaman berita user terhubung dengan konten superadmin.</p>',
                    'status' => 'published',
                    'audience' => 'students',
                    'is_pinned' => true,
                    'published_at' => now(),
                ]
            );

            LogAktivitas::updateOrCreate(
                ['action' => 'demo_seeded', 'target_type' => 'system', 'target_id' => 1],
                [
                    'actor_id' => $superadmin->id,
                    'description' => 'Demo data seeded for QA flow.',
                    'metadata' => ['source' => 'DemoDataSeeder'],
                ]
            );
        }

        if ($student) {
            $subscription = Langganan::updateOrCreate(
                ['user_id' => $student->id, 'payment_plan_id' => $monthlyPlan->id],
                [
                    'scope_type' => 'global',
                    'program_pembelajaran_id' => null,
                    'status' => 'active',
                    'start_date' => now()->toDateString(),
                    'end_date' => now()->addDays(30)->toDateString(),
                    'auto_renew' => false,
                ]
            );

            Transaksi::updateOrCreate(
                ['transaction_code' => 'DEMO-TRX-0001'],
                [
                    'user_id' => $student->id,
                    'payment_plan_id' => $monthlyPlan->id,
                    'subscription_id' => $subscription->id,
                    'scope_type' => 'global',
                    'program_pembelajaran_id' => null,
                    'amount' => 99000,
                    'payment_method' => 'manual',
                    'status' => 'success',
                    'notes' => 'Demo successful transaction.',
                    'processed_at' => now(),
                ]
            );

            Progres::updateOrCreate(
                ['user_id' => $student->id, 'module_id' => $module->id],
                ['score' => 100, 'completed_at' => now()]
            );

            $attempt = PengerjaanKuis::updateOrCreate(
                ['user_id' => $student->id, 'quiz_id' => $quiz->id],
                ['score' => 100, 'xp_earned' => 50, 'attempted_at' => now()]
            );

            JawabanPengerjaanKuis::updateOrCreate(
                ['attempt_id' => $attempt->id, 'question_id' => $questionOne->id],
                ['answer_text' => 'Diskon', 'answer_payload' => ['choice' => 'Diskon'], 'is_correct' => true, 'earned_points' => 1]
            );

            JawabanPengerjaanKuis::updateOrCreate(
                ['attempt_id' => $attempt->id, 'question_id' => $questionTwo->id],
                ['answer_text' => 'Setengah harga', 'answer_payload' => ['choice' => 'Setengah harga'], 'is_correct' => true, 'earned_points' => 1]
            );

            LogReward::updateOrCreate(
                ['user_id' => $student->id, 'source_type' => 'quiz', 'source_id' => $quiz->id],
                ['xp_amount' => 50, 'description' => 'Demo XP dari kuis N3.']
            );
        }

        if ($freeStudent) {
            $freeStudent->forceFill([
                'subscription_status' => 'free',
                'status' => 'active',
            ])->save();
        }
    }
}
