<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;

class PengarahDashboardController extends Controller
{
    public function __invoke(): RedirectResponse
    {
        $user = auth()->user();

        return match ($user->role) {
            'superadmin' => redirect()->route('superadmin.dashboard'),
            'admin' => redirect()->route('admin.dashboard'),
            default => redirect()->route('user.dashboard'),
        };
    }
}
