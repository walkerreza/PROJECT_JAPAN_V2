<?php

namespace Database\Seeders;

use App\Models\Pengguna;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;


//Main call untuk all seeder

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            PenggunaSeeder::class,
            N3CourseSeeder::class,
            KelasDemoSeeder::class,
            KloterDemoSeeder::class,
            ProgramPaymentPlanSeeder::class,
            AchievementSeeder::class,
            DemoDataSeeder::class,
        ]);
    }
}
