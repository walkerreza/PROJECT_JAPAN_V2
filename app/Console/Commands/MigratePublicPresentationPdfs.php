<?php

namespace App\Console\Commands;

use App\Models\DeckPresentasi;
use App\Models\SlidePresentasi;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class MigratePublicPresentationPdfs extends Command
{
    protected $signature = 'presentations:migrate-public-pdfs {--dry-run : Tampilkan file tanpa memindahkannya} {--force : Jalankan pemindahan file}';

    protected $description = 'Memindahkan PDF presentasi lama dari public storage ke private storage dengan verifikasi hash.';

    public function handle(): int
    {
        $public = Storage::disk('public');
        $private = Storage::disk('local');
        $paths = $this->referencedPdfPaths()
            ->filter(fn (string $path) => $public->exists($path))
            ->values();

        if ($paths->isEmpty()) {
            $this->info('Tidak ada PDF presentasi yang direferensikan pada public storage.');

            return self::SUCCESS;
        }

        $this->table(['Path', 'Ukuran'], $paths->map(fn (string $path) => [$path, $public->size($path)])->all());

        if ($this->option('dry-run') || ! $this->option('force')) {
            $this->warn('Tidak ada file dipindahkan. Jalankan dengan --force setelah memeriksa daftar ini.');

            return self::SUCCESS;
        }

        foreach ($paths as $path) {
            $sourcePath = $public->path($path);
            $targetPath = $private->path($path);
            $sourceHash = hash_file('sha256', $sourcePath);

            if ($private->exists($path)) {
                if (hash_file('sha256', $targetPath) !== $sourceHash) {
                    $this->error("Target private berbeda untuk {$path}; pemindahan dihentikan.");

                    return self::FAILURE;
                }
            } else {
                $stream = fopen($sourcePath, 'rb');

                if ($stream === false || ! $private->writeStream($path, $stream)) {
                    if (is_resource($stream)) {
                        fclose($stream);
                    }

                    $this->error("Gagal menyalin {$path} ke private storage.");

                    return self::FAILURE;
                }

                fclose($stream);
            }

            if (hash_file('sha256', $targetPath) !== $sourceHash) {
                $this->error("Verifikasi hash gagal untuk {$path}; file public tidak dihapus.");

                return self::FAILURE;
            }

            $public->delete($path);
            $this->line("Dipindahkan: {$path}");
        }

        $this->info("{$paths->count()} PDF berhasil dipindahkan ke private storage.");

        return self::SUCCESS;
    }

    private function referencedPdfPaths()
    {
        $deckPaths = DeckPresentasi::query()
            ->where('source_type', 'pdf')
            ->whereNotNull('source_file_path')
            ->pluck('source_file_path');

        $slidePaths = SlidePresentasi::query()
            ->where('source_type', 'pdf')
            ->get(['source_meta'])
            ->map(fn (SlidePresentasi $slide) => data_get($slide->source_meta, 'path'));

        return $deckPaths
            ->merge($slidePaths)
            ->filter(fn ($path) => is_string($path)
                && str_starts_with($path, 'presentations/')
                && str_ends_with(strtolower($path), '.pdf'))
            ->unique()
            ->values();
    }
}
