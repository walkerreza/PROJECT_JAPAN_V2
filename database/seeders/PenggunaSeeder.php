<?php

namespace Database\Seeders;

use App\Models\Pengguna;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PenggunaSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedAccount('admin@japanlingo.com', [
            'username' => 'Admin Japanlingo',
            'email_verified_at' => now(),
            'role' => 'admin',
            'admin_scope' => Pengguna::ADMIN_SCOPE_GLOBAL,
            'status' => 'active',
        ]);

        $this->seedAccount('admin.kloter@japanlingo.com', [
            'username' => 'Admin Kloter Japanlingo',
            'email_verified_at' => now(),
            'role' => 'admin',
            'admin_scope' => Pengguna::ADMIN_SCOPE_KLOTER,
            'status' => 'active',
        ]);

        $this->seedAccount('superadmin@japanlingo.com', [
            'username' => 'SuperAdmin Japanlingo',
            'email_verified_at' => now(),
            'role' => 'superadmin',
            'admin_scope' => null,
            'status' => 'active',
        ]);

        $this->seedAccount('student@japanlingo.com', [
            'username' => 'Student Japanlingo',
            'email_verified_at' => now(),
            'role' => 'user',
            'subscription_status' => 'premium',
            'status' => 'active',
            'xp' => 150,
            'level' => 2,
            'streak_count' => 3,
            'last_activity_date' => now(),
        ]);

        $this->seedAccount('student2@japanlingo.com', [
            'username' => 'Student2 Japanlingo',
            'email_verified_at' => now(),
            'role' => 'user',
            'subscription_status' => 'free',
            'status' => 'active',
            'xp' => 100,
            'level' => 1,
            'streak_count' => 1,
            'last_activity_date' => now(),
        ]);
    }

    private function seedAccount(string $email, array $attributes): Pengguna
    {
        $user = Pengguna::firstOrNew(['email' => $email]);

        if (! $user->exists) {
            $user->password = Hash::make('password');
        }

        $user->fill($attributes)->save();

        return $user;
    }
}
