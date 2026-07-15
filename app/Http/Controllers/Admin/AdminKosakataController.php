<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Kosakata;
use App\Models\Modul;
use App\Services\ImportSpreadsheetService;
use App\Services\NotifikasiPenggunaService;
use App\Services\TemplateExcelService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminKosakataController extends Controller
{
    public function index(Request $request)
    {
        $query = Kosakata::with('module:id,title,week_number')->latest();

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($query) use ($search) {
                $query->where('word', 'like', "%{$search}%")
                    ->orWhere('reading', 'like', "%{$search}%")
                    ->orWhere('meaning_id', 'like', "%{$search}%")
                    ->orWhere('meaning_en', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('source_title', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('content_type') && $request->content_type !== 'all') {
            $query->where('content_type', $request->content_type);
        }

        if ($request->filled('module_id') && $request->module_id !== 'all') {
            $query->where('module_id', $request->integer('module_id'));
        }

        if ($request->filled('jlpt_level') && $request->jlpt_level !== 'all') {
            $query->where('jlpt_level', $request->jlpt_level);
        }

        return Inertia::render('Admin/Kosakata/Kosakata', [
            'vocabulary' => $query->paginate(12)->withQueryString(),
            'filters' => $request->only('search', 'status', 'jlpt_level', 'content_type', 'module_id'),
            'modules' => Modul::with('programPembelajaran:id,title')
                ->orderBy('program_pembelajaran_id')
                ->orderBy('week_number')
                ->get(['id', 'program_pembelajaran_id', 'title', 'week_number']),
            'contentTypes' => Kosakata::contentTypes(),
        ]);
    }

    public function store(Request $request, NotifikasiPenggunaService $notifikasi)
    {
        $content = Kosakata::create($this->validateVocabulary($request));

        if ($content->status === 'published') {
            $this->kirimNotifikasiKosakataTerbit($content, $notifikasi);
        }

        return redirect()->back()->with('success', 'Konten N3 berhasil ditambahkan.');
    }

    public function update(Request $request, Kosakata $vocabulary, NotifikasiPenggunaService $notifikasi)
    {
        $oldStatus = $vocabulary->status;
        $vocabulary->update($this->validateVocabulary($request, $vocabulary));

        if ($oldStatus !== 'published' && $vocabulary->status === 'published') {
            $this->kirimNotifikasiKosakataTerbit($vocabulary, $notifikasi);
        }

        return redirect()->back()->with('success', 'Konten N3 berhasil diperbarui.');
    }

    public function destroy(Kosakata $vocabulary)
    {
        $vocabulary->delete();

        return redirect()->back()->with('success', 'Konten N3 berhasil dihapus.');
    }

    public function import(Request $request, ImportSpreadsheetService $spreadsheets)
    {
        $validated = $request->validate([
            'import_file' => ['required', 'file', 'max:4096'],
            'content_type' => ['nullable', Rule::in(Kosakata::contentTypes())],
            'module_id' => ['nullable', 'integer', 'exists:modules,id'],
            'source_type' => ['nullable', 'string', 'max:30'],
            'source_title' => ['nullable', 'string', 'max:255'],
        ]);

        $file = $validated['import_file'];
        $extension = strtolower($file->getClientOriginalExtension());

        if (! in_array($extension, ['csv', 'txt', 'xlsx'], true)) {
            return redirect()->back()->withErrors(['import_file' => 'Gunakan CSV atau XLSX untuk import Bank Konten N3.']);
        }

        $rows = $spreadsheets->rows($file->getRealPath(), $extension);

        if (empty($rows)) {
            return redirect()->back()->withErrors(['import_file' => 'File kosong atau header tidak valid.']);
        }

        $created = 0;

        foreach ($rows as $data) {
            $contentType = $this->normalizeContentType($data['content_type'] ?? $data['tipe_konten'] ?? $validated['content_type'] ?? Kosakata::TYPE_KOSAKATA);
            $word = trim((string) ($data['main_text'] ?? $data['word'] ?? $data['kata'] ?? $data['kanji'] ?? $data['pattern'] ?? $data['pola'] ?? ''));

            if ($word === '') {
                continue;
            }

            $reading = $data['reading'] ?? $data['kana'] ?? $data['onyomi'] ?? $data['struktur'] ?? null;

            Kosakata::updateOrCreate(
                [
                    'word' => $word,
                    'reading' => $reading,
                ],
                [
                    'content_type' => $contentType,
                    'module_id' => $this->resolveModuleId($data, $validated['module_id'] ?? null),
                    'meaning_id' => $data['meaning_id'] ?? $data['arti_indonesia'] ?? $data['arti'] ?? null,
                    'meaning_en' => $data['meaning_en'] ?? $data['english'] ?? null,
                    'jlpt_level' => $data['jlpt_level'] ?? 'N3',
                    'category' => $data['category'] ?? $data['kategori'] ?? null,
                    'tags' => ! empty($data['tags']) ? preg_split('/\s*\|\s*/', $data['tags']) : null,
                    'example_sentence' => $data['example_sentence'] ?? $data['contoh_kalimat'] ?? null,
                    'example_reading' => $data['example_reading'] ?? $data['reading_contoh'] ?? null,
                    'example_meaning' => $data['example_meaning'] ?? $data['arti_contoh'] ?? null,
                    'audio_url' => $data['audio_url'] ?? null,
                    'source_type' => $data['source_type'] ?? $validated['source_type'] ?? $extension,
                    'source_title' => $data['source_title'] ?? $validated['source_title'] ?? $file->getClientOriginalName(),
                    'metadata' => $this->metadataFromImportRow($data, $contentType),
                    'status' => $data['status'] ?? 'draft',
                ]
            );

            $created++;
        }

        return redirect()->back()->with('success', "{$created} konten N3 berhasil diimport.");
    }

    public function template(TemplateExcelService $templates, ?string $format = 'xlsx')
    {
        $format = strtolower($format ?: 'xlsx');

        if (! in_array($format, ['csv', 'xlsx'], true)) {
            abort(404);
        }

        $headers = $this->importHeaders();
        $rows = $this->templateRows();
        $filename = 'japanlingo-bank-konten-n3-template.' . $format;

        if ($format === 'csv') {
            return $templates->csvResponse($headers, $rows, $filename);
        }

        $path = $templates->xlsxPath($headers, $rows, 'Bank Konten N3', 'japanlingo_bank_konten_n3_template_');

        return response()
            ->download($path, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])
            ->deleteFileAfterSend(true);
    }

    private function validateVocabulary(Request $request, ?Kosakata $vocabulary = null): array
    {
        return $request->validate([
            'word' => [
                'required',
                'string',
                'max:255',
                Rule::unique('vocabulary_bank', 'word')
                    ->where(fn ($query) => $query->where('reading', $request->input('reading')))
                    ->ignore($vocabulary?->id),
            ],
            'content_type' => ['required', Rule::in(Kosakata::contentTypes())],
            'module_id' => ['nullable', 'integer', 'exists:modules,id'],
            'reading' => ['nullable', 'string', 'max:255'],
            'meaning_id' => ['nullable', 'string'],
            'meaning_en' => ['nullable', 'string'],
            'jlpt_level' => ['required', 'string', 'max:8'],
            'category' => ['nullable', 'string', 'max:100'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['nullable', 'string', 'max:50'],
            'example_sentence' => ['nullable', 'string'],
            'example_reading' => ['nullable', 'string'],
            'example_meaning' => ['nullable', 'string'],
            'audio_url' => ['nullable', 'string', 'max:2048'],
            'source_type' => ['nullable', 'string', 'max:30'],
            'source_title' => ['nullable', 'string', 'max:255'],
            'metadata' => ['nullable', 'array'],
            'status' => ['required', 'in:draft,published'],
        ]);
    }

    private function kirimNotifikasiKosakataTerbit(Kosakata $vocabulary, NotifikasiPenggunaService $notifikasi): void
    {
        $notifikasi->kirimKeSemuaPengguna(
            'new_vocabulary',
            'Konten N3 baru tersedia',
            "{$vocabulary->word} sudah masuk ke Bank Konten N3.",
            route('user.kelas.index'),
            ['vocabulary_id' => $vocabulary->id]
        );
    }

    private function importHeaders(): array
    {
        return ['content_type', 'module_id', 'module_week', 'main_text', 'reading', 'meaning_id', 'meaning_en', 'jlpt_level', 'category', 'tags', 'example_sentence', 'example_reading', 'example_meaning', 'notes', 'onyomi', 'kunyomi', 'source_type', 'source_title', 'audio_url', 'status'];
    }

    private function templateRows(): array
    {
        return [
            ['kosakata', '', 1, '会議', 'かいぎ', 'rapat', 'meeting', 'N3', 'pekerjaan', 'work|office', '今日は一時から会議があります。', 'きょうはいちじからかいぎがあります。', 'Hari ini ada rapat mulai jam satu.', '', '', '', 'xlsx', 'ALL - KOSAKATA N3-2.pdf', '', 'draft'],
            ['kanji', '', 1, '割', 'わり', 'membagi, diskon', 'divide, discount', 'N3', 'belanja', 'kanji|shopping', '割引があります。', 'わりびきがあります。', 'Ada diskon.', 'Contoh kata: 割引', 'カツ', 'わ.る', 'xlsx', 'ALL - KANJI N3 2.pdf', '', 'draft'],
            ['bunpo', '', 1, '〜ように', 'Vる/ない + ように', 'agar, supaya', 'so that', 'N3', 'grammar', 'bunpo|pattern', '忘れないようにメモします。', 'わすれないようにメモします。', 'Saya mencatat supaya tidak lupa.', 'Pakai untuk tujuan atau harapan.', '', '', 'xlsx', 'ALL - BUNPO N3.pdf', '', 'draft'],
        ];
    }

    private function normalizeContentType(?string $type): string
    {
        $type = str($type)->lower()->trim()->toString();

        return in_array($type, Kosakata::contentTypes(), true)
            ? $type
            : Kosakata::TYPE_KOSAKATA;
    }

    private function resolveModuleId(array $row, ?int $fallback): ?int
    {
        if (! empty($row['module_id']) && is_numeric($row['module_id'])) {
            return (int) $row['module_id'];
        }

        if (! empty($row['module_week']) && is_numeric($row['module_week'])) {
            return Modul::where('week_number', (int) $row['module_week'])->value('id');
        }

        return $fallback;
    }

    private function metadataFromImportRow(array $row, string $contentType): array
    {
        return array_filter([
            'content_type' => $contentType,
            'notes' => $row['notes'] ?? $row['catatan'] ?? null,
            'onyomi' => $row['onyomi'] ?? null,
            'kunyomi' => $row['kunyomi'] ?? null,
            'source_page' => $row['source_page'] ?? $row['halaman'] ?? null,
            'source_day' => $row['source_day'] ?? $row['hari'] ?? null,
        ], fn ($value) => $value !== null && $value !== '');
    }
}
