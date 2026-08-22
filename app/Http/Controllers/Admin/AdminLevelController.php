<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CurriculumTrack;
use App\Models\LevelPembelajaran;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminLevelController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Level/ManajemenLevel', [
            'tracks' => CurriculumTrack::query()
                ->withCount(['levels', 'programs'])
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get(),
            'levels' => LevelPembelajaran::with('curriculumTrack:id,code,name')
                ->orderBy('curriculum_track_id')
                ->orderBy('stage')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'curriculum_track_id' => ['required', 'exists:curriculum_tracks,id'],
            'level_name' => ['required', 'string', 'max:50'],
            'stage' => 'required|integer',
        ]);

        LevelPembelajaran::create($validated);

        return redirect()->back()->with('success', 'LevelPembelajaran berhasil ditambahkan');
    }

    public function update(Request $request, LevelPembelajaran $level)
    {
        $validated = $request->validate([
            'curriculum_track_id' => ['required', 'exists:curriculum_tracks,id'],
            'level_name' => ['required', 'string', 'max:50'],
            'stage' => 'required|integer',
        ]);

        $level->update($validated);

        return redirect()->back()->with('success', 'LevelPembelajaran berhasil diperbarui');
    }

    public function destroy(LevelPembelajaran $level)
    {
        if ($level->modules()->exists() || $level->programPembelajaran()->exists()) {
            return redirect()->back()->withErrors([
                'delete' => 'Level tidak dapat dihapus karena masih digunakan oleh kelas atau Week.',
            ]);
        }

        $level->delete();

        return redirect()->back()->with('success', 'LevelPembelajaran berhasil dihapus');
    }

    public function storeTrack(Request $request)
    {
        CurriculumTrack::create($this->validateTrack($request));

        return redirect()->back()->with('success', 'Jalur kurikulum berhasil ditambahkan.');
    }

    public function updateTrack(Request $request, CurriculumTrack $curriculumTrack)
    {
        $curriculumTrack->update($this->validateTrack($request, $curriculumTrack));

        return redirect()->back()->with('success', 'Jalur kurikulum berhasil diperbarui.');
    }

    public function destroyTrack(CurriculumTrack $curriculumTrack)
    {
        if ($curriculumTrack->levels()->exists() || $curriculumTrack->programs()->exists()) {
            return redirect()->back()->withErrors([
                'delete' => 'Jalur tidak dapat dihapus karena masih memiliki level atau kelas.',
            ]);
        }

        $curriculumTrack->delete();

        return redirect()->back()->with('success', 'Jalur kurikulum berhasil dihapus.');
    }

    private function validateTrack(Request $request, ?CurriculumTrack $track = null): array
    {
        return $request->validate([
            'code' => [
                'required',
                'string',
                'max:30',
                'regex:/^[a-z0-9-]+$/',
                Rule::unique('curriculum_tracks', 'code')->ignore($track?->id),
            ],
            'name' => ['required', 'string', 'max:100'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'sort_order' => ['required', 'integer', 'min:1'],
        ]);
    }
}
