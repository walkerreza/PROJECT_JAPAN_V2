<?php

namespace Database\Seeders;

use App\Models\Pengguna;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PenggunaSeeder extends Seeder
{
    public function run(): void
    {
        Pengguna::updateOrCreate(['email' => 'admin@japanlingo.com'], [
            'username' => 'Admin Japanlingo',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'admin_scope' => Pengguna::ADMIN_SCOPE_GLOBAL,
            'status' => 'active',
        ]);

        Pengguna::updateOrCreate(['email' => 'admin.kloter@japanlingo.com'], [
            'username' => 'Admin Kloter Japanlingo',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'admin_scope' => Pengguna::ADMIN_SCOPE_KLOTER,
            'status' => 'active',
        ]);

        Pengguna::updateOrCreate(['email' => 'superadmin@japanlingo.com'], [
            'username' => 'SuperAdmin Japanlingo',
            'password' => Hash::make('password'),
            'role' => 'superadmin',
            'admin_scope' => null,
            'status' => 'active',
        ]);

        Pengguna::updateOrCreate(['email' => 'student@japanlingo.com'], [
            'username' => 'Student Japanlingo',
            'password' => Hash::make('password'),
            'role' => 'user',
            'subscription_status' => 'premium',
            'status' => 'active',
            'xp' => 150,
            'level' => 2,
            'streak_count' => 3,
            'last_activity_date' => now(),
        ]);

        Pengguna::updateOrCreate(['email' => 'student2@japanlingo.com'], [
            'username' => 'Student2 Japanlingo',
            'password' => Hash::make('password'),
            'role' => 'user',
            'subscription_status' => 'free',
            'status' => 'active',
            'xp' => 100,
            'level' => 1,
            'streak_count' => 1,
            'last_activity_date' => now(),
        ]);
    }
}
