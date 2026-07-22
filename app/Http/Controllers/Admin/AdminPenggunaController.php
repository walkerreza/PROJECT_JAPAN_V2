<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AnggotaKloter;
use App\Models\KloterBelajar;
use App\Models\LevelPembelajaran;
use App\Models\LogAktivitas;
use App\Models\LogReward;
use App\Models\PengerjaanKuis;
use App\Models\Pengguna;
use App\Models\Progres;
use App\Services\AksesLanggananService;
use App\Services\KloterBelajarService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminPenggunaController extends Controller
{
    public function index(Request $request, KloterBelajarService $kloterService): Response
    {
        /** @var Pengguna $admin */
        $admin = $request->user();
        $search = (string) $request->string('search');
        $selectedKloter = $kloterService->resolveKloterDikelola($admin, $request->integer('kloter') ?: null);
        $programIds = $kloterService->programIdsDikelola($admin, $selectedKloter);

        $students = $kloterService->batasiSiswaDikelola(
            Pengguna::query()->where('role', 'user'),
            $admin,
            $selectedKloter
        )
            ->when($search, function (Builder $query) use ($search) {
                $query->where(function (Builder $query) use ($search) {
                    $query->where('username', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->withCount([
                'progress as lessons_done' => fn (Builder $query) => $this->batasiProgressProgram($query, $programIds),
                'attempts as quizzes_done' => fn (Builder $query) => $this->batasiAttemptProgram($query, $programIds),
            ])
            ->withAvg([
                'attempts as average_score' => fn (Builder $query) => $this->batasiAttemptProgram($query, $programIds),
            ], 'score')
            ->withMax([
                'progress as last_lesson_activity' => fn (Builder $query) => $this->batasiProgressProgram($query, $programIds),
            ], 'updated_at')
            ->withMax([
                'attempts as last_quiz_activity' => fn (Builder $query) => $this->batasiAttemptProgram($query, $programIds),
            ], 'attempted_at')
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Pengguna $student) => $this->mapStudent($student));

        return Inertia::render('Admin/DataUser/DataUser', [
            'adminScope' => $admin->admin_scope ?: Pengguna::ADMIN_SCOPE_GLOBAL,
            'students' => $students,
            'kloters' => $kloterService->pilihanKloterAdmin($admin),
            'selectedKloter' => $selectedKloter ? $this->selectedKloterPayload($selectedKloter) : null,
            'candidateStudents' => $selectedKloter ? $this->candidateStudents($selectedKloter) : [],
            'filters' => [
                'search' => $search,
                'kloter' => $selectedKloter?->id,
            ],
        ]);
    }

    public function show(Request $request, Pengguna $user, KloterBelajarService $kloterService): Response
    {
        /** @var Pengguna $admin */
        $admin = $request->user();
        $kloterService->abortJikaSiswaDiLuarCakupan($admin, $user);
        $selectedKloter = $kloterService->resolveKloterDikelola($admin, $request->integer('kloter') ?: null);

        if ($selectedKloter) {
            $isMember = $kloterService->batasiSiswaDikelola(
                Pengguna::query()->whereKey($user->id),
                $admin,
                $selectedKloter
            )->exists();
            abort_unless($isMember, 403, 'Siswa ini bukan anggota kloter yang dipilih.');
        }

        $programIds = $kloterService->programIdsDikelola($admin, $selectedKloter);

        $user->load([
            'progress' => fn (Builder $query) => $this->batasiProgressProgram($query, $programIds),
            'progress.module.level',
            'attempts' => fn (Builder $query) => $this->batasiAttemptProgram($query, $programIds),
            'attempts.quiz.module.level',
            'certificates.level',
            'achievements',
        ]);

        $completedModuleIds = $user->progress->pluck('module_id')->all();
        $levels = LevelPembelajaran::with([
            'modules' => fn (Builder $query) => $this->batasiModuleProgram($query, $programIds),
        ])->orderBy('stage')->get();

        $levelProgress = $levels->map(function (LevelPembelajaran $level) use ($completedModuleIds) {
            $modules = $level->modules;
            $total = $modules->count();
            $completed = $modules->whereIn('id', $completedModuleIds)->count();

            return [
                'id' => $level->id,
                'name' => $level->level_name,
                'total_lessons' => $total,
                'completed_lessons' => $completed,
                'percentage' => $total > 0 ? round(($completed / $total) * 100) : 0,
            ];
        });

        return Inertia::render('Admin/DataUser/DetailUser', [
            'filters' => ['kloter' => $selectedKloter?->id],
            'student' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'status' => $user->status,
                'subscription_status' => $user->subscription_status,
                'xp' => (int) $user->xp,
                'level' => (int) $user->level,
                'streak_count' => (int) $user->streak_count,
                'lessons_done' => $user->progress->count(),
                'quizzes_done' => $user->attempts->count(),
                'average_score' => round((float) $user->attempts->avg('score'), 1),
            ],
            'levelProgress' => $levelProgress,
            'recentProgress' => $user->progress
                ->sortByDesc('updated_at')
                ->take(10)
                ->values()
                ->map(fn (Progres $progress) => [
                    'id' => $progress->id,
                    'lesson' => $progress->module?->title,
                    'module' => $progress->module?->title,
                    'level' => $progress->module?->level?->level_name,
                    'score' => $progress->score,
                    'completed_at' => optional($progress->completed_at ?? $progress->updated_at)->format('d M Y H:i'),
                ]),
            'recentAttempts' => $user->attempts
                ->sortByDesc('attempted_at')
                ->take(10)
                ->values()
                ->map(fn (PengerjaanKuis $attempt) => [
                    'id' => $attempt->id,
                    'quiz' => $attempt->quiz?->type,
                    'lesson' => $attempt->quiz?->module?->title,
                    'module' => $attempt->quiz?->module?->title,
                    'score' => $attempt->score,
                    'xp_earned' => $attempt->xp_earned,
                    'attempted_at' => optional($attempt->attempted_at)->format('d M Y H:i'),
                ]),
            'rewardHistory' => $admin->isAdminGlobal()
                ? LogReward::where('user_id', $user->id)->latest()->take(10)->get()->map(fn (LogReward $log) => [
                    'id' => $log->id,
                    'description' => $log->description,
                    'source_type' => $log->source_type,
                    'xp_amount' => $log->xp_amount,
                    'created_at' => $log->created_at->format('d M Y H:i'),
                ])
                : [],
            'certificates' => $admin->isAdminGlobal()
                ? $user->certificates->map(fn ($certificate) => [
                    'id' => $certificate->id,
                    'level' => $certificate->level?->level_name,
                    'certificate_number' => $certificate->certificate_number,
                    'issued_at' => optional($certificate->issued_at)->format('d M Y'),
                ])
                : [],
        ]);
    }

    public function updateKloterSchedule(
        Request $request,
        KloterBelajar $kloter,
        KloterBelajarService $kloterService
    ): RedirectResponse {
        /** @var Pengguna $admin */
        $admin = $request->user();
        $kloterService->abortJikaKloterDiLuarCakupan($admin, $kloter);
        abort_if($kloter->status === 'archived', 422, 'Kloter yang diarsipkan tidak dapat diubah.');

        $validated = $request->validate([
            'tanggal_mulai' => ['required', 'date'],
            'tanggal_selesai' => ['nullable', 'date', 'after_or_equal:tanggal_mulai'],
        ]);

        DB::transaction(function () use ($request, $admin, $kloter, $validated) {
            $before = $kloter->only(['tanggal_mulai', 'tanggal_selesai']);
            $kloter->update($validated);
            $this->logActivity($request, $admin, 'kloter.schedule_updated', $kloter, "Mengubah jadwal kloter {$kloter->nama}", [
                'before' => $before,
                'after' => $kloter->only(['tanggal_mulai', 'tanggal_selesai']),
            ]);
        });

        return back()->with('success', 'Jadwal kloter berhasil diperbarui.');
    }

    public function assignUser(
        Request $request,
        KloterBelajar $kloter,
        KloterBelajarService $kloterService
    ): RedirectResponse {
        /** @var Pengguna $admin */
        $admin = $request->user();
        $kloterService->abortJikaKloterDiLuarCakupan($admin, $kloter);
        abort_if($kloter->status !== 'active', 422, 'Anggota hanya dapat ditambahkan ke kloter aktif.');

        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'catatan' => ['nullable', 'string', 'max:1000'],
        ]);

        $student = Pengguna::query()
            ->whereKey($validated['user_id'])
            ->where('role', 'user')
            ->where('status', 'active')
            ->firstOrFail();

        $subscription = $student->subscriptions()
            ->where('status', 'active')
            ->whereDate('end_date', '>=', now()->toDateString())
            ->where(function (Builder $query) use ($kloter) {
                $query->where('scope_type', AksesLanggananService::SCOPE_GLOBAL)
                    ->orWhere(function (Builder $query) use ($kloter) {
                        $query->where('scope_type', AksesLanggananService::SCOPE_PROGRAM)
                            ->where('program_pembelajaran_id', $kloter->program_pembelajaran_id);
                    });
            })
            ->latest('end_date')
            ->first();

        if (! $subscription) {
            throw ValidationException::withMessages([
                'user_id' => 'Siswa belum memiliki akses aktif untuk program kloter ini.',
            ]);
        }

        $activeInOtherKloter = AnggotaKloter::query()
            ->where('user_id', $student->id)
            ->where('status', 'active')
            ->where('kloter_belajar_id', '!=', $kloter->id)
            ->whereHas('kloterBelajar', fn (Builder $query) => $query
                ->where('program_pembelajaran_id', $kloter->program_pembelajaran_id))
            ->exists();

        if ($activeInOtherKloter) {
            throw ValidationException::withMessages([
                'user_id' => 'Siswa masih aktif di kloter lain untuk program yang sama. Pemindahan dilakukan oleh superadmin.',
            ]);
        }

        DB::transaction(function () use ($request, $admin, $kloter, $kloterService, $student, $subscription, $validated) {
            $kloterService->assignUser(
                $student,
                $kloter,
                $subscription,
                null,
                null,
                $validated['catatan'] ?? 'Ditambahkan melalui dashboard admin.'
            );

            $this->logActivity($request, $admin, 'kloter.user_assigned', $kloter, "Menambahkan {$student->username} ke kloter {$kloter->nama}");
        });

        return back()->with('success', 'Siswa berhasil dimasukkan ke kloter.');
    }

    public function removeUser(
        Request $request,
        KloterBelajar $kloter,
        Pengguna $user,
        KloterBelajarService $kloterService
    ): RedirectResponse {
        /** @var Pengguna $admin */
        $admin = $request->user();
        $kloterService->abortJikaKloterDiLuarCakupan($admin, $kloter);
        abort_unless($user->role === 'user', 404);

        $membership = AnggotaKloter::query()
            ->where('kloter_belajar_id', $kloter->id)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->firstOrFail();

        DB::transaction(function () use ($request, $admin, $kloter, $membership, $user) {
            $membership->update(['status' => 'removed']);
            $this->logActivity($request, $admin, 'kloter.user_removed', $kloter, "Mengeluarkan {$user->username} dari kloter {$kloter->nama}");
        });

        return back()->with('success', 'Siswa dikeluarkan dari kloter tanpa menghapus akses dan histori belajarnya.');
    }

    private function candidateStudents(KloterBelajar $kloter): Collection
    {
        return Pengguna::query()
            ->where('role', 'user')
            ->where('status', 'active')
            ->whereHas('subscriptions', function (Builder $query) use ($kloter) {
                $query->where('status', 'active')
                    ->whereDate('end_date', '>=', now()->toDateString())
                    ->where(function (Builder $query) use ($kloter) {
                        $query->where('scope_type', AksesLanggananService::SCOPE_GLOBAL)
                            ->orWhere(function (Builder $query) use ($kloter) {
                                $query->where('scope_type', AksesLanggananService::SCOPE_PROGRAM)
                                    ->where('program_pembelajaran_id', $kloter->program_pembelajaran_id);
                            });
                    });
            })
            ->whereDoesntHave('anggotaKloter', fn (Builder $query) => $query
                ->where('status', 'active')
                ->whereHas('kloterBelajar', fn (Builder $query) => $query
                    ->where('program_pembelajaran_id', $kloter->program_pembelajaran_id)))
            ->orderBy('username')
            ->limit(100)
            ->get(['id', 'username', 'email'])
            ->map(fn (Pengguna $student) => [
                'id' => $student->id,
                'label' => "{$student->username} ({$student->email})",
            ]);
    }

    private function selectedKloterPayload(KloterBelajar $kloter): array
    {
        $kloter->loadMissing('programPembelajaran:id,title');

        return [
            'id' => $kloter->id,
            'name' => $kloter->nama,
            'program_name' => $kloter->programPembelajaran?->title,
            'tanggal_mulai' => optional($kloter->tanggal_mulai)->format('Y-m-d'),
            'tanggal_selesai' => optional($kloter->tanggal_selesai)->format('Y-m-d'),
            'status' => $kloter->status,
            'is_read_only' => $kloter->status === 'archived',
        ];
    }

    private function batasiProgressProgram(Builder $query, ?Collection $programIds): Builder
    {
        return $programIds === null
            ? $query
            : $query->whereHas('module', fn (Builder $query) => $query->whereIn('program_pembelajaran_id', $programIds));
    }

    private function batasiAttemptProgram(Builder $query, ?Collection $programIds): Builder
    {
        return $programIds === null
            ? $query
            : $query->whereHas('quiz.module', fn (Builder $query) => $query->whereIn('program_pembelajaran_id', $programIds));
    }

    private function batasiModuleProgram(Builder $query, ?Collection $programIds): Builder
    {
        return $programIds === null
            ? $query
            : $query->whereIn('program_pembelajaran_id', $programIds);
    }

    private function mapStudent(Pengguna $student): array
    {
        $lastActivity = collect([
            $student->last_lesson_activity,
            $student->last_quiz_activity,
            $student->last_activity_date,
        ])->filter()->max();

        return [
            'id' => $student->id,
            'username' => $student->username,
            'email' => $student->email,
            'status' => $student->status,
            'subscription_status' => $student->subscription_status,
            'xp' => (int) $student->xp,
            'level' => (int) $student->level,
            'streak_count' => (int) $student->streak_count,
            'lessons_done' => (int) $student->lessons_done,
            'quizzes_done' => (int) $student->quizzes_done,
            'average_score' => round((float) $student->average_score, 1),
            'last_activity' => $lastActivity ? date('d M Y H:i', strtotime($lastActivity)) : 'Belum aktif',
        ];
    }

    private function logActivity(
        Request $request,
        Pengguna $admin,
        string $action,
        KloterBelajar $kloter,
        string $description,
        array $metadata = []
    ): void {
        LogAktivitas::create([
            'actor_id' => $admin->id,
            'action' => $action,
            'target_type' => 'kloter_belajar',
            'target_id' => $kloter->id,
            'description' => $description,
            'metadata' => $metadata ?: null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }
}
