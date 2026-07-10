<?php

namespace App\Console\Commands;

use App\Models\LogAktivitas;
use App\Models\RiwayatLogin;
use Illuminate\Console\Command;

class BersihkanLogOperasional extends Command
{
    protected $signature = 'logs:prune {--days=90 : Umur maksimal log operasional yang disimpan} {--dry-run : Tampilkan jumlah tanpa menghapus data}';

    protected $description = 'Prune old activity and login logs to keep the database light.';

    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));
        $cutoff = now()->subDays($days);

        $activityQuery = LogAktivitas::where('created_at', '<', $cutoff);
        $loginQuery = RiwayatLogin::where('logged_in_at', '<', $cutoff);

        $activityCount = (clone $activityQuery)->count();
        $loginCount = (clone $loginQuery)->count();

        if ($this->option('dry-run')) {
            $this->info('Dry run log pruning.');
            $this->line("Activity logs to delete: {$activityCount}");
            $this->line("Login histories to delete: {$loginCount}");

            return self::SUCCESS;
        }

        (clone $activityQuery)->delete();
        (clone $loginQuery)->delete();

        $this->info('Log pruning finished.');
        $this->line("Activity logs deleted: {$activityCount}");
        $this->line("Login histories deleted: {$loginCount}");

        return self::SUCCESS;
    }
}
