<?php

namespace Database\Seeders;

use App\Models\KloterBelajar;
use App\Models\Pengguna;
use App\Models\ProgramPembelajaran;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class KloterDemoSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Pengguna::where('email', 'admin.kloter@japanlingo.com')
            ->where('role', 'admin')
            ->where('admin_scope', Pengguna::ADMIN_SCOPE_KLOTER)
            ->first();

        ProgramPembelajaran::where('status', 'published')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->each(function (ProgramPembelajaran $program) use ($admin) {
                KloterBelajar::updateOrCreate(
                    ['kode' => 'KLT-'.strtoupper(Str::slug($program->slug ?: $program->title, ''))],
                    [
                        'program_pembelajaran_id' => $program->id,
                        'admin_id' => $admin?->id,
                        'nama' => $program->title.' - Kloter Aktif',
                        'tanggal_mulai' => now()->subWeek()->toDateString(),
                        'tanggal_selesai' => now()->addMonths(2)->toDateString(),
                        'max_siswa' => 30,
                        'is_default' => true,
                        'status' => 'active',
                        'catatan' => 'Kloter default demo untuk auto-assign payment.',
                    ]
                );
            });
    }
}
