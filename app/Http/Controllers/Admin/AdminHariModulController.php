<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HariModul;
use App\Models\Kuis;
use App\Models\Modul;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminHariModulController extends Controller
{
    public function store(Request $request, Modul $module)
    {
        $validated = $this->validateDay($request, $module);
        $validated['module_id'] = $module->id;

        $module->days()->create($validated);

        return redirect()->back()->with('success', 'Day berhasil ditambahkan.');
    }

    public function update(Request $request, HariModul $moduleDay)
    {
        $moduleDay->update($this->validateDay($request, $moduleDay->module, $moduleDay));

        return redirect()->back()->with('success', 'Day berhasil diperbarui.');
    }

    public function destroy(HariModul $moduleDay)
    {
        if (
            $moduleDay->flashcardSets()->exists()
            || $moduleDay->quizzes()->exists()
            || $moduleDay->presentationDecks()->exists()
            || $moduleDay->vocabulary()->exists()
        ) {
            return redirect()->back()->withErrors([
                'delete' => 'Day tidak dapat dihapus karena masih mempunyai konten.',
            ]);
        }

        $moduleDay->delete();

        return redirect()->back()->with('success', 'Day berhasil dihapus.');
    }

    public function syncVocabulary(Request $request, HariModul $moduleDay)
    {
        $validated = $request->validate([
            'vocabulary_ids' => ['present', 'array'],
            'vocabulary_ids.*' => ['integer', 'exists:vocabulary_bank,id'],
        ]);

        $sync = collect($validated['vocabulary_ids'])
            ->unique()
            ->values()
            ->mapWithKeys(fn ($id, $index) => [(int) $id => ['sort_order' => $index]])
            ->all();

        $moduleDay->vocabulary()->sync($sync);

        return redirect()->back()->with('success', 'Konten N3 untuk Day berhasil diperbarui.');
    }

    private function validateDay(Request $request, Modul $module, ?HariModul $day = null): array
    {
        $validated = $request->validate([
            'day_number' => [
                'required',
                'integer',
                'min:1',
                Rule::unique('module_days', 'day_number')
                    ->where('module_id', $module->id)
                    ->ignore($day?->id),
            ],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['required', 'in:draft,published'],
            'checkpoint_quiz_id' => [
                'nullable',
                'integer',
                Rule::exists('quizzes', 'id')->where('module_id', $module->id),
            ],
        ]);

        if (
            filled($validated['checkpoint_quiz_id'] ?? null)
            && ! Kuis::whereKey($validated['checkpoint_quiz_id'])
                ->where('module_day_id', $day?->id)
                ->exists()
        ) {
            abort(422, 'Kuis checkpoint harus berasal dari Day yang sama.');
        }

        return $validated;
    }
}
