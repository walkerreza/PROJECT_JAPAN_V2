<?php

namespace Database\Seeders;

use App\Models\Pengguna;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PenggunaSeeder extends Seeder
{
    public const DEMO_PASSWORD = 'password';

    public function run(): void
    {
        $this->seedAccount('admin@japanlingo.com', [
            'username' => 'Admin Global JapanLingo',
            'email_verified_at' => now(),
            'password_login_enabled' => true,
            'role' => 'admin',
            'admin_scope' => Pengguna::ADMIN_SCOPE_GLOBAL,
            'status' => 'active',
        ]);

        $this->seedAccount('admin.kloter@japanlingo.com', [
            'username' => 'Mentor JapanLingo',
            'email_verified_at' => now(),
            'password_login_enabled' => true,
            'role' => 'admin',
            'admin_scope' => Pengguna::ADMIN_SCOPE_KLOTER,
            'status' => 'active',
        ]);

        $this->seedAccount('superadmin@japanlingo.com', [
            'username' => 'Superadmin JapanLingo',
            'email_verified_at' => now(),
            'password_login_enabled' => true,
            'role' => 'superadmin',
            'admin_scope' => null,
            'status' => 'active',
        ]);

        $this->seedAccount('student@japanlingo.com', [
            'username' => 'Siswa Mandiri Demo',
            'email_verified_at' => now(),
            'password_login_enabled' => true,
            'role' => 'user',
            'subscription_status' => 'premium',
            'status' => 'active',
            'xp' => 0,
            'level' => 1,
            'streak_count' => 0,
            'last_activity_date' => null,
        ]);

        $this->seedAccount('student2@japanlingo.com', [
            'username' => 'Siswa Mentor Demo',
            'email_verified_at' => now(),
            'password_login_enabled' => true,
            'role' => 'user',
            'subscription_status' => 'premium',
            'status' => 'active',
            'xp' => 0,
            'level' => 1,
            'streak_count' => 0,
            'last_activity_date' => null,
        ]);
    }

    private function seedAccount(string $email, array $attributes): Pengguna
    {
        $user = Pengguna::firstOrNew(['email' => $email]);

        $user->password = Hash::make(self::DEMO_PASSWORD);
        $user->fill($attributes)->save();

        return $user;
    }
}
