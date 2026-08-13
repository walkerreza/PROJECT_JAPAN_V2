<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\SesiKelasLive;
use App\Services\RuangKelasLiveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RuangKelasLiveController extends Controller
{
    public function show(Request $request, SesiKelasLive $session, RuangKelasLiveService $service): Response
    {
        abort_unless($service->roleFor($session, $request->user()) === 'student', 403);
        $sessionPayload = $service->sessionPayload($session);

        return Inertia::render('User/RuangKelas/Show', [
            'session' => $sessionPayload,
            'participants' => $session->participants()->where('role', 'student')->with('user:id,username,avatar')->get()->map($service->participantPayload(...))->values(),
            'tokenEndpoint' => route('user.live-classes.token', $session->join_code, absolute: false),
            'leaveEndpoint' => route('user.live-classes.leave', $session->join_code, absolute: false),
            'exitUrl' => route('user.modul.program', $sessionPayload['program']['slug'], absolute: false),
        ]);
    }

    public function token(Request $request, SesiKelasLive $session, RuangKelasLiveService $service): JsonResponse
    {
        abort_unless($service->roleFor($session, $request->user()) === 'student', 403);

        return response()->json($service->tokenPayload($session, $request->user()));
    }

    public function leave(Request $request, SesiKelasLive $session, RuangKelasLiveService $service): JsonResponse
    {
        $service->leaveSession($session, $request->user());

        return response()->json(status: 204);
    }
}
