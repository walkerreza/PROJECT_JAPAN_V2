<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\KuisRequest;
use App\Models\Kosakata;
use App\Models\Kuis;
use App\Models\Modul;
use App\Models\Soal;
use App\Services\ImportSpreadsheetService;
use App\Services\NotifikasiPenggunaService;
use App\Services\SoalKuisService;
use App\Services\TemplateExcelService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminKuisController extends Controller
{
    public function index(Request $request)
    {
        $query = Kuis::with(['module:id,title,week_number'])
            ->withCount('questions')
            ->latest();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($query) use ($search) {
                $query->whereHas('module', fn ($moduleQuery) => $moduleQuery->where('title', 'like', '%' . $search . '%'))
                    ->orWhere('type', 'like', '%' . $search . '%');
            });
        }

        if ($request->filled('module_id')) {
            $query->where('module_id', $request->module_id);
        }

        $quizzes = $query->paginate(10)->through(fn ($quiz) => [
            'id' => $quiz->id,
            'type' => $quiz->type,
            'time_limit' => $quiz->time_limit,
            'passing_score' => $quiz->passing_score ?? 70,
            'status' => $quiz->status ?? 'published',
            'question_count' => $quiz->questions_count,
            'module' => $quiz->module,
            'lesson' => null,
        ]);

        return Inertia::render('Admin/Kuis/ManajemenKuis', [
            'quizzes' => $quizzes,
            'modules' => Modul::orderBy('week_number')->orderBy('id')->get(['id', 'title', 'week_number']),
            'filters' => $request->only('search', 'module_id'),
        ]);
    }

    public function store(KuisRequest $request, NotifikasiPenggunaService $notifikasi)
    {
        $quiz = Kuis::create($request->validated());

        if ($quiz->status === 'published') {
            $this->kirimNotifikasiKuisTerbit($quiz, $notifikasi);
        }

        return redirect()->back()->with('success', 'Kuis berhasil dibuat');
    }

    public function update(KuisRequest $request, Kuis $quiz, NotifikasiPenggunaService $notifikasi)
    {
        $oldStatus = $quiz->status;
        $quiz->update($request->validated());

        if ($oldStatus !== 'published' && $quiz->status === 'published') {
            $this->kirimNotifikasiKuisTerbit($quiz, $notifikasi);
        }

        return redirect()->back()->with('success', 'Kuis berhasil diperbarui');
    }

    public function updateStatus(Request $request, Kuis $quiz, NotifikasiPenggunaService $notifikasi)
    {
        $oldStatus = $quiz->status;
        $quiz->update($request->validate([
            'status' => ['required', 'in:draft,published'],
        ]));

        if ($oldStatus !== 'published' && $quiz->status === 'published') {
            $this->kirimNotifikasiKuisTerbit($quiz, $notifikasi);
        }

        return redirect()->back()->with('success', 'Status kuis berhasil diperbarui');
    }

    public function destroy(Kuis $quiz)
    {
        $quiz->delete();

        return redirect()->back()->with('success', 'Kuis berhasil dihapus');
    }

    public function legacyQuestionsIndex()
    {
        return redirect()->route('admin.quizzes.index');
    }

    public function legacyQuestionEdit(Soal $question)
    {
        return redirect()->route('admin.quizzes.builder', $question->quiz_id);
    }

    public function legacyQuestionsGone()
    {
        abort(410, 'Soal dikelola lewat Builder Kuis.');
    }

    public function builder(Kuis $quiz)
    {
        $quiz->load([
            'module:id,title,week_number',
            'questions' => fn ($query) => $query
                ->withCount([
                    'attemptAnswers as attempts_count',
                    'attemptAnswers as correct_count' => fn ($answerQuery) => $answerQuery->where('is_correct', true),
                ])
                ->orderBy('order'),
        ]);

        return Inertia::render('Admin/Kuis/BuilderKuis', [
            'quiz' => [
                'id' => $quiz->id,
                'type' => $quiz->type,
                'time_limit' => $quiz->time_limit,
                'passing_score' => $quiz->passing_score ?? 70,
                'status' => $quiz->status ?? 'published',
                'module' => $quiz->module,
                'lesson' => null,
            ],
            'questions' => $quiz->questions->map(fn ($question) => [
                'id' => $question->id,
                'type' => $question->type ?: ($quiz->type ?: 'multiple_choice'),
                'question_text' => $question->question_text,
                'correct_answer' => $question->correct_answer,
                'options' => $question->options ?? [],
                'explanation' => $question->explanation,
                'audio_url' => $question->audio_url,
                'order' => $question->order,
                'attempts_count' => (int) $question->attempts_count,
                'correct_count' => (int) $question->correct_count,
                'correct_rate' => $question->attempts_count > 0
                    ? round(($question->correct_count / $question->attempts_count) * 100, 1)
                    : null,
            ]),
        ]);
    }

    public function updateQuestions(Request $request, Kuis $quiz, SoalKuisService $questions)
    {
        $validated = $request->validate([
            'time_limit' => ['nullable', 'integer', 'min:0', 'max:1440'],
            'passing_score' => ['nullable', 'integer', 'min:1', 'max:100'],
            'questions' => 'required|array',
            'questions.*.id' => 'nullable|integer',
            'questions.*.type' => ['required', Rule::in(['multiple_choice', 'fill_blank', 'listening'])],
            'questions.*.question_text' => 'required|string|max:5000',
            'questions.*.correct_answer' => 'required|string|max:1000',
            'questions.*.options' => 'nullable|array',
            'questions.*.options.*' => 'nullable|string|max:1000',
            'questions.*.explanation' => 'nullable|string|max:5000',
            'questions.*.audio_url' => 'nullable|string|max:2048',
        ]);

        $quiz->update([
            'time_limit' => $validated['time_limit'] ?? null,
            'passing_score' => $validated['passing_score'] ?? ($quiz->passing_score ?? 70),
        ]);

        $questions->syncQuestions($quiz, $validated);

        return redirect()->back()->with('success', 'Soal kuis berhasil disimpan');
    }

    public function importQuestions(
        Request $request,
        Kuis $quiz,
        ImportSpreadsheetService $spreadsheets,
        SoalKuisService $questions
    ) {
        $validated = $request->validate([
            'import_file' => ['required', 'file', 'max:2048'],
        ]);

        $file = $validated['import_file'];
        $extension = strtolower($file->getClientOriginalExtension());

        if (! in_array($extension, ['csv', 'txt', 'xlsx'], true)) {
            return redirect()->back()->withErrors(['import_file' => 'Format import harus CSV atau XLSX.']);
        }

        $rows = $spreadsheets->rows($file->getRealPath(), $extension);

        if (empty($rows)) {
            return redirect()->back()->withErrors(['import_file' => 'Tidak ada baris soal yang dapat diimport atau header tidak valid.']);
        }

        $created = $questions->importRows($quiz, $rows);

        if ($created === 0) {
            return redirect()->back()->withErrors(['import_file' => 'Tidak ada soal valid. Pastikan kolom question_text dan correct_answer terisi.']);
        }

        return redirect()->back()->with('success', "{$created} soal berhasil diimport.");
    }

    public function previewImportQuestions(
        Request $request,
        Kuis $quiz,
        ImportSpreadsheetService $spreadsheets,
        SoalKuisService $questions
    ) {
        $validated = $request->validate([
            'import_file' => ['required', 'file', 'max:2048'],
        ]);

        $file = $validated['import_file'];
        $extension = strtolower($file->getClientOriginalExtension());

        if (! in_array($extension, ['csv', 'txt', 'xlsx'], true)) {
            return response()->json([
                'message' => 'Format import harus CSV atau XLSX.',
            ], 422);
        }

        $rows = $spreadsheets->rows($file->getRealPath(), $extension);

        if (empty($rows)) {
            return response()->json([
                'message' => 'Tidak ada baris soal yang dapat diimport atau header tidak valid.',
            ], 422);
        }

        return response()->json($questions->previewRows($quiz, $rows));
    }

    public function downloadImportTemplate(
        Kuis $quiz,
        string $format,
        TemplateExcelService $templates,
        SoalKuisService $questions
    ) {
        $format = strtolower($format);

        if (! in_array($format, ['csv', 'xlsx'], true)) {
            abort(404);
        }

        $headers = $questions->importHeaders();
        $rows = $questions->templateRows();
        $filename = 'japanlingo-quiz-import-template-v1.' . $format;

        if ($format === 'csv') {
            return $templates->csvResponse($headers, $rows, $filename);
        }

        $path = $templates->xlsxPath($headers, $rows, 'Kuis Import', 'japanlingo_quiz_template_');

        return response()
            ->download($path, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])
            ->deleteFileAfterSend(true);
    }

    public function generateVocabularyQuestions(Request $request, Kuis $quiz, SoalKuisService $questions)
    {
        $validated = $request->validate([
            'jlpt_level' => ['nullable', 'string', 'max:8'],
            'category' => ['nullable', 'string', 'max:100'],
            'count' => ['required', 'integer', 'min:1', 'max:50'],
            'mode' => ['required', Rule::in(['word_to_meaning', 'meaning_to_word', 'reading_to_word'])],
            'status' => ['required', Rule::in(['published', 'draft', 'all'])],
            'content_type' => ['nullable', Rule::in([...Kosakata::contentTypes(), 'all'])],
            'module_id' => ['nullable', 'integer', 'exists:modules,id'],
        ]);

        $created = $questions->generateFromVocabulary($quiz, $validated);

        return redirect()->back()->with('success', "{$created} soal berhasil dibuat dari Bank Konten N3.");
    }

    private function kirimNotifikasiKuisTerbit(Kuis $quiz, NotifikasiPenggunaService $notifikasi): void
    {
        $quiz->loadMissing('module.programPembelajaran');

        if (! $quiz->module) {
            return;
        }

        $url = $quiz->module->programPembelajaran
            ? route('user.modul.program', $quiz->module->programPembelajaran->slug)
            : route('user.kelas.index');

        $notifikasi->kirimKePenggunaYangBisaAksesModul(
            $quiz->module,
            'new_quiz',
            'Kuis baru tersedia',
            "Kuis untuk {$quiz->module->title} sudah bisa dikerjakan.",
            $url,
            ['quiz_id' => $quiz->id, 'module_id' => $quiz->module_id]
        );
    }
}
