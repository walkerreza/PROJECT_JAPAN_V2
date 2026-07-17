<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Modul;
use App\Models\Berita;
use App\Models\DeckPresentasi;
use App\Models\Kosakata;
use App\Models\LogReward;
use App\Models\KodeAkses;
use App\Models\Kuis;
use App\Models\PenukaranKodeAkses;
use App\Models\ProgramPembelajaran;
use App\Models\SetFlashcard;
use App\Models\LogAktivitas;
use App\Models\PengerjaanKuis;
use App\Services\AksesLanggananService;
use App\Services\AksesKuisPenggunaService;
use App\Services\AksesPremiumService;
use App\Services\KloterBelajarService;
use App\Services\NotifikasiPenggunaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BerandaController extends Controller
{
    public function index(
        AksesKuisPenggunaService $aksesKuis,
        AksesPremiumService $aksesPremium,
        KloterBelajarService $kloterBelajar
    )
    {
        $user = Auth::user();
        
        $news = Berita::query()
            ->with('attachments')
            ->where('status', 'published')
            ->where(function ($query) {
                $query->whereNull('published_at')->orWhere('published_at', '<=', now());
            })
            ->whereIn('audience', ['all', 'students'])
            ->where(function ($query) {
                $query->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(function ($query) {
                $query->whereNull('ends_at')->orWhere('ends_at', '>=', now());
            })
            ->orderByDesc('is_pinned')
            ->orderByDesc('published_at')
            ->take(6)
            ->get()
            ->map(function (Berita $news) {
                $thumbnailUrl = $news->thumbnailUrl();

                return [
                    'id' => $news->id,
                    'slug' => $news->slug,
                    'title' => $news->title,
                    'excerpt' => $news->excerpt,
                    'body' => $news->body,
                    'category' => $news->category,
                    'is_pinned' => $news->is_pinned,
                    'published_at' => optional($news->published_at)->toIso8601String(),
                    'thumbnail_url' => $thumbnailUrl,
                    'cover_url' => $thumbnailUrl,
                    'cover_image_alt' => $news->cover_image_alt,
                ];
            });

        return Inertia::render('User/Beranda/Beranda', [
            'user' => $user,
            'recentProgress' => $user->progress()->with('module')->latest()->take(5)->get(),
            'learningDashboard' => $this->learningDashboardPayload($user, $aksesPremium, $aksesKuis, $kloterBelajar),
            'rewardHistory' => LogReward::where('user_id', $user->id)->latest()->take(10)->get(),
            'news' => $news,
            'activeSubscription' => $user->subscriptions()
                ->with('paymentPlan:id,name')
                ->where('status', 'active')
                ->latest('end_date')
                ->first(),
            'quickQuiz' => $this->quickQuizPayload($user, $aksesKuis),
            'lastCompletedQuiz' => $this->lastCompletedQuizPayload($user->id),
        ]);
    }

    private function learningDashboardPayload($user, AksesPremiumService $aksesPremium, AksesKuisPenggunaService $aksesKuis, KloterBelajarService $kloterBelajar): array
    {
        $programs = ProgramPembelajaran::query()
            ->with([
                'level:id,level_name',
                'modules' => fn ($query) => $query
                    ->where('status', 'published')
                    ->orderBy('week_number')
                    ->orderBy('id'),
            ])
            ->where('status', 'published')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->filter(fn (ProgramPembelajaran $program) => $aksesPremium->punyaAksesKelas($user, $program->id))
            ->values();

        $moduleIds = $programs->flatMap(fn (ProgramPembelajaran $program) => $program->modules->pluck('id'));
        $completedModuleIds = $moduleIds->isEmpty()
            ? collect()
            : $user->progress()
                ->whereIn('module_id', $moduleIds)
                ->whereNotNull('completed_at')
                ->pluck('module_id')
                ->unique();

        $activePrograms = $programs->map(function (ProgramPembelajaran $program) use ($user, $aksesPremium, $kloterBelajar, $completedModuleIds) {
            $kloter = $kloterBelajar->kloterAktifUser($user, $program->id);
            $waitingForKloter = ! $kloter;
            $modules = $waitingForKloter
                ? collect()
                : $program->modules
                    ->filter(fn (Modul $module) => $aksesPremium->bolehAksesModul($user, $module))
                    ->values();
            $nextModule = $modules->first(fn (Modul $module) => ! $completedModuleIds->contains($module->id))
                ?? $modules->first();
            $completedCount = $program->modules->filter(fn (Modul $module) => $completedModuleIds->contains($module->id))->count();

            return [
                'id' => $program->id,
                'title' => $program->title,
                'slug' => $program->slug,
                'level' => $program->level?->level_name,
                'thumbnail_url' => $this->thumbnailProgramUrl($program->thumbnail_url),
                'total_modules' => $program->modules->count(),
                'completed_modules' => $completedCount,
                'progress' => $program->modules->isEmpty() ? 0 : (int) round(($completedCount / $program->modules->count()) * 100),
                'waiting_for_kloter' => $waitingForKloter,
                'kloter_name' => $kloter?->nama,
                'roadmap_url' => route('user.modul.program', $program->slug),
                'next_module' => $nextModule ? [
                    'id' => $nextModule->id,
                    'title' => $nextModule->title,
                    'week_number' => $nextModule->week_number,
                ] : null,
            ];
        });

        $primaryProgram = $activePrograms->first(fn (array $program) => $program['next_module'] !== null)
            ?? $activePrograms->first();

        $primaryModule = $primaryProgram['next_module'] ?? null;

        return [
            'programs' => $activePrograms,
            'next_module' => $primaryModule ? [
                ...$primaryModule,
                'program_title' => $primaryProgram['title'],
                'roadmap_url' => $primaryProgram['roadmap_url'],
            ] : null,
            'resources' => $primaryModule
                ? $this->moduleResourcePayload($user, $primaryProgram, $primaryModule['id'], $aksesKuis)
                : [],
        ];
    }

    private function thumbnailProgramUrl(?string $thumbnailUrl): ?string
    {
        if (! $thumbnailUrl) {
            return null;
        }

        if (str_starts_with($thumbnailUrl, 'http://') || str_starts_with($thumbnailUrl, 'https://')) {
            return $thumbnailUrl;
        }

        $relativePath = '/' . ltrim($thumbnailUrl, '/');
        $publicFile = public_path(ltrim($relativePath, '/'));

        return is_file($publicFile)
            ? $relativePath . '?v=' . filemtime($publicFile)
            : $relativePath;
    }

    private function moduleResourcePayload($user, array $program, int $moduleId, AksesKuisPenggunaService $aksesKuis): array
    {
        $module = Modul::query()->where('status', 'published')->find($moduleId);

        if (! $module) {
            return [];
        }

        $presentationExists = DeckPresentasi::query()
            ->where('module_id', $module->id)
            ->where('status', 'published')
            ->whereHas('slides')
            ->exists();
        $vocabularyExists = Kosakata::query()
            ->where('status', 'published')
            ->where(function ($query) use ($module) {
                $query->where('module_id', $module->id)
                    ->orWhereHas('flashcards.set', fn ($sets) => $sets
                        ->where('module_id', $module->id)
                        ->where('status', 'published'));
            })
            ->exists();
        $flashcardSet = SetFlashcard::query()
            ->where('module_id', $module->id)
            ->where('status', 'published')
            ->whereHas('flashcards')
            ->orderBy('id')
            ->first();
        $quiz = Kuis::query()
            ->where('module_id', $module->id)
            ->where('status', 'published')
            ->whereHas('questions')
            ->orderBy('id')
            ->first();
        $quizAccess = $quiz ? $aksesKuis->status($user, $quiz) : null;

        return [
            [
                'category' => 'presentasi',
                'title' => 'Presentasi',
                'description' => 'Materi visual untuk Week '.$module->week_number.'.',
                'available' => $presentationExists,
                'href' => $presentationExists ? route('user.modul.program.presentasi', ['program' => $program['slug'], 'module' => $module->id]) : null,
                'message' => $presentationExists ? null : 'Presentasi belum tersedia untuk minggu ini.',
            ],
            [
                'category' => 'kosakata',
                'title' => 'Kosakata',
                'description' => 'Review kata dan makna dari Week '.$module->week_number.'.',
                'available' => $vocabularyExists,
                'href' => $vocabularyExists ? route('user.modul.program.kosakata', ['program' => $program['slug'], 'module' => $module->id]) : null,
                'message' => $vocabularyExists ? null : 'Kosakata belum tersedia untuk minggu ini.',
            ],
            [
                'category' => 'flashcard',
                'title' => 'Flashcard',
                'description' => 'Latihan kartu sebelum mengerjakan kuis.',
                'available' => $flashcardSet !== null,
                'href' => $flashcardSet ? route('user.modul.lesson', $module->id) : null,
                'message' => $flashcardSet ? null : 'Flashcard belum tersedia untuk minggu ini.',
            ],
            [
                'category' => 'kuis',
                'title' => 'Kuis',
                'description' => 'Evaluasi pemahaman setelah materi selesai.',
                'available' => (bool) ($quizAccess['allowed'] ?? false),
                'href' => ($quizAccess['allowed'] ?? false) ? route('user.modul.quiz', $module->id) : null,
                'message' => $quiz
                    ? ($quizAccess['message'] ?? 'Kuis belum dapat dibuka.')
                    : 'Kuis belum tersedia untuk minggu ini.',
            ],
        ];
    }

    private function quickQuizPayload($user, AksesKuisPenggunaService $aksesKuis): ?array
    {
        $quizzes = Kuis::query()
            ->with(['module:id,title,week_number,status,program_pembelajaran_id'])
            ->withCount('questions')
            ->where('quizzes.status', 'published')
            ->whereHas('questions')
            ->whereHas('module', fn ($query) => $query->where('modules.status', 'published'))
            ->join('modules', 'modules.id', '=', 'quizzes.module_id')
            ->orderBy('modules.week_number')
            ->orderBy('quizzes.id')
            ->select('quizzes.*')
            ->get();

        foreach ($quizzes as $quiz) {
            $status = $aksesKuis->status($user, $quiz);

            if (! $status['allowed']) {
                continue;
            }

            $bestScore = PengerjaanKuis::where('user_id', $user->id)
                ->where('quiz_id', $quiz->id)
                ->max('score');

            if ($bestScore !== null && (int) $bestScore >= (int) ($quiz->passing_score ?? 70)) {
                continue;
            }

            $module = $quiz->module;

            return [
                'id' => $quiz->id,
                'title' => 'Week ' . ($module?->week_number ?? '-') . ' - ' . ($module?->title ?? 'Kuis Aktif'),
                'score' => $bestScore,
                'questions_count' => $quiz->questions_count,
                'url' => $module ? route('user.modul.quiz', $module->id) : route('user.quizzes.show', $quiz->id),
            ];
        }

        return null;
    }

    private function lastCompletedQuizPayload(int $userId): ?array
    {
        $attempt = PengerjaanKuis::query()
            ->with([
                'quiz' => fn ($query) => $query
                    ->withCount('questions')
                    ->with([
                        'module:id,title,week_number,status',
                    ]),
            ])
            ->where('user_id', $userId)
            ->whereHas('quiz', fn ($query) => $query
                ->where('status', 'published')
                ->whereHas('questions')
                ->whereHas('module', fn ($moduleQuery) => $moduleQuery->where('status', 'published')))
            ->latest('attempted_at')
            ->first();

        if (! $attempt?->quiz) {
            return null;
        }

        $quiz = $attempt->quiz;
        $module = $quiz->module;
        $title = $module
            ? 'Week ' . ($module->week_number ?? '-') . ' - ' . $module->title
            : 'Kuis Terakhir';

        return [
            'id' => $quiz->id,
            'title' => $title,
            'score' => $attempt->score,
            'xp_earned' => $attempt->xp_earned,
            'attempted_at' => optional($attempt->attempted_at)->toIso8601String(),
            'questions_count' => $quiz->questions_count,
            'url' => $module
                ? route('user.modul.quiz', $module->id)
                : route('user.quizzes.show', $quiz->id),
        ];
    }

    public function redeemAccessKey(Request $request, AksesLanggananService $aksesLangganan)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:64'],
        ]);

        $user = $request->user();
        $code = strtoupper(trim($validated['code']));

        try {
            DB::transaction(function () use ($request, $user, $code, $aksesLangganan) {
                $accessKey = KodeAkses::where('code', $code)->lockForUpdate()->first();

                if (! $accessKey || ! $accessKey->isRedeemable()) {
                    abort(422, 'Access key tidak valid, sudah habis, atau sudah kedaluwarsa.');
                }

                $alreadyRedeemed = PenukaranKodeAkses::where('access_key_id', $accessKey->id)
                    ->where('user_id', $user->id)
                    ->exists();

                if ($alreadyRedeemed) {
                    abort(422, 'Access key ini sudah pernah digunakan oleh akun Anda.');
                }

                $subscription = $aksesLangganan->activateFromAccessKey($user, $accessKey);

                PenukaranKodeAkses::create([
                    'access_key_id' => $accessKey->id,
                    'user_id' => $user->id,
                    'subscription_id' => $subscription->id,
                    'kloter_belajar_id' => $subscription->kloter_belajar_id,
                    'redeemed_at' => now(),
                    'ip_address' => $request->ip(),
                ]);

                $accessKey->increment('used_count');

                LogAktivitas::create([
                    'actor_id' => $user->id,
                    'action' => 'access_key.redeemed',
                    'target_type' => 'access_key',
                    'target_id' => $accessKey->id,
                    'description' => "Redeem access key {$accessKey->code}",
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);

                app(NotifikasiPenggunaService::class)->kirimKePengguna(
                    $user,
                    'access_key_redeemed',
                    'Access key berhasil digunakan',
                    'Akses belajar kamu sudah aktif dari access key.',
                    route('user.kelas.index'),
                    [
                        'access_key_id' => $accessKey->id,
                        'subscription_id' => $subscription->id,
                        'kloter_id' => $subscription->kloter_belajar_id,
                    ],
                    'access',
                    'success',
                    true
                );

                app(NotifikasiPenggunaService::class)->kirimKeRole(
                    'superadmin',
                    'access_key_redeemed',
                    'Access key digunakan',
                    "{$user->username} menggunakan access key {$accessKey->code}.",
                    route('superadmin.payments'),
                    [
                        'access_key_id' => $accessKey->id,
                        'user_id' => $user->id,
                        'subscription_id' => $subscription->id,
                    ],
                    'access',
                    'success',
                    true
                );
            });
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $exception) {
            return back()->withErrors(['access_key' => $exception->getMessage()]);
        }

        return back()->with('success', 'Access key berhasil digunakan. Akses belajar sudah aktif.');
    }
}
