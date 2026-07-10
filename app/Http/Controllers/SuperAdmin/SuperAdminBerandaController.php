<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Models\LogAktivitas;
use App\Models\PengerjaanKuis;
use App\Models\RiwayatLogin;
use App\Models\Berita;
use App\Models\Progres;
use App\Models\LogReward;
use App\Models\Pengguna;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class SuperAdminBerandaController extends SuperAdminDasarController
{
    public function __invoke()
    {
        $studentCount = Pengguna::where('role', 'user')->count();
        $activeLearners = Pengguna::where('role', 'user')
            ->whereDate('last_activity_date', '>=', now()->subDays(7)->toDateString())
            ->count();

        return Inertia::render('SuperAdmin/Beranda', [
            'metrics' => [
                $this->stat('Total Student', number_format($studentCount), '👥'),
                $this->stat('Learner Aktif', number_format($activeLearners), '🔥'),
                $this->stat('Total Admin', number_format(Pengguna::where('role', 'admin')->count()), '🛡️'),
                $this->stat('Kuis PengerjaanKuis', number_format(PengerjaanKuis::count()), '❓'),
                $this->stat('XP Terdistribusi', number_format((int) LogReward::sum('xp_amount')), '⚡'),
                $this->stat('Berita Aktif', number_format(Berita::where('status', 'published')->count()), '📰'),
            ],
            'alerts' => $this->dashboardAlerts(),
            'activities' => LogAktivitas::with('actor:id,username')
                ->latest()
                ->take(3)
                ->get()
                ->map(fn (LogAktivitas $log) => $log->description ?: $log->action)
                ->values(),
            'learningBars' => $this->learningBars(),
        ]);
    }

    private function dashboardAlerts(): array
    {
        $alerts = [];

        if (RiwayatLogin::where('status', 'failed')->whereDate('logged_in_at', today())->exists()) {
            $alerts[] = ['tone' => 'red', 'text' => 'Ada percobaan login gagal hari ini.'];
        }

        if (Berita::where('status', 'draft')->exists()) {
            $alerts[] = ['tone' => 'amber', 'text' => 'Ada news draft yang belum dipublish.'];
        }

        $alerts[] = ['tone' => 'blue', 'text' => 'Gamifikasi N3 aktif dan reward log tersedia.'];

        return $alerts;
    }

    private function learningBars(): array
    {
        return collect(range(6, 0))
            ->map(function (int $daysAgo, int $index) {
                $date = Carbon::today()->subDays($daysAgo);

                return [
                    'label' => 'D' . ($index + 1),
                    'lesson' => 20 + Progres::query()->whereDate('updated_at', $date)->count() * 8,
                    'quiz' => 20 + PengerjaanKuis::query()->whereDate('attempted_at', $date)->count() * 8,
                ];
            })
            ->values()
            ->all();
    }
}
