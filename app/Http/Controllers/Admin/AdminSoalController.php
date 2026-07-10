<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Soal;
use App\Models\Kuis;
use App\Http\Requests\Admin\SoalRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminSoalController extends Controller
{
    public function index(Request $request)
    {
        $query = Soal::with('quiz.module')->orderBy('order');

        if ($request->filled('quiz_id')) {
            $query->where('quiz_id', $request->quiz_id);
        }

        $questions = $query->get()->map(fn($q) => [
            'id'            => $q->id,
            'question_text' => $q->question_text,
            'correct_answer' => $q->correct_answer,
            'options'       => $q->options,
            'audio_url'     => $q->audio_url,
            'order'         => $q->order,
            'quiz'          => $q->quiz ? ['id' => $q->quiz->id, 'type' => $q->quiz->type] : null,
        ]);

        $quizzes = Kuis::with('module:id,title')->get(['id', 'module_id', 'type']);

        return Inertia::render('Admin/Kuis/DaftarSoal', [
            'questions'     => $questions,
            'quizzes'       => $quizzes,
            'selectedQuizId' => $request->quiz_id,
        ]);
    }

    public function create(Request $request)
    {
        $quizzes = Kuis::with('module:id,title')->get();
        return Inertia::render('Admin/Kuis/TambahSoal', [
            'quizzes'       => $quizzes,
            'defaultQuizId' => $request->quiz_id,
        ]);
    }

    public function store(SoalRequest $request)
    {
        $validated = $request->validated();

        Soal::create($validated);

        return redirect()->back()->with('success', 'Pertanyaan berhasil dibuat');
    }

    public function edit(Soal $question)
    {
        $quizzes = Kuis::with('module:id,title')->get();
        return Inertia::render('Admin/Kuis/EditSoal', [
            'question' => $question,
            'quizzes'  => $quizzes,
        ]);
    }

    public function update(SoalRequest $request, Soal $question)
    {
        $validated = $request->validated();

        $question->update($validated);

        return redirect()->back()->with('success', 'Pertanyaan berhasil diperbarui');
    }

    public function destroy(Soal $question)
    {
        $question->delete();

        return redirect()->back()->with('success', 'Pertanyaan berhasil dihapus');
    }

    public function reorder(Request $request)
    {
        $request->validate([
            'items'         => 'required|array',
            'items.*.id'    => 'required|exists:questions,id',
            'items.*.order' => 'required|integer|min:0',
        ]);

        foreach ($request->items as $item) {
            Soal::where('id', $item['id'])->update(['order' => $item['order']]);
        }

        return response()->json(['message' => 'Urutan berhasil diperbarui']);
    }
}
