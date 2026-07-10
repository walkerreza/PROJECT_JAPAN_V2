<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Models\LogAktivitas;
use App\Models\RiwayatLogin;
use Inertia\Inertia;

class SuperAdminAktivitasController extends SuperAdminDasarController
{
    public function __invoke()
    {
        return Inertia::render('SuperAdmin/Aktivitas/Aktivitas', [
            'activityStats' => [
                $this->stat('Aksi Hari Ini', number_format(LogAktivitas::whereDate('created_at', today())->count()), '🧾'),
                $this->stat('Login Berhasil', number_format(RiwayatLogin::where('status', 'success')->whereDate('logged_in_at', today())->count()), '🔐'),
                $this->stat('Perubahan Status', number_format(LogAktivitas::where('action', 'user.status_changed')->count()), '🛡️'),
                $this->stat('Alert Keamanan', number_format(RiwayatLogin::where('status', 'failed')->whereDate('logged_in_at', today())->count()), '🚨', '0', 'down'),
            ],
            'timeline' => LogAktivitas::with('actor:id,username')
                ->latest()
                ->take(8)
                ->get()
                ->map(fn (LogAktivitas $log) => [
                    'actor' => $log->actor?->username ?? 'System',
                    'action' => $log->action,
                    'target' => $log->target_type ? $log->target_type . ' #' . $log->target_id : '-',
                    'time' => $log->created_at->format('H:i'),
                    'tone' => str_contains($log->action, 'delete') || str_contains($log->action, 'suspend') ? 'red' : 'blue',
                ]),
            'logins' => RiwayatLogin::with('user:id,username')
                ->latest('logged_in_at')
                ->take(10)
                ->get()
                ->map(fn (RiwayatLogin $history) => [
                    'user' => $history->user?->username ?? $history->email ?? 'Unknown',
                    'role' => ucfirst($history->role ?? '-'),
                    'status' => $history->status === 'success' ? 'Berhasil' : 'Ditolak',
                    'location' => $history->ip_address ?? '-',
                    'device' => str($history->user_agent ?? '-')->limit(48)->toString(),
                ]),
        ]);
    }
}
