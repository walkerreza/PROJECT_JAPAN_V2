<?php

namespace App\Services;

use App\Models\DeckPresentasi;
use Illuminate\Http\UploadedFile;

class ImportPresentasiGambarService
{
    public function __construct(private readonly PresentasiStorageService $storage)
    {
    }

    /**
     * @param  array<int, UploadedFile>  $files
     */
    public function import(DeckPresentasi $deck, array $files): int
    {
        $nextOrder = (int) $deck->slides()->max('order') + 1;
        $count = 0;

        foreach ($files as $index => $file) {
            $extension = strtolower($file->getClientOriginalExtension());
            $path = $this->storage->storePublicUpload($file, "presentations/assets/{$deck->id}/images", $extension);
            $url = $this->storage->publicUrl($path);

            $dimensions = @getimagesize($file->getRealPath()) ?: null;

            $deck->slides()->create([
                'title' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME) ?: 'Slide Gambar ' . ($index + 1),
                'layout' => 'media',
                'content' => null,
                'media_url' => $url,
                'background' => 'light',
                'accent_color' => '#E64A19',
                'speaker_notes' => null,
                'order' => $nextOrder + $index,
                'source_type' => 'image',
                'snapshot_url' => $url,
                'source_meta' => [
                    'path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'width' => $dimensions[0] ?? null,
                    'height' => $dimensions[1] ?? null,
                ],
            ]);

            $count++;
        }

        $deck->update([
            'source_type' => $deck->source_type === 'manual' ? 'image' : $deck->source_type,
            'import_status' => 'ready',
            'import_summary' => [
                'slides_imported' => $count,
                'note' => 'Gambar diimport sebagai slide media siap tampil.',
            ],
        ]);

        return $count;
    }
}
