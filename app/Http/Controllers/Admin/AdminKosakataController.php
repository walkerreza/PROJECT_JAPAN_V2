<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Kosakata;
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
        $query = Kosakata::query()->latest();

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($query) use ($search) {
                $query->where('word', 'like', "%{$search}%")
                    ->orWhere('reading', 'like', "%{$search}%")
                    ->orWhere('meaning_id', 'like', "%{$search}%")
                    ->orWhere('meaning_en', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('jlpt_level') && $request->jlpt_level !== 'all') {
            $query->where('jlpt_level', $request->jlpt_level);
        }

        return Inertia::render('Admin/Kosakata/Kosakata', [
            'vocabulary' => $query->paginate(12)->withQueryString(),
            'filters' => $request->only('search', 'status', 'jlpt_level'),
        ]);
    }

    public function store(Request $request, NotifikasiPenggunaService $notifikasi)
    {
        $vocabulary = Kosakata::create($this->validateVocabulary($request));

        if ($vocabulary->status === 'published') {
            $this->kirimNotifikasiKosakataTerbit($vocabulary, $notifikasi);
        }

        return redirect()->back()->with('success', 'Kosakata berhasil ditambahkan.');
    }

    public function update(Request $request, Kosakata $vocabulary, NotifikasiPenggunaService $notifikasi)
    {
        $oldStatus = $vocabulary->status;
        $vocabulary->update($this->validateVocabulary($request, $vocabulary));

        if ($oldStatus !== 'published' && $vocabulary->status === 'published') {
            $this->kirimNotifikasiKosakataTerbit($vocabulary, $notifikasi);
        }

        return redirect()->back()->with('success', 'Kosakata berhasil diperbarui.');
    }

    public function destroy(Kosakata $vocabulary)
    {
        $vocabulary->delete();

        return redirect()->back()->with('success', 'Kosakata berhasil dihapus.');
    }

    public function import(Request $request, ImportSpreadsheetService $spreadsheets)
    {
        $validated = $request->validate([
            'import_file' => ['required', 'file', 'max:4096'],
        ]);

        $file = $validated['import_file'];
        $extension = strtolower($file->getClientOriginalExtension());

        if (! in_array($extension, ['csv', 'txt', 'xlsx'], true)) {
            return redirect()->back()->withErrors(['import_file' => 'Gunakan CSV atau XLSX untuk import Kosakata Bank.']);
        }

        $rows = $spreadsheets->rows($file->getRealPath(), $extension);

        if (empty($rows)) {
            return redirect()->back()->withErrors(['import_file' => 'File kosong atau header tidak valid.']);
        }

        $created = 0;

        foreach ($rows as $data) {
            $word = trim((string) ($data['word'] ?? $data['kata'] ?? ''));

            if ($word === '') {
                continue;
            }

            Kosakata::updateOrCreate(
                [
                    'word' => $word,
                    'reading' => $data['reading'] ?? $data['kana'] ?? null,
                ],
                [
                    'meaning_id' => $data['meaning_id'] ?? $data['arti_indonesia'] ?? $data['arti'] ?? null,
                    'meaning_en' => $data['meaning_en'] ?? $data['english'] ?? null,
                    'jlpt_level' => $data['jlpt_level'] ?? 'N3',
                    'category' => $data['category'] ?? $data['kategori'] ?? null,
                    'tags' => ! empty($data['tags']) ? preg_split('/\s*\|\s*/', $data['tags']) : null,
                    'example_sentence' => $data['example_sentence'] ?? $data['contoh_kalimat'] ?? null,
                    'example_reading' => $data['example_reading'] ?? $data['reading_contoh'] ?? null,
                    'example_meaning' => $data['example_meaning'] ?? $data['arti_contoh'] ?? null,
                    'audio_url' => $data['audio_url'] ?? null,
                    'status' => $data['status'] ?? 'draft',
                ]
            );

            $created++;
        }

        return redirect()->back()->with('success', "{$created} kosakata berhasil diimport.");
    }

    public function template(TemplateExcelService $templates, ?string $format = 'xlsx')
    {
        $format = strtolower($format ?: 'xlsx');

        if (! in_array($format, ['csv', 'xlsx'], true)) {
            abort(404);
        }

        $headers = $this->importHeaders();
        $rows = $this->templateRows();
        $filename = 'japanlingo-vocabulary-template.' . $format;

        if ($format === 'csv') {
            return $templates->csvResponse($headers, $rows, $filename);
        }

        $path = $templates->xlsxPath($headers, $rows, 'Kosakata Import', 'japanlingo_vocabulary_template_');

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
            'status' => ['required', 'in:draft,published'],
        ]);
    }

    private function kirimNotifikasiKosakataTerbit(Kosakata $vocabulary, NotifikasiPenggunaService $notifikasi): void
    {
        $notifikasi->kirimKeSemuaPengguna(
            'new_vocabulary',
            'Kosakata baru tersedia',
            "{$vocabulary->word} sudah masuk ke library kosakata.",
            route('user.kelas.index'),
            ['vocabulary_id' => $vocabulary->id]
        );
    }

    private function importHeaders(): array
    {
        return ['word', 'reading', 'meaning_id', 'meaning_en', 'jlpt_level', 'category', 'tags', 'example_sentence', 'example_reading', 'example_meaning', 'audio_url', 'status'];
    }

    private function templateRows(): array
    {
        return [
            ['一つ', 'ひとつ', 'satu buah', 'one thing', 'N3', 'counter', 'number|daily', '机の上にりんごが一つあります。', 'つくえのうえにりんごがひとつあります。', 'Ada satu apel di atas meja.', '', 'draft'],
            ['会議', 'かいぎ', 'rapat', 'meeting', 'N3', 'noun', 'work|office', '今日は一時から会議があります。', 'きょうはいちじからかいぎがあります。', 'Hari ini ada rapat mulai jam satu.', '', 'draft'],
        ];
    }
}
