<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\LevelPembelajaran;
use App\Models\Modul;
use App\Models\Berita;
use App\Models\LogReward;
use App\Models\KodeAkses;
use App\Models\PenukaranKodeAkses;
use App\Models\LogAktivitas;
use App\Models\PengerjaanKuis;
use App\Services\AksesLanggananService;
use App\Services\NotifikasiPenggunaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BerandaController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        $news = Berita::query()
            ->with('attachments')
            ->where('status', 'published')
            ->whereIn('audience', ['all', 'students'])
            ->where(function ($query) {
                $query->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(function ($query) {
                $query->whereNull('ends_at')->orWhere('ends_at', '>=', now());
            })
            ->orderByDesc('is_pinned')
            ->orderByDesc('published_at')
            ->take(3)
            ->get()
            ->map(function (Berita $news) {
                $thumbnailUrl = $news->thumbnailUrl();

                return [
                    'id' => $news->id,
                    'title' => $news->title,
                    'excerpt' => $news->excerpt,
                    'body' => $news->body,
                    'is_pinned' => $news->is_pinned,
                    'published_at' => optional($news->published_at)->toIso8601String(),
                    'thumbnail_url' => $thumbnailUrl,
                    'cover_url' => $thumbnailUrl,
                ];
            });

        return Inertia::render('User/Beranda', [
            'user' => $user,
            'recentProgress' => $user->progress()->with('module')->latest()->take(5)->get(),
            'availableLevels' => LevelPembelajaran::with('modules')->get(),
            'rewardHistory' => LogReward::where('user_id', $user->id)->latest()->take(10)->get(),
            'news' => $news,
            'activeSubscription' => $user->subscriptions()
                ->with('paymentPlan:id,name')
                ->where('status', 'active')
                ->latest('end_date')
                ->first(),
            'lastCompletedQuiz' => $this->lastCompletedQuizPayload($user->id),
        ]);
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
