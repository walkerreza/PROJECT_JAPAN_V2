<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Flashcard;
use App\Models\SetFlashcard;
use App\Models\LevelPembelajaran;
use App\Models\Modul;
use App\Models\Soal;
use App\Models\Kuis;
use App\Models\Kosakata;
use App\Services\ImportSpreadsheetService;
use App\Services\NotifikasiPenggunaService;
use App\Services\TemplateExcelService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminFlashcardController extends Controller
{
    public function index(Request $request)
    {
        $query = SetFlashcard::with(['level:id,level_name', 'module:id,title,week_number'])
            ->withCount('flashcards')
            ->latest();

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where('title', 'like', "%{$search}%");
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        return Inertia::render('Admin/Flashcard/ManajemenFlashcard', [
            'sets' => $query->paginate(10)->withQueryString(),
            'filters' => $request->only('search', 'status'),
            'levels' => LevelPembelajaran::orderBy('stage')->get(['id', 'level_name']),
            'modules' => Modul::orderBy('week_number')->orderBy('id')->get(['id', 'title', 'week_number']),
        ]);
    }

    public function store(Request $request, NotifikasiPenggunaService $notifikasi)
    {
        $validated = $this->validateSet($request);
        $set = SetFlashcard::create($validated + ['source_type' => 'vocabulary']);

        if ($set->status === 'published') {
            $this->kirimNotifikasiFlashcardTerbit($set, $notifikasi);
        }

        return redirect()->route('admin.flashcards.builder', $set)->with('success', 'Flashcard set berhasil dibuat.');
    }

    public function update(Request $request, SetFlashcard $flashcardSet, NotifikasiPenggunaService $notifikasi)
    {
        $oldStatus = $flashcardSet->status;
        $flashcardSet->update($this->validateSet($request));

        if ($oldStatus !== 'published' && $flashcardSet->status === 'published') {
            $this->kirimNotifikasiFlashcardTerbit($flashcardSet, $notifikasi);
        }

        return redirect()->back()->with('success', 'Flashcard set berhasil diperbarui.');
    }

    public function destroy(SetFlashcard $flashcardSet)
    {
        $flashcardSet->delete();

        return redirect()->back()->with('success', 'Flashcard set berhasil dihapus.');
    }

    public function builder(SetFlashcard $flashcardSet, Request $request)
    {
        $flashcardSet->load(['level:id,level_name', 'module:id,title,week_number', 'flashcards.vocabulary']);

        $vocabularyQuery = Kosakata::query()
            ->where(function ($query) use ($flashcardSet) {
                $query->whereNull('module_id')
                    ->orWhere('module_id', $flashcardSet->module_id);
            })
            ->orderBy('word');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $vocabularyQuery->where(function ($query) use ($search) {
                $query->where('word', 'like', "%{$search}%")
                    ->orWhere('reading', 'like', "%{$search}%")
                    ->orWhere('meaning_id', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $vocabularyQuery->where('status', $request->status);
        }

        if ($request->filled('content_type') && $request->content_type !== 'all') {
            $vocabularyQuery->where('content_type', $request->content_type);
        }

        return Inertia::render('Admin/Flashcard/BuilderFlashcard', [
            'set' => $flashcardSet,
            'vocabulary' => $vocabularyQuery->paginate(12)->withQueryString(),
            'filters' => $request->only('search', 'status', 'content_type'),
            'quizzes' => Kuis::with('module:id,title,week_number')->orderByDesc('id')->get(['id', 'module_id', 'type', 'status']),
        ]);
    }

    public function updateCards(Request $request, SetFlashcard $flashcardSet, NotifikasiPenggunaService $notifikasi)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:draft,published'],
            'cards' => ['present', 'array'],
            'cards.*.id' => ['nullable', 'integer'],
            'cards.*.vocabulary_id' => ['nullable', 'integer', 'exists:vocabulary_bank,id'],
            'cards.*.front_text' => ['required', 'string', 'max:255'],
            'cards.*.reading' => ['nullable', 'string', 'max:255'],
            'cards.*.back_text' => ['nullable', 'string'],
            'cards.*.hint' => ['nullable', 'string'],
            'cards.*.example_sentence' => ['nullable', 'string'],
            'cards.*.example_meaning' => ['nullable', 'string'],
            'cards.*.audio_url' => ['nullable', 'string', 'max:2048'],
        ]);

        $ids = [];
        $oldStatus = $flashcardSet->status;

        DB::transaction(function () use ($flashcardSet, $validated, &$ids) {
            $flashcardSet->update(['status' => $validated['status']]);

            foreach ($validated['cards'] as $index => $card) {
                $model = $flashcardSet->flashcards()->updateOrCreate(
                    ['id' => $card['id'] ?? null],
                    [
                        'vocabulary_id' => $card['vocabulary_id'] ?? null,
                        'front_text' => $card['front_text'],
                        'reading' => $card['reading'] ?? null,
                        'back_text' => $card['back_text'] ?? null,
                        'hint' => $card['hint'] ?? null,
                        'example_sentence' => $card['example_sentence'] ?? null,
                        'example_meaning' => $card['example_meaning'] ?? null,
                        'audio_url' => $card['audio_url'] ?? null,
                        'order' => $index,
                    ]
                );

                $ids[] = $model->id;
            }

            $flashcardSet->flashcards()->whereNotIn('id', $ids)->delete();
        });

        if ($oldStatus !== 'published' && $flashcardSet->fresh()->status === 'published') {
            $this->kirimNotifikasiFlashcardTerbit($flashcardSet, $notifikasi);
        }

        return redirect()->back()->with('success', 'Flashcard berhasil disimpan.');
    }

    public function importCards(
        Request $request,
        SetFlashcard $flashcardSet,
        ImportSpreadsheetService $spreadsheets
    ) {
        $validated = $request->validate([
            'import_file' => ['required', 'file', 'max:4096'],
        ]);

        $file = $validated['import_file'];
        $extension = strtolower($file->getClientOriginalExtension());

        if (! in_array($extension, ['csv', 'txt', 'xlsx'], true)) {
            return redirect()->back()->withErrors(['import_file' => 'Gunakan CSV atau XLSX untuk import flashcard.']);
        }

        $rows = $spreadsheets->rows($file->getRealPath(), $extension);

        if (empty($rows)) {
            return redirect()->back()->withErrors(['import_file' => 'File kosong atau header tidak valid.']);
        }

        $nextOrder = (int) $flashcardSet->flashcards()->max('order') + 1;
        $created = 0;

        DB::transaction(function () use ($flashcardSet, $rows, $nextOrder, &$created) {
            foreach ($rows as $index => $row) {
                $frontText = trim((string) ($row['front_text'] ?? $row['word'] ?? $row['kata'] ?? ''));

                if ($frontText === '') {
                    continue;
                }

                $reading = trim((string) ($row['reading'] ?? $row['kana'] ?? ''));
                $vocabularyId = $this->resolveVocabularyId($row, $frontText, $reading);

                Flashcard::create([
                    'flashcard_set_id' => $flashcardSet->id,
                    'vocabulary_id' => $vocabularyId,
                    'front_text' => $frontText,
                    'reading' => $reading !== '' ? $reading : null,
                    'back_text' => $row['back_text'] ?? $row['meaning_id'] ?? $row['arti'] ?? null,
                    'hint' => $row['hint'] ?? $row['category'] ?? $row['kategori'] ?? null,
                    'example_sentence' => $row['example_sentence'] ?? $row['contoh_kalimat'] ?? null,
                    'example_meaning' => $row['example_meaning'] ?? $row['arti_contoh'] ?? null,
                    'audio_url' => $row['audio_url'] ?? null,
                    'order' => $nextOrder + $index,
                ]);

                $created++;
            }
        });

        if ($created === 0) {
            return redirect()->back()->withErrors(['import_file' => 'Tidak ada kartu valid. Pastikan kolom front_text atau word terisi.']);
        }

        return redirect()->back()->with('success', "{$created} flashcard berhasil diimport.");
    }

    public function downloadImportTemplate(
        SetFlashcard $flashcardSet,
        TemplateExcelService $templates,
        ?string $format = 'xlsx'
    ) {
        $format = strtolower($format ?: 'xlsx');

        if (! in_array($format, ['csv', 'xlsx'], true)) {
            abort(404);
        }

        $headers = $this->flashcardImportHeaders();
        $rows = $this->flashcardTemplateRows();
        $filename = 'japanlingo-flashcard-template.' . $format;

        if ($format === 'csv') {
            return $templates->csvResponse($headers, $rows, $filename);
        }

        $path = $templates->xlsxPath($headers, $rows, 'Flashcard Import', 'japanlingo_flashcard_template_');

        return response()
            ->download($path, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])
            ->deleteFileAfterSend(true);
    }

    public function generateQuiz(Request $request, SetFlashcard $flashcardSet)
    {
        $validated = $request->validate([
            'quiz_id' => ['required', 'integer', 'exists:quizzes,id'],
            'mode' => ['required', Rule::in(['word_to_meaning', 'meaning_to_word', 'reading_to_word'])],
            'count' => ['required', 'integer', 'min:1', 'max:50'],
        ]);

        $quiz = Kuis::findOrFail($validated['quiz_id']);
        $cards = $flashcardSet->flashcards()->whereNotNull('back_text')->inRandomOrder()->take($validated['count'])->get();

        if ($cards->count() < 2) {
            return redirect()->back()->withErrors(['generate' => 'Minimal butuh 2 kartu dengan arti untuk membuat soal pilihan ganda.']);
        }

        $nextOrder = (int) $quiz->questions()->max('order') + 1;

        DB::transaction(function () use ($quiz, $cards, $validated, $nextOrder) {
            foreach ($cards as $index => $card) {
                $question = $this->buildQuestion($card, $cards, $validated['mode']);

                Soal::create([
                    'quiz_id' => $quiz->id,
                    'type' => 'multiple_choice',
                    'question_text' => $question['question_text'],
                    'correct_answer' => $question['correct_answer'],
                    'options' => $question['options'],
                    'explanation' => $question['explanation'],
                    'order' => $nextOrder + $index,
                ]);
            }
        });

        return redirect()->back()->with('success', $cards->count() . ' soal berhasil dibuat dari flashcard.');
    }

    private function validateSet(Request $request): array
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'level_id' => ['nullable', 'integer', 'exists:levels,id'],
            'module_id' => ['required', 'integer', 'exists:modules,id'],
            'status' => ['required', 'in:draft,published'],
        ]);

        return $validated;
    }

    private function kirimNotifikasiFlashcardTerbit(SetFlashcard $flashcardSet, NotifikasiPenggunaService $notifikasi): void
    {
        $flashcardSet->loadMissing('module.programPembelajaran');

        if (! $flashcardSet->module) {
            return;
        }

        $url = $flashcardSet->module->programPembelajaran
            ? route('user.modul.program', $flashcardSet->module->programPembelajaran->slug)
            : route('user.kelas.index');

        $notifikasi->kirimKePenggunaYangBisaAksesModul(
            $flashcardSet->module,
            'new_flashcard',
            'Flashcard baru tersedia',
            "{$flashcardSet->title} sudah bisa dipelajari.",
            $url,
            ['flashcard_set_id' => $flashcardSet->id, 'module_id' => $flashcardSet->module_id]
        );
    }

    private function buildQuestion($card, $pool, string $mode): array
    {
        if ($mode === 'meaning_to_word') {
            $correct = $card->front_text;
            $options = $this->options($correct, $pool->pluck('front_text')->all());

            return [
                'question_text' => 'Pilih kosakata Jepang untuk arti: ' . $card->back_text,
                'correct_answer' => $correct,
                'options' => $options,
                'explanation' => trim(($card->front_text ?? '') . ' / ' . ($card->reading ?? '') . ' = ' . ($card->back_text ?? '')),
            ];
        }

        if ($mode === 'reading_to_word') {
            $correct = $card->front_text;
            $options = $this->options($correct, $pool->pluck('front_text')->all());

            return [
                'question_text' => 'Pilih kosakata untuk reading: ' . ($card->reading ?: $card->hint ?: $card->back_text),
                'correct_answer' => $correct,
                'options' => $options,
                'explanation' => trim(($card->front_text ?? '') . ' / ' . ($card->reading ?? '') . ' = ' . ($card->back_text ?? '')),
            ];
        }

        $correct = $card->back_text;
        $options = $this->options($correct, $pool->pluck('back_text')->filter()->all());

        return [
            'question_text' => 'Apa arti dari ' . $card->front_text . ($card->reading ? " ({$card->reading})" : '') . '?',
            'correct_answer' => $correct,
            'options' => $options,
            'explanation' => trim(($card->front_text ?? '') . ' / ' . ($card->reading ?? '') . ' = ' . ($card->back_text ?? '')),
        ];
    }

    private function options(string $correct, array $pool): array
    {
        $options = collect($pool)
            ->filter(fn ($item) => trim((string) $item) !== '' && $item !== $correct)
            ->unique()
            ->shuffle()
            ->take(3)
            ->push($correct)
            ->shuffle()
            ->values()
            ->all();

        return count($options) >= 2 ? $options : [$correct];
    }

    private function resolveVocabularyId(array $row, string $frontText, string $reading): ?int
    {
        if (! empty($row['vocabulary_id']) && is_numeric($row['vocabulary_id'])) {
            return (int) $row['vocabulary_id'];
        }

        $query = Kosakata::query()->where('word', $frontText);

        if ($reading !== '') {
            $query->where('reading', $reading);
        }

        return $query->value('id');
    }

    private function flashcardImportHeaders(): array
    {
        return ['vocabulary_id', 'front_text', 'reading', 'back_text', 'hint', 'example_sentence', 'example_meaning', 'audio_url'];
    }

    private function flashcardTemplateRows(): array
    {
        return [
            ['', '会議', 'かいぎ', 'rapat', 'noun / kantor', '今日は一時から会議があります。', 'Hari ini ada rapat mulai jam satu.', ''],
            ['', '一つ', 'ひとつ', 'satu buah', 'counter', '机の上にりんごが一つあります。', 'Ada satu apel di atas meja.', ''],
        ];
    }
}
