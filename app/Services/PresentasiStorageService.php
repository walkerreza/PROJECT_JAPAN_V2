<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PresentasiStorageService
{
    public const MAX_SNAPSHOT_BYTES = 8 * 1024 * 1024;

    public function storePrivateUpload(UploadedFile $file, string $directory, ?string $extension = null): string
    {
        $extension = $extension ?: strtolower($file->getClientOriginalExtension());
        $filename = Str::uuid()->toString() . '.' . $extension;

        return $file->storeAs($directory, $filename, 'local');
    }

    public function storePublicUpload(UploadedFile $file, string $directory, ?string $extension = null): string
    {
        $extension = $extension ?: strtolower($file->getClientOriginalExtension());
        $filename = Str::uuid()->toString() . '.' . $extension;

        return $file->storeAs($directory, $filename, 'public');
    }

    public function storePublicContent(string $contents, string $directory, string $extension): string
    {
        $path = trim($directory, '/') . '/' . Str::uuid()->toString() . '.' . strtolower($extension);
        Storage::disk('public')->put($path, $contents);

        return $path;
    }

    public function publicUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (str_starts_with($path, 'http') || str_starts_with($path, '/storage/')) {
            return $path;
        }

        return '/storage/' . ltrim($path, '/');
    }

    public function storeSnapshotDataUrl(?string $dataUrl, int $deckId): ?string
    {
        if (! $dataUrl) {
            return null;
        }

        if (str_starts_with($dataUrl, 'http') || str_starts_with($dataUrl, '/storage/')) {
            return $dataUrl;
        }

        if (! preg_match('/^data:image\/(png|jpe?g|webp);base64,/', $dataUrl, $matches)) {
            return null;
        }

        $extension = $matches[1] === 'jpeg' ? 'jpg' : $matches[1];
        $payload = substr($dataUrl, strpos($dataUrl, ',') + 1);
        $binary = base64_decode($payload, true);

        if ($binary === false) {
            throw ValidationException::withMessages([
                'slides' => 'Snapshot slide tidak valid.',
            ]);
        }

        if (strlen($binary) > self::MAX_SNAPSHOT_BYTES) {
            throw ValidationException::withMessages([
                'slides' => 'Snapshot slide terlalu besar. Simpan gambar dengan resolusi lebih rendah.',
            ]);
        }

        $path = $this->storePublicContent($binary, "presentations/slides/{$deckId}/snapshots", $extension);

        return $this->publicUrl($path);
    }
}
