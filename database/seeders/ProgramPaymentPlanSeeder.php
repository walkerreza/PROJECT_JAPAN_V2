<?php

namespace Database\Seeders;

use App\Models\PaketPembayaran;
use App\Models\ProgramPembelajaran;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProgramPaymentPlanSeeder extends Seeder
{
    public function run(): void
    {
        ProgramPembelajaran::query()
            ->where('status', 'published')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->each(function (ProgramPembelajaran $program) {
                $setting = $this->setting($program->slug);

                PaketPembayaran::updateOrCreate(
                    ['slug' => 'akses-' . Str::slug($program->slug ?: $program->title) . '-' . $setting['duration_days'] . '-hari'],
                    [
                        'name' => 'Akses ' . $program->title,
                        'scope_type' => 'program',
                        'program_pembelajaran_id' => $program->id,
                        'description' => $setting['description'],
                        'price' => $setting['price'],
                        'duration_days' => $setting['duration_days'],
                        'features' => $setting['features'],
                        'is_active' => true,
                    ]
                );
            });
    }

    private function setting(string $slug): array
    {
        return match ($slug) {
            'n3-kosakata-50d' => [
                'price' => 69000,
                'duration_days' => 50,
                'description' => 'Akses kelas drill kosakata N3 selama 50 hari.',
                'features' => ['Drill kosakata', 'Flashcard harian', 'Kuis cepat', 'Progress repetisi'],
            ],
            'n3-kanji-repetition' => [
                'price' => 89000,
                'duration_days' => 45,
                'description' => 'Akses kelas repetisi kanji N3 selama 45 hari.',
                'features' => ['Repetisi kanji', 'Contoh kata', 'Flashcard kanji', 'Kuis review'],
            ],
            'n3-tryout-ujian' => [
                'price' => 99000,
                'duration_days' => 30,
                'description' => 'Akses kelas tryout dan review ujian N3 selama 30 hari.',
                'features' => ['Tryout', 'Review jawaban', 'Timer ujian', 'PPT pembahasan'],
            ],
            default => [
                'price' => 79000,
                'duration_days' => 30,
                'description' => 'Akses 30 hari untuk kelas ' . $slug . '.',
                'features' => ['Roadmap mingguan', 'PPT kelas', 'Kosakata', 'Flashcard', 'Kuis'],
            ],
        };
    }
}
