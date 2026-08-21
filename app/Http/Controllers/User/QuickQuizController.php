<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Services\QuickQuizSessionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuickQuizController extends Controller
{
    public function start(Request $request, QuickQuizSessionService $sessions)
    {
        $state = $sessions->start($request->user());

        if (! $state) {
            return redirect()->route('user.dashboard')
                ->with('info', 'Belum ada materi terbuka untuk Quick Kuis.');
        }

        return redirect()->route('user.quick-quiz.show', $state['id']);
    }

    public function show(Request $request, string $session, QuickQuizSessionService $sessions)
    {
        $state = $sessions->find($request->user(), $session);

        if (! $state) {
            return redirect()->route('user.dashboard')
                ->with('info', 'Sesi Quick Kuis sudah berakhir. Mulai sesi baru dari dashboard.');
        }

        $payload = $sessions->payload($request->user(), $state);

        if (! $payload['completed'] && ! $payload['current_question']) {
            $state = $sessions->start($request->user(), true);

            if (! $state) {
                return redirect()->route('user.dashboard')
                    ->with('info', 'Belum ada materi terbuka untuk Quick Kuis.');
            }

            return redirect()->route('user.quick-quiz.show', $state['id']);
        }

        return Inertia::render('User/Kuis/QuickKuis', [
            'quickSession' => $payload,
            'backUrl' => route('user.dashboard'),
            'answerUrl' => route('user.quick-quiz.answer', $state['id']),
            'resetUrl' => route('user.quick-quiz.reset'),
        ]);
    }

    public function answer(Request $request, string $session, QuickQuizSessionService $sessions)
    {
        $validated = $request->validate([
            'item_token' => ['required', 'uuid'],
            'answer' => ['nullable', 'string', 'max:2000'],
            'answer_payload' => ['nullable', 'array'],
            'answer_payload.completed_strokes' => ['nullable', 'integer', 'min:0', 'max:100'],
            'answer_payload.total_strokes' => ['nullable', 'integer', 'min:0', 'max:100'],
            'answer_payload.attempts_by_stroke' => ['nullable', 'array', 'max:100'],
            'answer_payload.mistakes' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'answer_payload.hints_used' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'answer_payload.duration_ms' => ['nullable', 'integer', 'min:0', 'max:86400000'],
            'answer_payload.revealed' => ['nullable', 'boolean'],
        ]);

        return response()->json($sessions->answer($request->user(), $session, $validated));
    }

    public function reset(Request $request, QuickQuizSessionService $sessions)
    {
        $state = $sessions->start($request->user(), true);

        if (! $state) {
            return redirect()->route('user.dashboard')
                ->with('info', 'Belum ada materi terbuka untuk Quick Kuis.');
        }

        return redirect()->route('user.quick-quiz.show', $state['id']);
    }
}
