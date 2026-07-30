<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\ProgramPembelajaran;
use App\Models\TargetUjianPengguna;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TargetUjianPenggunaController extends Controller
{
    public function update(Request $request, ProgramPembelajaran $program): RedirectResponse
    {
        abort_unless($program->status === 'published', 404);

        $validated = $request->validate([
            'exam_date' => ['required', 'date', 'after_or_equal:today'],
        ]);

        TargetUjianPengguna::query()->updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'program_pembelajaran_id' => $program->id,
            ],
            ['exam_date' => $validated['exam_date']],
        );

        return back()->with('success', 'Target ujian berhasil disimpan.');
    }

    public function destroy(Request $request, ProgramPembelajaran $program): RedirectResponse
    {
        TargetUjianPengguna::query()
            ->where('user_id', $request->user()->id)
            ->where('program_pembelajaran_id', $program->id)
            ->delete();

        return back()->with('success', 'Target ujian berhasil dihapus.');
    }
}
