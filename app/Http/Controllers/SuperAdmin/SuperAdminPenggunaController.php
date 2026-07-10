<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Models\Pengguna;
use App\Models\RiwayatStatusPengguna;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SuperAdminPenggunaController extends SuperAdminDasarController
{
    public function __invoke(Request $request)
    {
        $filters = [
            'search' => (string) $request->string('search'),
            'status' => $request->string('status')->value() ?: 'all',
        ];

        $students = Pengguna::query()
            ->where('role', 'user')
            ->when($filters['search'], function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('username', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($filters['status'] !== 'all', fn ($query) => $query->where('status', $filters['status']))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('SuperAdmin/DataUser/DataUser', [
            'stats' => [
                $this->stat('Total Student', number_format(Pengguna::where('role', 'user')->count()), 'U'),
                $this->stat('Aktif Mingguan', number_format(Pengguna::where('role', 'user')->whereDate('last_activity_date', '>=', now()->subDays(7)->toDateString())->count()), 'A'),
                $this->stat('Perlu Review', number_format(Pengguna::where('role', 'user')->whereNull('last_activity_date')->count()), 'R', '0', 'down'),
                $this->stat('Akun Suspended', number_format(Pengguna::where('role', 'user')->where('status', 'suspended')->count()), 'S', '0', 'down'),
            ],
            'users' => $students->through(fn (Pengguna $user) => [
                'id' => $user->id,
                'name' => $user->username,
                'email' => $user->email,
                'raw_status' => $user->status,
                'status' => $this->displayStatus($user->status),
                'xp' => number_format($user->xp),
                'level' => 'Lv ' . $user->level,
                'streak' => $user->streak_count . ' hari',
                'progress' => min(100, max(8, (int) round($user->xp / 20))) . '%',
            ]),
            'filters' => $filters,
        ]);
    }

    public function updateStatus(Request $request, Pengguna $user)
    {
        abort_if($user->role !== 'user', 404);

        $validated = $request->validate([
            'status' => ['required', 'in:active,suspended'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $oldStatus = $user->status ?? 'active';

        $user->update([
            'status' => $validated['status'],
            'suspended_at' => $validated['status'] === 'suspended' ? now() : null,
            'suspended_reason' => $validated['status'] === 'suspended' ? ($validated['reason'] ?? null) : null,
        ]);

        RiwayatStatusPengguna::create([
            'user_id' => $user->id,
            'changed_by' => $request->user()->id,
            'old_status' => $oldStatus,
            'new_status' => $validated['status'],
            'reason' => $validated['reason'] ?? null,
        ]);

        $this->logActivity(
            $request,
            'user.status_changed',
            'user',
            $user->id,
            "Mengubah status user {$user->username} dari {$oldStatus} ke {$validated['status']}",
            ['old_status' => $oldStatus, 'new_status' => $validated['status']]
        );

        return redirect()->back()->with('success', 'Status user berhasil diperbarui');
    }

    public function resetPassword(Request $request, Pengguna $user)
    {
        abort_if($user->role !== 'user', 404);

        $password = Str::password(10, true, true, false, false);

        $user->update([
            'password' => Hash::make($password),
        ]);

        $this->logActivity($request, 'user.password_reset', 'user', $user->id, "Reset password user {$user->username}");

        return redirect()->back()->with('generated_password', $password);
    }
}
