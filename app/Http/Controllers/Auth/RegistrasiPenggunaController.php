<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Pengguna;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegistrasiPenggunaController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required_without:username|string|max:255',
            'username' => 'nullable|string|max:255',
            'email' => 'required|email|max:255|unique:'.Pengguna::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $username = $request->input('username') ?: $request->input('name');

        $user = Pengguna::create([
            'username' => $username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'password_login_enabled' => true,
        ]);

        event(new Registered($user));

        Auth::login($user);

        if ($user->role === 'superadmin') {
            return redirect(route('superadmin.dashboard', absolute: false));
        } elseif ($user->role === 'admin') {
            return redirect(route('admin.dashboard', absolute: false));
        }

        return redirect(route('user.dashboard', absolute: false));
    }
}
