<?php

namespace App\Services;

use App\Models\DeckPresentasi;
use DOMDocument;
use DOMElement;
use DOMXPath;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use ZipArchive;

class ImportPresentasiPptxService
{
    private const MAX_SLIDES = 60;
    private const MAX_TOTAL_EXTRACT_BYTES = 100 * 1024 * 1024;
    private const MAX_MEDIA_BYTES = 5 * 1024 * 1024;
    private const CANVAS_WIDTH = 1280;

    public function __construct(private readonly PresentasiStorageService $storage)
    {
    }

    public function import(DeckPresentasi $deck, UploadedFile $file): int
    {
        $privatePath = $this->storage->storePrivateUpload($file, "presentations/imports/pptx/{$deck->id}", 'pptx');
        $localPath = Storage::disk('local')->path($privatePath);

        $zip = new ZipArchive();
        if ($zip->open($localPath) !== true) {
            throw ValidationException::withMessages([
                'pptx_file' => 'File PPTX tidak bisa dibuka.',
            ]);
        }

        try {
            $this->validateArchive($zip);

            $slidePaths = $this->slidePaths($zip);
            if ($slidePaths === []) {
                throw ValidationException::withMessages([
                    'pptx_file' => 'Tidak ada slide yang bisa dibaca dari PPTX.',
                ]);
            }

            $slideSize = $this->slideSize($zip);
            $canvasSize = $this->canvasSize($slideSize);
            $mediaCache = [];
            $warnings = [];
            $nextOrder = (int) $deck->slides()->max('order') + 1;

            foreach (array_slice($slidePaths, 0, self::MAX_SLIDES) as $index => $slidePath) {
                $slideXml = $zip->getFromName($slidePath);
                if (! $slideXml) {
                    $warnings[] = basename($slidePath) . ' tidak bisa dibaca.';
                    continue;
                }

                $relationships = $this->relationshipsForSlide($zip, $slidePath);
                $parsed = $this->parseSlide($zip, $slideXml, $relationships, $slideSize, $canvasSize, $deck->id, $mediaCache);
                $title = $parsed['title'] ?: 'Import PPTX Slide ' . ($index + 1);

                $deck->slides()->create([
                    'title' => Str::limit($title, 120, ''),
                    'layout' => 'canvas',
                    'content' => $parsed['content'],
                    'media_url' => $parsed['primary_media_url'],
                    'background' => 'light',
                    'accent_color' => '#E64A19',
                    'speaker_notes' => null,
                    'order' => $nextOrder + $index,
                    'source_type' => 'pptx',
                    'canvas_json' => $parsed['canvas_json'],
                    'snapshot_url' => $parsed['primary_media_url'],
                    'source_meta' => [
                        'slide_path' => $slidePath,
                        'original_width' => $slideSize['cx'],
                        'original_height' => $slideSize['cy'],
                        'canvas_width' => $canvasSize['width'],
                        'canvas_height' => $canvasSize['height'],
                        'aspect_ratio' => round($canvasSize['width'] / max(1, $canvasSize['height']), 6),
                        'objects_count' => count($parsed['canvas_json']['objects']),
                    ],
                ]);
            }

            $importedCount = min(count($slidePaths), self::MAX_SLIDES);
            if (count($slidePaths) > self::MAX_SLIDES) {
                $warnings[] = 'Sebagian slide tidak diimport karena batas maksimal ' . self::MAX_SLIDES . ' slide.';
            }

            $hasPdfFinal = $deck->source_type === 'pdf' && filled($deck->source_file_path);
            $summary = [
                'slides_imported' => $importedCount,
                'warnings' => $warnings,
                'pptx_draft' => [
                    'path' => $privatePath,
                    'original_name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                ],
                'note' => $hasPdfFinal
                    ? 'PPTX diimport sebagai draft editable. PDF final tetap dipakai sebagai viewer user.'
                    : 'PPTX diimport sebagai draft editable. Cek ulang layout sebelum publish.',
            ];

            $deckUpdate = [
                'import_summary' => $summary,
            ];

            if (! $hasPdfFinal) {
                $deckUpdate += [
                    'source_type' => 'pptx',
                    'source_file_path' => $privatePath,
                    'source_file_name' => $file->getClientOriginalName(),
                    'source_file_size' => $file->getSize(),
                    'import_status' => 'needs_review',
                ];
            }

            $deck->update($deckUpdate);

            return $importedCount;
        } finally {
            $zip->close();
        }
    }

    private function validateArchive(ZipArchive $zip): void
    {
        $totalSize = 0;

        for ($index = 0; $index < $zip->numFiles; $index++) {
            $stat = $zip->statIndex($index);
            $name = $stat['name'] ?? '';

            if ($this->isUnsafePath($name)) {
                throw ValidationException::withMessages([
                    'pptx_file' => 'Struktur PPTX tidak aman.',
                ]);
            }

            $totalSize += (int) ($stat['size'] ?? 0);
            if ($totalSize > self::MAX_TOTAL_EXTRACT_BYTES) {
                throw ValidationException::withMessages([
                    'pptx_file' => 'Total isi PPTX terlalu besar setelah dibuka.',
                ]);
            }
        }
    }

    private function isUnsafePath(string $path): bool
    {
        return str_contains($path, '..')
            || str_starts_with($path, '/')
            || preg_match('/^[A-Za-z]:[\/\\\\]/', $path) === 1;
    }

    private function slidePaths(ZipArchive $zip): array
    {
        $paths = [];

        for ($index = 0; $index < $zip->numFiles; $index++) {
            $name = $zip->getNameIndex($index);
            if (preg_match('#^ppt/slides/slide\d+\.xml$#', $name)) {
                $paths[] = $name;
            }
        }

        usort($paths, fn ($left, $right) => strnatcmp($left, $right));

        return $paths;
    }

    private function slideSize(ZipArchive $zip): array
    {
        $xml = $zip->getFromName('ppt/presentation.xml');
        if (! $xml) {
            return ['cx' => 12192000, 'cy' => 6858000];
        }

        $document = $this->dom($xml);
        if (! $document) {
            return ['cx' => 12192000, 'cy' => 6858000];
        }

        $xpath = new DOMXPath($document);
        $xpath->registerNamespace('p', 'http://schemas.openxmlformats.org/presentationml/2006/main');
        $node = $xpath->query('//p:sldSz')->item(0);

        if (! $node instanceof DOMElement) {
            return ['cx' => 12192000, 'cy' => 6858000];
        }

        return [
            'cx' => max(1, (int) $node->getAttribute('cx')),
            'cy' => max(1, (int) $node->getAttribute('cy')),
        ];
    }

    private function canvasSize(array $slideSize): array
    {
        $ratio = max(0.1, $slideSize['cy'] / max(1, $slideSize['cx']));

        return [
            'width' => self::CANVAS_WIDTH,
            'height' => (int) round(self::CANVAS_WIDTH * $ratio),
        ];
    }

    private function relationshipsForSlide(ZipArchive $zip, string $slidePath): array
    {
        $file = basename($slidePath);
        $relsPath = dirname($slidePath) . '/_rels/' . $file . '.rels';
        $xml = $zip->getFromName($relsPath);

        if (! $xml) {
            return [];
        }

        $document = $this->dom($xml);
        if (! $document) {
            return [];
        }

        $xpath = new DOMXPath($document);
        $xpath->registerNamespace('rel', 'http://schemas.openxmlformats.org/package/2006/relationships');

        $relationships = [];
        foreach ($xpath->query('//rel:Relationship') as $node) {
            if ($node instanceof DOMElement) {
                $relationships[$node->getAttribute('Id')] = $this->normalizePackagePath(dirname($slidePath) . '/' . $node->getAttribute('Target'));
            }
        }

        return $relationships;
    }

    private function parseSlide(ZipArchive $zip, string $xml, array $relationships, array $slideSize, array $canvasSize, int $deckId, array &$mediaCache): array
    {
        $document = $this->dom($xml);
        if (! $document) {
            return [
                'title' => null,
                'content' => null,
                'primary_media_url' => null,
                'canvas_json' => $this->emptyCanvas($canvasSize),
            ];
        }

        $xpath = new DOMXPath($document);
        $xpath->registerNamespace('p', 'http://schemas.openxmlformats.org/presentationml/2006/main');
        $xpath->registerNamespace('a', 'http://schemas.openxmlformats.org/drawingml/2006/main');
        $xpath->registerNamespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships');

        $objects = [];
        $textLines = [];
        $fallbackTop = 72;

        foreach ($xpath->query('//p:sp[.//a:t]') as $node) {
            if (! $node instanceof DOMElement) {
                continue;
            }

            $textParts = [];
            foreach ($xpath->query('.//a:t', $node) as $textNode) {
                $textParts[] = $textNode->nodeValue;
            }

            $text = trim(implode('', $textParts));

            if ($text === '') {
                continue;
            }

            $box = $this->boxForNode($xpath, $node, $slideSize, $canvasSize, ['left' => 88, 'top' => $fallbackTop, 'width' => 880, 'height' => 80]);
            $fallbackTop += 92;
            $textLines[] = $text;

            $objects[] = [
                'kind' => 'textbox',
                'text' => $text,
                'left' => $box['left'],
                'top' => $box['top'],
                'width' => max(160, $box['width']),
                'height' => max(52, $box['height']),
                'fontSize' => count($textLines) === 1 ? 34 : 24,
                'fill' => '#111827',
            ];
        }

        $primaryMediaUrl = null;
        foreach ($xpath->query('//p:pic') as $node) {
            if (! $node instanceof DOMElement) {
                continue;
            }

            $embedNode = $xpath->query('.//a:blip/@r:embed', $node)->item(0);
            $relationshipId = $embedNode?->nodeValue;
            $target = $relationshipId ? ($relationships[$relationshipId] ?? null) : null;
            $url = $target ? $this->extractMedia($zip, $target, $deckId, $mediaCache) : null;

            if (! $url) {
                continue;
            }

            $box = $this->boxForNode($xpath, $node, $slideSize, $canvasSize, ['left' => 160, 'top' => 120, 'width' => 960, 'height' => 480]);
            $primaryMediaUrl ??= $url;

            $objects[] = [
                'kind' => 'image',
                'src' => $url,
                'left' => $box['left'],
                'top' => $box['top'],
                'width' => max(80, $box['width']),
                'height' => max(80, $box['height']),
            ];
        }

        return [
            'title' => $textLines[0] ?? null,
            'content' => implode("\n", array_slice($textLines, 1, 6)) ?: null,
            'primary_media_url' => $primaryMediaUrl,
            'canvas_json' => [
                'version' => 1,
                'width' => $canvasSize['width'],
                'height' => $canvasSize['height'],
                'objects' => $objects,
            ],
        ];
    }

    private function boxForNode(DOMXPath $xpath, DOMElement $node, array $slideSize, array $canvasSize, array $fallback): array
    {
        $off = $xpath->query('.//a:xfrm/a:off', $node)->item(0);
        $ext = $xpath->query('.//a:xfrm/a:ext', $node)->item(0);

        if (! $off instanceof DOMElement || ! $ext instanceof DOMElement) {
            return $fallback;
        }

        return [
            'left' => $this->scale((int) $off->getAttribute('x'), $slideSize['cx'], $canvasSize['width']),
            'top' => $this->scale((int) $off->getAttribute('y'), $slideSize['cy'], $canvasSize['height']),
            'width' => $this->scale((int) $ext->getAttribute('cx'), $slideSize['cx'], $canvasSize['width']),
            'height' => $this->scale((int) $ext->getAttribute('cy'), $slideSize['cy'], $canvasSize['height']),
        ];
    }

    private function scale(int $value, int $source, int $target): int
    {
        return (int) round(($value / max(1, $source)) * $target);
    }

    private function extractMedia(ZipArchive $zip, string $target, int $deckId, array &$mediaCache): ?string
    {
        if (isset($mediaCache[$target])) {
            return $mediaCache[$target];
        }

        if (! str_starts_with($target, 'ppt/media/')) {
            return null;
        }

        $extension = strtolower(pathinfo($target, PATHINFO_EXTENSION));
        if (! in_array($extension, ['png', 'jpg', 'jpeg', 'webp', 'gif'], true)) {
            return null;
        }

        $stat = $zip->statName($target);
        if (! $stat || (int) ($stat['size'] ?? 0) > self::MAX_MEDIA_BYTES) {
            return null;
        }

        $contents = $zip->getFromName($target);
        if ($contents === false) {
            return null;
        }

        $path = $this->storage->storePublicContent($contents, "presentations/assets/{$deckId}/extracted", $extension);
        $mediaCache[$target] = $this->storage->publicUrl($path);

        return $mediaCache[$target];
    }

    private function normalizePackagePath(string $path): string
    {
        $parts = [];
        foreach (explode('/', str_replace('\\', '/', $path)) as $part) {
            if ($part === '' || $part === '.') {
                continue;
            }

            if ($part === '..') {
                array_pop($parts);
                continue;
            }

            $parts[] = $part;
        }

        return implode('/', $parts);
    }

    private function dom(string $xml): ?DOMDocument
    {
        $previous = libxml_use_internal_errors(true);
        $document = new DOMDocument();
        $loaded = $document->loadXML($xml, LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        return $loaded ? $document : null;
    }

    private function emptyCanvas(array $canvasSize): array
    {
        return [
            'version' => 1,
            'width' => $canvasSize['width'],
            'height' => $canvasSize['height'],
            'objects' => [],
        ];
    }
}
