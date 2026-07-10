<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Models\LogAktivitas;
use App\Models\Pengguna;
use App\Models\RiwayatLogin;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SuperAdminAktivitasController extends SuperAdminDasarController
{
    public function __invoke(Request $request)
    {
        $filters = [
            'date_from' => $request->date('date_from')?->toDateString(),
            'date_to' => $request->date('date_to')?->toDateString(),
            'actor_id' => $request->integer('actor_id') ?: null,
            'action' => $request->string('action')->value() ?: 'all',
            'login_status' => $request->string('login_status')->value() ?: 'all',
        ];

        $timeline = LogAktivitas::with('actor:id,username')
            ->when($filters['date_from'], fn ($query, $date) => $query->whereDate('created_at', '>=', $date))
            ->when($filters['date_to'], fn ($query, $date) => $query->whereDate('created_at', '<=', $date))
            ->when($filters['actor_id'], fn ($query, $actorId) => $query->where('actor_id', $actorId))
            ->when($filters['action'] !== 'all', fn ($query) => $query->where('action', $filters['action']))
            ->latest()
            ->paginate(15, ['*'], 'timeline_page')
            ->withQueryString()
            ->through(fn (LogAktivitas $log) => [
                'actor' => $log->actor?->username ?? 'System',
                'action' => $this->displayAction($log->action),
                'target' => $log->target_type ? $log->target_type . ' #' . $log->target_id : '-',
                'time' => $log->created_at?->diffForHumans() ?? '-',
                'tone' => $this->toneForAction($log->action),
            ]);

        $logins = RiwayatLogin::with('user:id,username')
            ->when($filters['date_from'], fn ($query, $date) => $query->whereDate('logged_in_at', '>=', $date))
            ->when($filters['date_to'], fn ($query, $date) => $query->whereDate('logged_in_at', '<=', $date))
            ->when($filters['login_status'] !== 'all', fn ($query) => $query->where('status', $filters['login_status']))
            ->latest('logged_in_at')
            ->paginate(10, ['*'], 'login_page')
            ->withQueryString()
            ->through(fn (RiwayatLogin $history) => [
                'user' => $history->user?->username ?? $history->email ?? 'Unknown',
                'role' => ucfirst($history->role ?? '-'),
                'status' => $history->status === 'success' ? 'Berhasil' : 'Ditolak',
                'location' => $history->ip_address ?? '-',
                'device' => str($history->user_agent ?? '-')->limit(48)->toString(),
            ]);

        return Inertia::render('SuperAdmin/Aktivitas/Aktivitas', [
            'activityStats' => [
                $this->stat('Aksi Hari Ini', number_format(LogAktivitas::whereDate('created_at', today())->count()), 'L'),
                $this->stat('Login Berhasil', number_format(RiwayatLogin::where('status', 'success')->whereDate('logged_in_at', today())->count()), 'IN'),
                $this->stat('Perubahan Status', number_format(LogAktivitas::where('action', 'like', '%.status_changed')->count()), 'S'),
                $this->stat('Login Ditolak', number_format(RiwayatLogin::where('status', 'failed')->whereDate('logged_in_at', today())->count()), '!', '0', 'down'),
            ],
            'timeline' => $timeline,
            'logins' => $logins,
            'riskyEvents' => $this->riskyEvents(),
            'filters' => $filters,
            'filterOptions' => [
                'actors' => Pengguna::query()
                    ->whereIn('role', ['admin', 'superadmin'])
                    ->orderBy('username')
                    ->get(['id', 'username'])
                    ->map(fn (Pengguna $user) => ['id' => $user->id, 'name' => $user->username]),
                'actions' => LogAktivitas::query()
                    ->select('action')
                    ->distinct()
                    ->orderBy('action')
                    ->limit(50)
                    ->pluck('action')
                    ->map(fn (string $action) => ['value' => $action, 'label' => $this->displayAction($action)])
                    ->values(),
            ],
        ]);
    }

    private function displayAction(string $action): string
    {
        return Str::of($action)
            ->replace(['.', '_'], ' ')
            ->title()
            ->toString();
    }

    private function toneForAction(string $action): string
    {
        if (Str::contains($action, ['delete', 'destroy', 'suspend', 'reset'])) {
            return 'red';
        }

        if (Str::contains($action, ['update', 'changed', 'archive'])) {
            return 'amber';
        }

        if (Str::contains($action, ['created', 'store', 'publish'])) {
            return 'emerald';
        }

        return 'blue';
    }

    private function riskyEvents(): array
    {
        $events = [];
        $failedLoginCount = RiwayatLogin::where('status', 'failed')->whereDate('logged_in_at', today())->count();
        $resetCount = LogAktivitas::where('action', 'like', '%.password_reset')->whereDate('created_at', today())->count();

        if ($failedLoginCount > 0) {
            $events[] = "{$failedLoginCount} login ditolak hari ini. Cek IP dan akun terkait.";
        }

        if ($resetCount > 0) {
            $events[] = "{$resetCount} reset password dilakukan hari ini.";
        }

        if (empty($events)) {
            $events[] = 'Tidak ada aktivitas berisiko tinggi hari ini.';
        }

        return $events;
    }
}
