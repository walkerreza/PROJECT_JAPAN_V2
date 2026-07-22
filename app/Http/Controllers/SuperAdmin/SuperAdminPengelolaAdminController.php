<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Models\LogAktivitas;
use App\Models\Pengguna;
use App\Models\RiwayatStatusPengguna;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class SuperAdminPengelolaAdminController extends SuperAdminDasarController
{
    public function __invoke(Request $request)
    {
        $filters = [
            'search' => (string) $request->string('search'),
            'status' => $request->string('status')->value() ?: 'all',
            'role' => $request->string('role')->value() ?: 'all',
            'scope' => $request->string('scope')->value() ?: 'all',
        ];

        $admins = Pengguna::query()
            ->whereIn('role', ['admin', 'superadmin'])
            ->when($filters['search'], function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('username', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($filters['status'] !== 'all', fn ($query) => $query->where('status', $filters['status']))
            ->when($filters['role'] !== 'all', fn ($query) => $query->where('role', $filters['role']))
            ->when($filters['scope'] !== 'all', fn ($query) => $query
                ->where('role', 'admin')
                ->where('admin_scope', $filters['scope']))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('SuperAdmin/DataAdmin/DataAdmin', [
            'stats' => [
                $this->stat('Admin Global', number_format(Pengguna::where('role', 'admin')->where('admin_scope', Pengguna::ADMIN_SCOPE_GLOBAL)->count()), 'G'),
                $this->stat('Admin Kloter', number_format(Pengguna::where('role', 'admin')->where('admin_scope', Pengguna::ADMIN_SCOPE_KLOTER)->count()), 'K'),
                $this->stat('Superadmin', number_format(Pengguna::where('role', 'superadmin')->count()), 'S'),
                $this->stat('Nonaktif', number_format(Pengguna::whereIn('role', ['admin', 'superadmin'])->where('status', '!=', 'active')->count()), 'X', '0', 'down'),
            ],
            'admins' => $admins->through(fn (Pengguna $user) => [
                'id' => $user->id,
                'name' => $user->username,
                'email' => $user->email,
                'raw_role' => $user->role,
                'raw_scope' => $user->admin_scope,
                'raw_status' => $user->status,
                'role' => ucfirst($user->role),
                'scope' => $user->role === 'superadmin'
                    ? 'Role terpisah'
                    : ($user->isAdminKloter() ? 'Admin Kloter' : 'Admin Global'),
                'focus' => $user->role === 'superadmin'
                    ? 'Operasional platform'
                    : ($user->isAdminKloter() ? 'Konten bersama dan siswa kloter' : 'Seluruh operasional admin'),
                'updated' => optional($user->updated_at)->diffForHumans() ?? '-',
                'status' => $this->displayStatus($user->status),
            ]),
            'activities' => LogAktivitas::with('actor:id,username')
                ->whereHas('actor', fn ($query) => $query->whereIn('role', ['admin', 'superadmin']))
                ->latest()
                ->take(3)
                ->get()
                ->map(fn (LogAktivitas $log) => $log->description ?: $log->action)
                ->values(),
            'filters' => $filters,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['required', 'in:admin,superadmin'],
            'admin_scope' => [
                'nullable',
                Rule::requiredIf(fn () => $request->input('role') === 'admin'),
                Rule::in([Pengguna::ADMIN_SCOPE_GLOBAL, Pengguna::ADMIN_SCOPE_KLOTER]),
            ],
        ]);

        $password = $validated['password'] ?: Str::password(10, true, true, false, false);

        $admin = Pengguna::create([
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($password),
            'role' => $validated['role'],
            'admin_scope' => $validated['role'] === 'admin'
                ? $validated['admin_scope']
                : null,
            'status' => 'active',
            'subscription_status' => 'premium',
        ]);

        $this->logActivity($request, 'admin.created', 'user', $admin->id, "Membuat {$admin->role} {$admin->username}");

        return redirect()->back()->with('generated_password', $validated['password'] ? null : $password);
    }

    public function updateScope(Request $request, Pengguna $user)
    {
        abort_unless($user->role === 'admin', 404);

        $validated = $request->validate([
            'admin_scope' => ['required', Rule::in([Pengguna::ADMIN_SCOPE_GLOBAL, Pengguna::ADMIN_SCOPE_KLOTER])],
        ]);

        if (
            $validated['admin_scope'] === Pengguna::ADMIN_SCOPE_GLOBAL
            && $user->isAdminKloter()
            && $user->kloterDikelola()->exists()
        ) {
            throw ValidationException::withMessages([
                'admin_scope' => 'Pindahkan seluruh kloter yang diampu sebelum mengubah akun ini menjadi Admin Global.',
            ]);
        }

        $oldScope = $user->admin_scope ?: Pengguna::ADMIN_SCOPE_GLOBAL;
        $user->update(['admin_scope' => $validated['admin_scope']]);

        $this->logActivity(
            $request,
            'admin.scope_changed',
            'user',
            $user->id,
            "Mengubah cakupan admin {$user->username} dari {$oldScope} ke {$validated['admin_scope']}",
            ['old_scope' => $oldScope, 'new_scope' => $validated['admin_scope']]
        );

        return back()->with('success', 'Cakupan admin berhasil diperbarui.');
    }

    public function updateStatus(Request $request, Pengguna $user)
    {
        abort_if(! in_array($user->role, ['admin', 'superadmin'], true), 404);
        abort_if($request->user()->id === $user->id && $request->input('status') === 'suspended', 422, 'Tidak bisa menonaktifkan akun sendiri.');

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
            'admin.status_changed',
            'user',
            $user->id,
            "Mengubah status {$user->role} {$user->username} dari {$oldStatus} ke {$validated['status']}",
            ['old_status' => $oldStatus, 'new_status' => $validated['status']]
        );

        return redirect()->back()->with('success', 'Status admin berhasil diperbarui');
    }

    public function resetPassword(Request $request, Pengguna $user)
    {
        abort_if(! in_array($user->role, ['admin', 'superadmin'], true), 404);

        $password = Str::password(10, true, true, false, false);

        $user->update([
            'password' => Hash::make($password),
        ]);

        $this->logActivity($request, 'admin.password_reset', 'user', $user->id, "Reset password {$user->role} {$user->username}");

        return redirect()->back()->with('generated_password', $password);
    }
}
