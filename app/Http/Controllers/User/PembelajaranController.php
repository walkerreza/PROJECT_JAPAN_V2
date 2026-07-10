<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Kuis;
use App\Services\PembelajaranPenggunaService;
use App\Services\AksesKuisPenggunaService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PembelajaranController extends Controller
{
    public function quizLobby(PembelajaranPenggunaService $learning)
    {
        return Inertia::render('User/Kuis/DaftarKuis', [
            'quizzes' => $learning->quizLobby(Auth::user()),
        ]);
    }

    public function showQuiz($id, PembelajaranPenggunaService $learning, AksesKuisPenggunaService $aksesKuis)
    {
        $quiz = Kuis::with(['module', 'questions'])
            ->where('status', 'published')
            ->whereHas('module', fn ($moduleQuery) => $moduleQuery->where('status', 'published'))
            ->find($id);

        if (! $quiz) {
            abort(404, 'Kuis tidak ditemukan.');
        }

        if ($quiz->module_id) {
            return redirect()->route('user.modul.quiz', $quiz->module_id);
        }

        $aksesKuis->abortJikaTerkunci(Auth::user(), $quiz);

        return Inertia::render('User/Kuis/KerjakanKuis', $learning->quizPayload(Auth::user(), $quiz));
    }
}
