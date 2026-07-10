<?php

namespace App\Services;

use App\Models\DeckPresentasi;
use Illuminate\Http\UploadedFile;

class ImportPresentasiPdfService
{
    public function __construct(private readonly PresentasiStorageService $storage)
    {
    }

    public function import(DeckPresentasi $deck, UploadedFile $file): int
    {
        $path = $this->storage->storePublicUpload($file, "presentations/assets/{$deck->id}/pdf", 'pdf');
        $url = route('presentations.pdf.inline', $deck, false);

        $deck->slides()
            ->where('layout', 'pdf')
            ->where('source_type', 'pdf')
            ->delete();

        $deck->update([
            'source_type' => 'pdf',
            'source_file_path' => $path,
            'source_file_name' => $file->getClientOriginalName(),
            'source_file_size' => $file->getSize(),
            'import_status' => 'ready',
            'import_summary' => [
                'slides_imported' => 1,
                'note' => 'PDF adalah format final presentasi. User melihat file ini sebagai carousel di browser.',
            ],
        ]);

        $deck->slides()->create([
            'title' => $deck->title . ' PDF',
            'layout' => 'pdf',
            'content' => 'Presentasi PDF dari import admin.',
            'media_url' => $url,
            'background' => 'light',
            'accent_color' => '#E64A19',
            'speaker_notes' => null,
            'order' => (int) $deck->slides()->max('order') + 1,
            'source_type' => 'pdf',
            'source_meta' => [
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
            ],
        ]);

        return 1;
    }
}
