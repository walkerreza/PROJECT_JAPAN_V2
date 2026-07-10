<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LevelPembelajaran;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminLevelController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Level/ManajemenLevel', [
            'levels' => LevelPembelajaran::all()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'level_name' => 'required|string|max:10',
            'stage' => 'required|integer',
        ]);

        LevelPembelajaran::create($validated);

        return redirect()->back()->with('success', 'LevelPembelajaran berhasil ditambahkan');
    }

    public function update(Request $request, LevelPembelajaran $level)
    {
        $validated = $request->validate([
            'level_name' => 'required|string|max:10',
            'stage' => 'required|integer',
        ]);

        $level->update($validated);

        return redirect()->back()->with('success', 'LevelPembelajaran berhasil diperbarui');
    }

    public function destroy(LevelPembelajaran $level)
    {
        // Pastikan relasi content aman dihapus atau pake cascade, sekarang pakai default
        $level->delete();

        return redirect()->back()->with('success', 'LevelPembelajaran berhasil dihapus');
    }
}
