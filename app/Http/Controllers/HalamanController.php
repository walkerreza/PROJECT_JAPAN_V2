<?php

namespace App\Http\Controllers;

use App\Models\PaketPembayaran;
use App\Models\DeckPresentasi;
use App\Models\Kosakata;
use App\Models\Modul;
use App\Models\ProgramPembelajaran;
use App\Models\Transaksi;
use App\Services\AksesLanggananService;
use App\Services\AksesPremiumService;
use App\Services\GamifikasiConfigService;
use App\Services\KloterBelajarService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HalamanController extends Controller
{
    public function home()
    {
        return Inertia::render('landingPage');
    }

    public function about()
    {
        return Inertia::render('About');
    }

    public function pricing()
    {
        return Inertia::render('Pricing', [
            'paymentPlans' => PaketPembayaran::query()
                ->with('programPembelajaran:id,title')
                ->where('is_active', true)
                ->where(function ($query) {
                    $query->where('scope_type', AksesLanggananService::SCOPE_GLOBAL)
                        ->orWhereNull('scope_type');
                })
                ->where(function ($query) {
                    $query->where('price', 0)->orWhere('slug', 'premium-monthly');
                })
                ->orderBy('price')
                ->get(['id', 'name', 'slug', 'scope_type', 'program_pembelajaran_id', 'description', 'price', 'duration_days', 'features'])
                ->map(fn (PaketPembayaran $plan) => [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'scope_type' => $plan->scope_type ?? AksesLanggananService::SCOPE_GLOBAL,
                    'program_pembelajaran_id' => $plan->program_pembelajaran_id,
                    'scope_label' => app(AksesLanggananService::class)->labelScope($plan->scope_type, $plan->programPembelajaran?->title),
                    'description' => $plan->description,
                    'price' => $plan->price,
                    'price_formatted' => 'Rp ' . number_format($plan->price),
                    'duration_days' => $plan->duration_days,
                    'features' => $plan->features ?? [],
                ]),
            'midtrans' => [
                'clientKey' => config('services.midtrans.client_key'),
                'isProduction' => (bool) config('services.midtrans.is_production'),
            ],
        ]);
    }

    public function roadmap()
    {
        return Inertia::render('Roadmap');
    }

    public function userProfile(GamifikasiConfigService $gamifikasiConfig)
    {
        $user = Auth::user();

        return Inertia::render('User/Profil/Profil', [
            'activeSubscription' => $user?->subscriptions()
                ->with('paymentPlan:id,name')
                ->where('status', 'active')
                ->latest('end_date')
                ->first(),
            'recentTransactions' => Transaksi::query()
                ->with(['paymentPlan:id,name', 'programPembelajaran:id,title'])
                ->where('user_id', $user?->id)
                ->latest()
                ->take(8)
                ->get()
                ->map(fn (Transaksi $transaction) => [
                    'id' => $transaction->id,
                    'code' => $transaction->transaction_code,
                    'plan' => $transaction->paymentPlan?->name ?? 'Akses belajar',
                    'scope_label' => app(AksesLanggananService::class)->labelScope(
                        $transaction->scope_type,
                        $transaction->programPembelajaran?->title
                    ),
                    'amount' => $transaction->amount,
                    'amount_formatted' => 'Rp ' . number_format($transaction->amount),
                    'status' => $transaction->status,
                    'status_label' => match ($transaction->status) {
                        'success' => 'Berhasil',
                        'pending' => 'Menunggu',
                        'failed' => 'Gagal',
                        'expired' => 'Kedaluwarsa',
                        'canceled' => 'Dibatalkan',
                        default => ucfirst((string) $transaction->status),
                    },
                    'created_at_label' => optional($transaction->created_at)->format('d M Y H:i'),
                ]),
            'achievements' => $user?->achievements()
                ->latest('user_achievements.unlocked_at')
                ->take(8)
                ->get()
                ->map(fn ($achievement) => [
                    'id' => $achievement->id,
                    'name' => $achievement->name,
                    'description' => $achievement->description,
                    'icon' => $achievement->icon,
                    'xp_reward' => $achievement->xp_reward,
                    'unlocked_at_label' => optional($achievement->pivot?->unlocked_at)->format('d M Y'),
                ]) ?? [],
            'gamificationSettings' => [
                'leagues' => $gamifikasiConfig->leagues(),
            ],
        ]);
    }

    public function userKelas(AksesPremiumService $aksesPremium, KloterBelajarService $kloterService)
    {
        $user = Auth::user();

        $programs = ProgramPembelajaran::with(['level', 'modules' => fn ($query) => $query
            ->where('status', 'published')
            ->withCount(['flashcardSets', 'quizzes'])
            ->orderBy('week_number')
            ->orderBy('id')])
            ->with(['paymentPlans' => fn ($query) => $query
                ->where('is_active', true)
                ->where('scope_type', AksesLanggananService::SCOPE_PROGRAM)
                ->orderBy('price')])
            ->where('status', 'published')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(function (ProgramPembelajaran $program) use ($user, $aksesPremium, $kloterService) {
                $modules = $program->modules;
                $moduleIds = $modules->pluck('id');
                $accessibleCount = $modules->filter(fn (Modul $modul) => $aksesPremium->bolehAksesModul($user, $modul))->count();
                $completedCount = $moduleIds->isEmpty()
                    ? 0
                    : $user->progress()
                        ->whereIn('module_id', $moduleIds)
                        ->whereNotNull('completed_at')
                        ->count();
                $hasClassAccess = $aksesPremium->punyaAksesKelas($user, $program->id);
                $firstPaymentPlan = $program->paymentPlans->first();
                $kloterAktif = $kloterService->kloterAktifUser($user, $program->id);

                return [
                    'id' => $program->id,
                    'title' => $program->title,
                    'description' => $program->description,
                    'instructor_name' => $program->instructor_name,
                    'thumbnail_url' => $this->thumbnailProgramUrl($program->thumbnail_url),
                    'level' => $program->level?->level_name,
                    'type' => $program->level?->level_name ? 'Kelas ' . $program->level->level_name : 'Kelas utama',
                    'lessons' => $modules->count(),
                    'completed_lessons' => $completedCount,
                    'accessible_lessons' => $accessibleCount,
                    'status' => $hasClassAccess ? 'Aktif' : 'Preview',
                    'has_class_access' => $hasClassAccess,
                    'waiting_for_kloter' => $hasClassAccess && ! $kloterAktif,
                    'kloter' => $kloterAktif ? [
                        'id' => $kloterAktif->id,
                        'nama' => $kloterAktif->nama,
                        'kode' => $kloterAktif->kode,
                        'admin_name' => $kloterAktif->admin?->username,
                        'tanggal_mulai' => optional($kloterAktif->tanggal_mulai)->toDateString(),
                        'tanggal_mulai_label' => optional($kloterAktif->tanggal_mulai)->format('d M Y'),
                        'minggu_aktif' => $kloterService->mingguAktif($kloterAktif),
                    ] : null,
                    'progress' => $modules->count() > 0 ? (int) round(($completedCount / $modules->count()) * 100) : 0,
                    'href' => route('user.modul.program', $program->slug),
                    'payment_plan' => $firstPaymentPlan ? [
                        'id' => $firstPaymentPlan->id,
                        'name' => $firstPaymentPlan->name,
                        'price' => $firstPaymentPlan->price,
                        'price_formatted' => 'Rp ' . number_format($firstPaymentPlan->price),
                        'duration_days' => $firstPaymentPlan->duration_days,
                    ] : null,
                    'resource_summary' => [
                        'presentations' => DeckPresentasi::whereIn('module_id', $moduleIds)->where('status', 'published')->count(),
                        'vocabulary' => Kosakata::query()
                            ->where('status', 'published')
                            ->whereHas('flashcards.set', fn ($query) => $query
                                ->whereIn('module_id', $moduleIds)
                                ->where('status', 'published'))
                            ->distinct()
                            ->count('vocabulary_bank.id'),
                        'flashcards' => $modules->sum('flashcard_sets_count'),
                        'quizzes' => $modules->sum('quizzes_count'),
                    ],
                ];
            });

        return Inertia::render('User/Kelas/KelasPage', [
            'programs' => $programs,
        ]);
    }

    public function userCheckout(string $transactionCode)
    {
        $user = Auth::user();
        $transaction = Transaksi::query()
            ->with(['paymentPlan:id,name,slug,scope_type,program_pembelajaran_id,description,price,duration_days,features', 'programPembelajaran:id,title', 'kloterBelajar:id,nama,kode,tanggal_mulai,admin_id', 'kloterBelajar.admin:id,username'])
            ->where('user_id', $user?->id)
            ->where('transaction_code', $transactionCode)
            ->firstOrFail();

        return Inertia::render('User/Checkout/Checkout', [
            'transaction' => [
                'transaction_code' => $transaction->transaction_code,
                'amount' => $transaction->amount,
                'amount_formatted' => 'Rp ' . number_format($transaction->amount),
                'status' => $transaction->status,
                'scope_type' => $transaction->scope_type ?? AksesLanggananService::SCOPE_GLOBAL,
                'scope_label' => app(AksesLanggananService::class)->labelScope($transaction->scope_type, $transaction->programPembelajaran?->title),
                'program' => $transaction->programPembelajaran ? [
                    'id' => $transaction->programPembelajaran->id,
                    'title' => $transaction->programPembelajaran->title,
                ] : null,
                'kloter' => $transaction->kloterBelajar ? [
                    'id' => $transaction->kloterBelajar->id,
                    'nama' => $transaction->kloterBelajar->nama,
                    'kode' => $transaction->kloterBelajar->kode,
                    'admin_name' => $transaction->kloterBelajar->admin?->username,
                    'tanggal_mulai_label' => optional($transaction->kloterBelajar->tanggal_mulai)->format('d M Y'),
                ] : null,
                'created_at' => $transaction->created_at,
                'processed_at' => $transaction->processed_at,
                'payment_plan' => $transaction->paymentPlan ? [
                    'id' => $transaction->paymentPlan->id,
                    'name' => $transaction->paymentPlan->name,
                    'slug' => $transaction->paymentPlan->slug,
                    'scope_type' => $transaction->paymentPlan->scope_type ?? AksesLanggananService::SCOPE_GLOBAL,
                    'program_pembelajaran_id' => $transaction->paymentPlan->program_pembelajaran_id,
                    'description' => $transaction->paymentPlan->description,
                    'duration_days' => $transaction->paymentPlan->duration_days,
                    'features' => $transaction->paymentPlan->features ?? [],
                ] : null,
            ],
            'midtrans' => [
                'clientKey' => config('services.midtrans.client_key'),
                'isProduction' => (bool) config('services.midtrans.is_production'),
            ],
        ]);
    }

    public function adminProfile()
    {
        return Inertia::render('Admin/Profil/Profil');
    }

    public function superAdminProfile()
    {
        return Inertia::render('SuperAdmin/Profil/Profil');
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

        if (is_file($publicFile)) {
            return $relativePath . '?v=' . filemtime($publicFile);
        }

        return $relativePath;
    }
}
