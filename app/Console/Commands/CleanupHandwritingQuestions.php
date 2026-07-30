<?php

namespace App\Console\Commands;

use App\Models\Soal;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanupHandwritingQuestions extends Command
{
    protected $signature = 'questions:cleanup-handwriting
        {--dry-run : Tampilkan soal yang akan dihapus tanpa mengubah database}
        {--force : Hapus permanen soal handwriting lama}';

    protected $description = 'Menghapus soal handwriting lama yang sudah digantikan repetisi berbasis flashcard.';

    public function handle(): int
    {
        $query = Soal::query()->where('type', 'handwriting');
        $count = (clone $query)->count();

        if ($count === 0) {
            $this->info('Tidak ada soal handwriting lama.');

            return self::SUCCESS;
        }

        $affectedQuizzes = (clone $query)
            ->selectRaw('quiz_id, COUNT(*) as question_count')
            ->groupBy('quiz_id')
            ->orderBy('quiz_id')
            ->get();

        $this->table(
            ['Quiz ID', 'Jumlah Soal'],
            $affectedQuizzes
                ->map(fn (Soal $question) => [$question->quiz_id, $question->question_count])
                ->all()
        );
        $this->line("Total: {$count} soal handwriting.");

        if ($this->option('dry-run') || ! $this->option('force')) {
            $this->warn('Tidak ada data dihapus. Jalankan dengan --force setelah memeriksa daftar ini.');

            return self::SUCCESS;
        }

        $deleted = DB::transaction(fn () => Soal::query()
            ->where('type', 'handwriting')
            ->delete());

        $this->info("{$deleted} soal handwriting berhasil dihapus permanen.");

        return self::SUCCESS;
    }
}
