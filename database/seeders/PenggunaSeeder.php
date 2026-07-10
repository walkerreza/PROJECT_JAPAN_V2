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
            'status' => 'active',
        ]);

        Pengguna::updateOrCreate(['email' => 'superadmin@japanlingo.com'], [
            'username' => 'SuperAdmin Japanlingo',
            'password' => Hash::make('password'),
            'role' => 'superadmin',
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
