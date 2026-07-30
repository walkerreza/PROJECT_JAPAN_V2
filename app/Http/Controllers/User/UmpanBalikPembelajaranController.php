<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Kuis;
use App\Models\PengerjaanKuis;
use App\Models\UmpanBalikPembelajaran;
use App\Services\AksesKuisPenggunaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UmpanBalikPembelajaranController extends Controller
{
    public function store(Request $request, Kuis $quiz, AksesKuisPenggunaService $aksesKuis): JsonResponse
    {
        $validated = $request->validate([
            'rating' => ['required', 'in:repeat,just_right,easy'],
            'continue_learning' => ['required', 'boolean'],
        ]);

        $user = $request->user();
        $quiz->loadMissing('module.programPembelajaran');

        abort_unless($quiz->status === 'published' && $quiz->module?->status === 'published', 404);
        $aksesKuis->abortJikaTerkunci($user, $quiz);

        $completedToday = PengerjaanKuis::query()
            ->where('user_id', $user->id)
            ->where('quiz_id', $quiz->id)
            ->where('status', 'completed')
            ->whereDate('completed_at', today())
            ->exists();

        abort_unless($completedToday, 422, 'Selesaikan sesi kuis terlebih dahulu sebelum mengirim feedback.');

        $feedback = UmpanBalikPembelajaran::updateOrCreate(
            [
                'user_id' => $user->id,
                'quiz_id' => $quiz->id,
                'feedback_date' => today()->toDateString(),
            ],
            [
                'module_id' => $quiz->module->id,
                'program_pembelajaran_id' => $quiz->module->program_pembelajaran_id,
                'rating' => $validated['rating'],
                'continue_learning' => $validated['continue_learning'],
            ]
        );

        return response()->json([
            'saved' => true,
            'feedback' => [
                'rating' => $feedback->rating,
                'continue_learning' => $feedback->continue_learning,
            ],
        ]);
    }
}
