<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;

class BersihkanImportPresentasiService
{
    public function bersihkan(int $days = 14): array
    {
        $threshold = now()->subDays($days);

        return [
            'private_import_files' => $this->deleteOldFiles(storage_path('app/private/presentations/imports'), $threshold),
            'private_tmp_items' => $this->deleteOldItems(storage_path('app/private/presentations/tmp'), $threshold),
        ];
    }

    private function deleteOldFiles(string $directory, Carbon $threshold): int
    {
        if (! File::isDirectory($directory)) {
            return 0;
        }

        $deleted = 0;
        foreach (File::allFiles($directory) as $file) {
            if (Carbon::createFromTimestamp($file->getMTime())->lessThan($threshold)) {
                File::delete($file->getPathname());
                $deleted++;
            }
        }

        $this->deleteEmptyDirectories($directory);

        return $deleted;
    }

    private function deleteOldItems(string $directory, Carbon $threshold): int
    {
        if (! File::isDirectory($directory)) {
            return 0;
        }

        $deleted = 0;
        foreach (File::directories($directory) as $child) {
            if (Carbon::createFromTimestamp(File::lastModified($child))->lessThan($threshold)) {
                File::deleteDirectory($child);
                $deleted++;
            }
        }

        foreach (File::files($directory) as $file) {
            if (Carbon::createFromTimestamp($file->getMTime())->lessThan($threshold)) {
                File::delete($file->getPathname());
                $deleted++;
            }
        }

        return $deleted;
    }

    private function deleteEmptyDirectories(string $directory): void
    {
        foreach (array_reverse(File::directories($directory)) as $child) {
            $this->deleteEmptyDirectories($child);

            if (count(File::files($child)) === 0 && count(File::directories($child)) === 0) {
                File::deleteDirectory($child);
            }
        }
    }
}
