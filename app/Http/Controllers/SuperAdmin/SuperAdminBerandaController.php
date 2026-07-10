<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Models\Berita;
use App\Models\LogAktivitas;
use App\Models\LogReward;
use App\Models\Modul;
use App\Models\PengerjaanKuis;
use App\Models\Pengguna;
use App\Models\Progres;
use App\Models\RiwayatLogin;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class SuperAdminBerandaController extends SuperAdminDasarController
{
    public function __invoke()
    {
        return Inertia::render('SuperAdmin/Beranda', [
            'metrics' => Cache::remember('superadmin.dashboard.metrics', 60, fn () => $this->metrics()),
            'alerts' => Cache::remember('superadmin.dashboard.alerts', 60, fn () => $this->dashboardAlerts()),
            'activities' => LogAktivitas::with('actor:id,username')
                ->latest()
                ->take(5)
                ->get()
                ->map(fn (LogAktivitas $log) => [
                    'actor' => $log->actor?->username ?? 'System',
                    'action' => $log->description ?: str($log->action)->replace(['.', '_'], ' ')->title()->toString(),
                    'target' => $log->target_type ? $log->target_type . ' #' . $log->target_id : 'Platform',
                    'time' => $log->created_at?->diffForHumans() ?? '-',
                ])
                ->values(),
            'learningBars' => Cache::remember('superadmin.dashboard.learning_bars', 60, fn () => $this->learningBars()),
            'focusBars' => Cache::remember('superadmin.dashboard.focus_bars', 60, fn () => $this->focusBars()),
            'healthCards' => Cache::remember('superadmin.dashboard.health_cards', 60, fn () => $this->healthCards()),
            'quickActions' => $this->quickActions(),
        ]);
    }

    private function metrics(): array
    {
        $studentCount = Pengguna::where('role', 'user')->count();
        $activeLearners = Pengguna::where('role', 'user')
            ->whereDate('last_activity_date', '>=', now()->subDays(7)->toDateString())
            ->count();

        return [
            $this->stat('Total Student', number_format($studentCount), 'U', ''),
            $this->stat('Learner Aktif', number_format($activeLearners), 'A', ''),
            $this->stat('Total Admin', number_format(Pengguna::where('role', 'admin')->count()), 'M', ''),
            $this->stat('Pengerjaan Kuis', number_format(PengerjaanKuis::count()), 'Q', ''),
            $this->stat('XP Terdistribusi', number_format((int) LogReward::sum('xp_amount')), 'XP', ''),
            $this->stat('Berita Aktif', number_format(Berita::where('status', 'published')->count()), 'N', ''),
        ];
    }

    private function dashboardAlerts(): array
    {
        $alerts = [];

        if (RiwayatLogin::where('status', 'failed')->whereDate('logged_in_at', today())->exists()) {
            $alerts[] = ['tone' => 'red', 'text' => 'Ada percobaan login gagal hari ini.'];
        }

        if (Berita::where('status', 'draft')->exists()) {
            $alerts[] = ['tone' => 'amber', 'text' => 'Ada berita draft yang belum dipublish.'];
        }

        if (empty($alerts)) {
            $alerts[] = ['tone' => 'blue', 'text' => 'Tidak ada alert operasional kritis hari ini.'];
        }

        return $alerts;
    }

    private function learningBars(): array
    {
        return collect(range(6, 0))
            ->map(function (int $daysAgo, int $index) {
                $date = Carbon::today()->subDays($daysAgo);
                $completedModules = Progres::query()->whereDate('completed_at', $date)->count();
                $quizAttempts = PengerjaanKuis::query()->whereDate('attempted_at', $date)->count();

                return [
                    'label' => 'D' . ($index + 1),
                    'lesson' => min(100, $completedModules * 12),
                    'quiz' => min(100, $quizAttempts * 12),
                ];
            })
            ->values()
            ->all();
    }

    private function focusBars(): array
    {
        $studentCount = Pengguna::where('role', 'user')->count();
        $publishedModules = Modul::where('status', 'published')->count();
        $quizAttempts = PengerjaanKuis::count();
        $activityLogs = LogAktivitas::whereDate('created_at', today())->count();
        $total = max(1, $studentCount + $publishedModules + $quizAttempts + $activityLogs);

        return [
            $this->focusItem('User operations', $studentCount, $total, 'bg-red-600'),
            $this->focusItem('Konten published', $publishedModules, $total, 'bg-red-400'),
            $this->focusItem('Pengerjaan kuis', $quizAttempts, $total, 'bg-amber-400'),
            $this->focusItem('Log hari ini', $activityLogs, $total, 'bg-gray-400'),
        ];
    }

    private function focusItem(string $label, int $count, int $total, string $color): array
    {
        return [
            'label' => $label,
            'value' => number_format($count),
            'width' => max(8, min(100, (int) round(($count / $total) * 100))) . '%',
            'color' => $color,
        ];
    }

    private function healthCards(): array
    {
        $failedLoginCount = RiwayatLogin::where('status', 'failed')->whereDate('logged_in_at', today())->count();
        $queueCount = DB::table('jobs')->count();
        $draftNewsCount = Berita::where('status', 'draft')->count();
        $suspendedUsers = Pengguna::where('role', 'user')->where('status', 'suspended')->count();

        return [
            [
                'label' => 'Login ditolak hari ini',
                'value' => number_format($failedLoginCount),
                'tone' => $failedLoginCount > 0 ? 'red' : 'green',
                'note' => $failedLoginCount > 0 ? 'Perlu cek Aktivitas' : 'Aman',
            ],
            [
                'label' => 'Queue tertunda',
                'value' => number_format($queueCount),
                'tone' => $queueCount > 10 ? 'amber' : 'green',
                'note' => $queueCount > 10 ? 'Pantau worker' : 'Normal',
            ],
            [
                'label' => 'Berita draft',
                'value' => number_format($draftNewsCount),
                'tone' => $draftNewsCount > 0 ? 'amber' : 'green',
                'note' => $draftNewsCount > 0 ? 'Review konten' : 'Tidak ada draft',
            ],
            [
                'label' => 'User suspended',
                'value' => number_format($suspendedUsers),
                'tone' => $suspendedUsers > 0 ? 'red' : 'green',
                'note' => $suspendedUsers > 0 ? 'Perlu follow-up' : 'Tidak ada',
            ],
        ];
    }

    private function quickActions(): array
    {
        return [
            ['label' => 'Kelola User', 'description' => 'Cari user, suspend, reset password.', 'href' => route('superadmin.users'), 'icon' => 'U'],
            ['label' => 'Kelola Admin', 'description' => 'Tambah admin dan kontrol status.', 'href' => route('superadmin.admins'), 'icon' => 'A'],
            ['label' => 'Kloter Belajar', 'description' => 'Atur kloter dan access key.', 'href' => route('superadmin.kloters'), 'icon' => 'K'],
            ['label' => 'Pembayaran', 'description' => 'Cek transaksi, plan, dan akses.', 'href' => route('superadmin.payments'), 'icon' => 'P'],
            ['label' => 'Gamifikasi', 'description' => 'Atur XP, streak, dan achievement.', 'href' => route('superadmin.gamification'), 'icon' => 'G'],
            ['label' => 'Aktivitas', 'description' => 'Audit log dan login history.', 'href' => route('superadmin.activity'), 'icon' => 'L'],
        ];
    }
}
