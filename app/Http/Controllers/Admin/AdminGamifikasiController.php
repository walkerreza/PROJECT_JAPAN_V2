<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pencapaian;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * AdminGamifikasiController
 *
 * Mengelola sistem gamifikasi platform Japanlingo dari sisi admin.
 * Admin dapat membuat, mengedit, dan menghapus pencapaian (achievements/lencana).
 *
 * Route yang menggunakan controller ini (didaftarkan di routes/web.php):
 *   GET    /admin/gamification          → index()  : tampilkan daftar achievements
 *   POST   /admin/gamification          → store()  : buat achievement baru
 *   PUT    /admin/gamification/{id}     → update() : edit achievement yang ada
 *   DELETE /admin/gamification/{id}     → destroy(): hapus achievement
 *
 * Halaman React terkait: resources/js/Pages/Admin/Gamifikasi/Gamifikasi.jsx
 */
class AdminGamifikasiController extends Controller
{
    /**
     * Tampilkan halaman daftar semua achievements ke admin.
     */
    public function index()
    {
        return Inertia::render('Admin/Gamifikasi/Gamifikasi', [
            'achievements' => Pencapaian::withCount('users')->orderBy('created_at', 'desc')->get(),
        ]);
    }

    /**
     * Simpan achievement baru yang dibuat admin.
     *
     * condition_type yang dikenal sistem:
     *   - 'lessons_completed' → berapa lesson yang harus diselesaikan
     *   - 'streak_days'       → berapa hari streak berturut-turut
     *   - 'quiz_perfect'      → berapa quiz dengan skor 100%
     *   - 'level_complete'    → menyelesaikan level JLPT tertentu
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'description'     => 'nullable|string',
            'icon'            => 'nullable|string',
            'xp_reward'       => 'required|integer|min:0',
            'condition_type'  => 'required|string',
            'condition_value' => 'required|integer|min:1',
        ]);

        Pencapaian::create($validated);

        return redirect()->back()->with('success', 'Pencapaian berhasil dibuat.');
    }

    /**
     * Update data achievement yang sudah ada.
     */
    public function update(Request $request, Pencapaian $achievement)
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'description'     => 'nullable|string',
            'icon'            => 'nullable|string',
            'xp_reward'       => 'required|integer|min:0',
            'condition_type'  => 'required|string',
            'condition_value' => 'required|integer|min:1',
        ]);

        $achievement->update($validated);

        return redirect()->back()->with('success', 'Pencapaian berhasil diupdate.');
    }

    /**
     * Hapus achievement. Pengguna yang sudah mendapat achievement ini
     * juga akan kehilangan data di tabel user_achievements (cascade delete).
     */
    public function destroy(Pencapaian $achievement)
    {
        $achievement->delete();

        return redirect()->back()->with('success', 'Pencapaian berhasil dihapus.');
    }
}
