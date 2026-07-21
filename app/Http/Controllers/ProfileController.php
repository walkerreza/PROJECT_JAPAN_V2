<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Auth\LoginSosialController;
use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = $request->user();
        $passwordLoginEnabled = $user->password_login_enabled !== false;

        $request->validate([
            'confirmation_username' => ['required', 'string'],
            'password' => $passwordLoginEnabled
                ? ['required', 'current_password']
                : ['nullable'],
        ]);

        if (! hash_equals($user->username, (string) $request->input('confirmation_username'))) {
            throw ValidationException::withMessages([
                'confirmation_username' => 'Username tidak cocok dengan akun Anda.',
            ]);
        }

        if (! $passwordLoginEnabled && ! $this->hasRecentGoogleConfirmation($request)) {
            throw ValidationException::withMessages([
                'google_confirmation' => 'Verifikasi ulang akun Google sebelum menghapus akun.',
            ]);
        }

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    private function hasRecentGoogleConfirmation(Request $request): bool
    {
        $confirmedAt = (int) $request->session()->get(LoginSosialController::ACCOUNT_DELETION_CONFIRMED_AT, 0);
        $confirmedUserId = (int) $request->session()->get(LoginSosialController::ACCOUNT_DELETION_CONFIRMED_USER_ID, 0);

        return filled($request->user()->google_id)
            && $confirmedUserId === (int) $request->user()->id
            && $confirmedAt >= now()->subMinutes(5)->timestamp;
    }
}
