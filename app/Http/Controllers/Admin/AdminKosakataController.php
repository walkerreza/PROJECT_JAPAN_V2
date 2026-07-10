<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Kosakata;
use App\Services\NotifikasiPenggunaService;
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

    public function import(Request $request)
    {
        $validated = $request->validate([
            'import_file' => ['required', 'file', 'max:4096'],
        ]);

        $extension = strtolower($validated['import_file']->getClientOriginalExtension());

        if (! in_array($extension, ['csv', 'txt'], true)) {
            return redirect()->back()->withErrors(['import_file' => 'Gunakan CSV untuk import Kosakata Bank.']);
        }

        $handle = fopen($validated['import_file']->getRealPath(), 'r');

        if (! $handle) {
            return redirect()->back()->withErrors(['import_file' => 'File tidak dapat dibaca.']);
        }

        $header = fgetcsv($handle);

        if (! $header) {
            fclose($handle);
            return redirect()->back()->withErrors(['import_file' => 'CSV kosong atau header tidak valid.']);
        }

        $headers = array_map(fn ($value) => ltrim(str($value)->lower()->replace(' ', '_')->toString(), "\xEF\xBB\xBF"), $header);
        $created = 0;

        while (($row = fgetcsv($handle)) !== false) {
            $data = array_combine($headers, array_slice(array_pad($row, count($headers), null), 0, count($headers)));
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

        fclose($handle);

        return redirect()->back()->with('success', "{$created} kosakata berhasil diimport.");
    }

    public function template()
    {
        $headers = ['word', 'reading', 'meaning_id', 'meaning_en', 'jlpt_level', 'category', 'tags', 'example_sentence', 'example_reading', 'example_meaning', 'audio_url', 'status'];
        $rows = [
            ['一つ', 'ひとつ', 'satu buah', 'one thing', 'N3', 'counter', 'number|daily', '机の上にりんごが一つあります。', 'つくえのうえにりんごがひとつあります。', 'Ada satu apel di atas meja.', '', 'draft'],
            ['会議', 'かいぎ', 'rapat', 'meeting', 'N3', 'noun', 'work|office', '今日は一時から会議があります。', 'きょうはいちじからかいぎがあります。', 'Hari ini ada rapat mulai jam satu.', '', 'draft'],
        ];

        return response()->streamDownload(function () use ($headers, $rows) {
            $output = fopen('php://output', 'w');
            fwrite($output, "\xEF\xBB\xBF");
            fputcsv($output, $headers);

            foreach ($rows as $row) {
                fputcsv($output, $row);
            }

            fclose($output);
        }, 'japanlingo-vocabulary-template.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
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
}
