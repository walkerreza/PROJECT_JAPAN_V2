<?php

namespace Database\Seeders;

use App\Models\LevelPembelajaran;
use App\Models\Modul;
use App\Models\ProgramPembelajaran;
use App\Models\Soal;
use App\Models\Kuis;
use Illuminate\Database\Seeder;

class N3CourseSeeder extends Seeder
{
    public function run(): void
    {
        $level = LevelPembelajaran::updateOrCreate(
            ['level_name' => 'JLPT N3'],
            ['stage' => 3, 'is_premium' => true]
        );
        $program = ProgramPembelajaran::updateOrCreate(
            ['slug' => 'jlpt-n3-mingguan'],
            [
                'level_id' => $level->id,
                'title' => 'JLPT N3 Mingguan',
                'description' => 'Program belajar mingguan yang menggabungkan flashcard dan kuis dalam satu roadmap.',
                'instructor_name' => 'Mas Fuad',
                'thumbnail_url' => '/images/kelas-n3-mingguan.jpg',
                'status' => 'published',
                'sort_order' => 1,
            ]
        );


        $module = Modul::updateOrCreate(
            ['level_id' => $level->id, 'week_number' => 1],
            [
                'program_pembelajaran_id' => $program->id,
                'title' => 'Minggu 1: Lingkungan Sekitar',
                'description' => 'Mempelajari kanji dan kosakata yang sering ditemui dalam kehidupan sehari-hari.',
                'status' => 'published',
            ]
        );

        $quiz = Kuis::updateOrCreate(
            ['module_id' => $module->id],
            ['type' => 'multiple_choice', 'time_limit' => 300, 'status' => 'published']
        );

        Soal::updateOrCreate(
            ['quiz_id' => $quiz->id, 'order' => 1],
            [
                'type' => 'multiple_choice',
                'question_text' => 'Bagaimana cara baca dari kanji 割引?',
                'correct_answer' => 'waribiki',
                'options' => ['waribiki', 'katsubiki', 'warihei', 'waribatsu'],
                'explanation' => 'Waribiki artinya diskon.',
            ]
        );

        Soal::updateOrCreate(
            ['quiz_id' => $quiz->id, 'order' => 2],
            [
                'type' => 'multiple_choice',
                'question_text' => 'Apa arti dari 半額?',
                'correct_answer' => 'Setengah harga',
                'options' => ['Setengah harga', 'Harga pas', 'Ganda', 'Habis'],
                'explanation' => 'Han (半) artinya setengah, gaku (額) artinya nominal atau harga.',
            ]
        );
    }
}
