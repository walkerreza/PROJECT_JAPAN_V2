<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Pengguna;
use App\Models\RiwayatLogin;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class LoginSosialController extends Controller
{
    public const ACCOUNT_DELETION_CONFIRMED_AT = 'profile.account_deletion.google_confirmed_at';

    public const ACCOUNT_DELETION_CONFIRMED_USER_ID = 'profile.account_deletion.google_confirmed_user_id';

    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Throwable $exception) {
            report($exception);

            return redirect()->route('login')->withErrors([
                'email' => 'Login Google gagal. Coba lagi atau gunakan email dan password.',
            ]);
        }

        $email = $googleUser->getEmail();
        $emailVerified = (bool) data_get($googleUser->user, 'email_verified');

        if (! $email || ! $emailVerified) {
            return redirect()->route('login')->withErrors([
                'email' => 'Akun Google harus memiliki email yang sudah terverifikasi.',
            ]);
        }

        $user = Pengguna::where('google_id', $googleUser->getId())->first();

        if (! $user) {
            $user = Pengguna::where('email', $email)->first();
        }

        if ($user) {
            if (in_array($user->role, ['admin', 'superadmin'], true) && ! $user->google_id) {
                return redirect()->route('login')->withErrors([
                    'email' => 'Login Google belum terhubung untuk akun pengelola ini.',
                ]);
            }

            $user->forceFill([
                'google_id' => $user->google_id ?: $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
                'email_verified_at' => $user->email_verified_at ?: now(),
            ])->save();
        } else {
            $user = new Pengguna([
                'username' => $this->usernameFromGoogle($googleUser->getName(), $googleUser->getEmail()),
                'email' => $email,
                'password' => Hash::make(Str::random(40)),
                'password_login_enabled' => false,
                'role' => 'user',
                'subscription_status' => 'free',
                'auth_provider' => 'google',
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
            ]);

            $user->forceFill(['email_verified_at' => now()])->save();
        }

        if ($user->status === 'suspended') {
            RiwayatLogin::create([
                'user_id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'status' => 'failed',
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'logged_in_at' => now(),
            ]);

            return redirect()->route('login')->withErrors([
                'email' => 'Akun Anda telah disuspend.',
            ]);
        }

        Auth::login($user, true);
        request()->session()->regenerate();

        RiwayatLogin::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'status' => 'success',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'logged_in_at' => now(),
        ]);

        if ($user->role === 'superadmin') {
            return redirect()->route('superadmin.dashboard');
        }

        if ($user->role === 'admin') {
            return redirect()->route('admin.dashboard');
        }

        return redirect()->route('user.dashboard');
    }

    public function redirectForAccountDeletion(Request $request): RedirectResponse
    {
        abort_unless(filled($request->user()->google_id), 403);

        return Socialite::driver('google')
            ->redirectUrl(route('profile.delete.google.callback'))
            ->with(['prompt' => 'select_account'])
            ->redirect();
    }

    public function handleAccountDeletionCallback(Request $request): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')
                ->redirectUrl(route('profile.delete.google.callback'))
                ->user();
        } catch (\Throwable $exception) {
            report($exception);

            return redirect()->route('profile.edit')
                ->with('reopen_delete_dialog', true)
                ->withErrors(['google_confirmation' => 'Verifikasi Google gagal. Silakan coba kembali.']);
        }

        $user = $request->user();
        $email = $googleUser->getEmail();
        $emailVerified = (bool) data_get($googleUser->user, 'email_verified');
        $googleIdMatches = filled($user->google_id)
            && hash_equals((string) $user->google_id, (string) $googleUser->getId());
        $emailMatches = filled($email)
            && hash_equals(Str::lower($user->email), Str::lower($email));

        if (! $emailVerified || ! $googleIdMatches || ! $emailMatches) {
            return redirect()->route('profile.edit')
                ->with('reopen_delete_dialog', true)
                ->withErrors(['google_confirmation' => 'Gunakan akun Google yang terhubung dengan akun Japanlingo ini.']);
        }

        $request->session()->put([
            self::ACCOUNT_DELETION_CONFIRMED_AT => now()->timestamp,
            self::ACCOUNT_DELETION_CONFIRMED_USER_ID => $user->id,
        ]);

        return redirect()->route('profile.edit')
            ->with('reopen_delete_dialog', true)
            ->with('success', 'Identitas Google berhasil diverifikasi. Konfirmasi berlaku selama lima menit.');
    }

    private function usernameFromGoogle(?string $name, ?string $email): string
    {
        $fallback = $email ? Str::before($email, '@') : 'google-user';

        return Str::limit(trim($name ?: $fallback), 100, '');
    }
}
