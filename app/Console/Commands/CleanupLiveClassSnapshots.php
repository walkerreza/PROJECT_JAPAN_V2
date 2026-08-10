<?php

namespace App\Console\Commands;

use App\Models\SesiKelasLive;
use Illuminate\Console\Command;

class CleanupLiveClassSnapshots extends Command
{
    protected $signature = 'live-classes:cleanup-snapshots {--days=30 : Umur minimum sesi berakhir}';

    protected $description = 'Menghapus snapshot papan lama tanpa menghapus riwayat sesi kelas';

    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));
        $cleaned = SesiKelasLive::query()
            ->where('status', 'ended')
            ->where('ended_at', '<=', now()->subDays($days))
            ->whereNotNull('board_snapshot')
            ->update(['board_snapshot' => null]);

        $this->info("{$cleaned} snapshot kelas live dibersihkan.");

        return self::SUCCESS;
    }
}
