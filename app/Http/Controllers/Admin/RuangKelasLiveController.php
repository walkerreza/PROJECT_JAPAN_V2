<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DeckPresentasi;
use App\Models\KloterBelajar;
use App\Models\Pengguna;
use App\Models\ProgramPembelajaran;
use App\Models\SesiKelasLive;
use App\Services\RuangKelasLiveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RuangKelasLiveController extends Controller
{
    public function create(Request $request): Response
    {
        $program = ProgramPembelajaran::query()->findOrFail($request->integer('program_id'));

        return Inertia::render('Admin/RuangKelas/Show', [
            'setup' => [
                'program' => $program->only(['id', 'title', 'description']),
                'kloters' => KloterBelajar::query()
                    ->where('admin_id', $request->user()->id)
                    ->where('program_pembelajaran_id', $program->id)
                    ->where('status', 'active')
                    ->orderBy('nama')
                    ->get(['id', 'nama', 'kode']),
                'decks' => DeckPresentasi::query()
                    ->with('module:id,title,week_number')
                    ->withCount('slides')
                    ->whereHas('module', fn ($query) => $query->where('program_pembelajaran_id', $program->id))
                    ->orderByDesc('updated_at')
                    ->get(['id', 'module_id', 'title', 'status']),
            ],
            'storeEndpoint' => route('admin.live-classes.store', absolute: false),
            'exitUrl' => route('admin.programs.index', absolute: false),
        ]);
    }

    public function store(Request $request, RuangKelasLiveService $service): RedirectResponse
    {
        $validated = $request->validate([
            'kloter_belajar_id' => ['required', 'integer', 'exists:kloter_belajar,id'],
            'presentation_deck_id' => ['nullable', 'integer', 'exists:presentation_decks,id'],
        ]);

        $session = $service->createSession(
            $request->user(),
            KloterBelajar::findOrFail($validated['kloter_belajar_id']),
            filled($validated['presentation_deck_id'] ?? null) ? DeckPresentasi::findOrFail($validated['presentation_deck_id']) : null,
        );
        $service->startSession($session, $request->user());

        return redirect()->route('admin.live-classes.show', $session);
    }

    public function show(Request $request, SesiKelasLive $liveClassSession, RuangKelasLiveService $service): Response
    {
        abort_unless($service->roleFor($liveClassSession, $request->user()) === 'mentor', 403);

        return Inertia::render('Admin/RuangKelas/Show', [
            'session' => $service->sessionPayload($liveClassSession),
            'participants' => $liveClassSession->participants()->where('role', 'student')->with('user:id,username,avatar')->get()->map($service->participantPayload(...))->values(),
            'tokenEndpoint' => route('admin.live-classes.token', $liveClassSession, absolute: false),
            'stateEndpoint' => route('admin.live-classes.state', $liveClassSession, absolute: false),
            'endEndpoint' => route('admin.live-classes.end', $liveClassSession, absolute: false),
            'participantEndpoint' => route('admin.live-classes.participants.update', [$liveClassSession, '__USER__'], absolute: false),
            'muteAllEndpoint' => route('admin.live-classes.mute-all', $liveClassSession, absolute: false),
            'joinUrl' => route('user.live-classes.show', $liveClassSession->join_code, absolute: false),
            'exitUrl' => route('admin.programs.index', absolute: false),
        ]);
    }

    public function token(Request $request, SesiKelasLive $liveClassSession, RuangKelasLiveService $service): JsonResponse
    {
        abort_unless($service->roleFor($liveClassSession, $request->user()) === 'mentor', 403);

        return response()->json($service->tokenPayload($liveClassSession, $request->user()));
    }

    public function state(Request $request, SesiKelasLive $liveClassSession, RuangKelasLiveService $service): JsonResponse
    {
        $validated = $request->validate([
            'stage_mode' => ['sometimes', Rule::in(['slides', 'board', 'screen'])],
            'current_slide_index' => ['sometimes', 'integer', 'min:0', 'max:10000'],
            'board_snapshot' => ['sometimes', 'array'],
        ]);

        if (strlen(json_encode($validated['board_snapshot'] ?? [], JSON_THROW_ON_ERROR)) > 500_000) {
            abort(422, 'Snapshot papan tulis terlalu besar.');
        }
        if (array_key_exists('board_snapshot', $validated)) {
            $validated['board_snapshot'] = $service->normalizeBoardSnapshot($validated['board_snapshot']);
        }

        $session = $service->updateState($liveClassSession, $request->user(), $validated);

        return response()->json(['state' => [
            'stage_mode' => $session->stage_mode,
            'current_slide_index' => $session->current_slide_index,
            'board_snapshot_version' => (int) data_get($session->board_snapshot, 'version', 0),
        ]]);
    }

    public function updateParticipant(
        Request $request,
        SesiKelasLive $liveClassSession,
        Pengguna $user,
        RuangKelasLiveService $service
    ): JsonResponse {
        $validated = $request->validate([
            'action' => ['required', Rule::in(['mic', 'drawing'])],
            'enabled' => ['required', 'boolean'],
        ]);

        $participant = $validated['action'] === 'mic'
            ? $service->setMicBlocked($liveClassSession, $request->user(), $user, ! $validated['enabled'])
            : $service->setDrawingPermission($liveClassSession, $request->user(), $user, $validated['enabled']);

        return response()->json(['participant' => $service->participantPayload($participant)]);
    }

    public function kick(
        Request $request,
        SesiKelasLive $liveClassSession,
        Pengguna $user,
        RuangKelasLiveService $service
    ): JsonResponse {
        $service->kickParticipant($liveClassSession, $request->user(), $user);

        return response()->json(status: 204);
    }

    public function end(Request $request, SesiKelasLive $liveClassSession, RuangKelasLiveService $service): JsonResponse
    {
        $session = $service->endSession($liveClassSession, $request->user());

        return response()->json(['status' => $session->status]);
    }

    public function muteAll(Request $request, SesiKelasLive $liveClassSession, RuangKelasLiveService $service): JsonResponse
    {
        return response()->json([
            'muted' => $service->muteAllStudents($liveClassSession, $request->user()),
        ]);
    }
}
