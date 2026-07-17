<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Pengguna;
use App\Models\RiwayatLogin;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class LoginSosialController extends Controller
{
    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Throwable) {
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

            $user->update([
                'google_id' => $user->google_id ?: $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
                'email_verified_at' => $user->email_verified_at ?: now(),
            ]);
        } else {
            $user = Pengguna::create([
                'username' => $this->usernameFromGoogle($googleUser->getName(), $googleUser->getEmail()),
                'email' => $email,
                'password' => Hash::make(Str::random(40)),
                'password_login_enabled' => false,
                'role' => 'user',
                'subscription_status' => 'free',
                'auth_provider' => 'google',
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
                'email_verified_at' => now(),
            ]);
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

    private function usernameFromGoogle(?string $name, ?string $email): string
    {
        $fallback = $email ? Str::before($email, '@') : 'google-user';

        return Str::limit(trim($name ?: $fallback), 100, '');
    }
}
