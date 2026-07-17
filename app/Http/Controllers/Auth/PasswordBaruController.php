<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\PasswordResetOtpService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PasswordBaruController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('Auth/PasswordResetOtp', [
            'mode' => 'verify',
            'email' => $request->query('email', ''),
            'status' => session('status'),
            'sentAt' => session('password_reset_otp_sent_at'),
        ]);
    }

    public function store(Request $request, PasswordResetOtpService $otp): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'otp' => ['required', 'digits:6'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = $otp->reset(
            $request->string('email')->toString(),
            $request->string('otp')->toString(),
            $request->string('password')->toString(),
            $request->ip(),
        );

        if ($user) {
            return redirect()->route('login')->with('status', 'Kata sandi berhasil diperbarui. Silakan masuk.');
        }

        throw ValidationException::withMessages([
            'otp' => ['Kode OTP tidak valid, telah kedaluwarsa, atau percobaan Anda terlalu banyak.'],
        ]);
    }
}
