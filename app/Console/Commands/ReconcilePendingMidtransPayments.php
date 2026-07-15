<?php

namespace App\Console\Commands;

use App\Http\Controllers\PembayaranMidtransController;
use App\Models\Transaksi;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class ReconcilePendingMidtransPayments extends Command
{
    protected $signature = 'payments:reconcile-pending {--hours=48 : Hanya periksa transaksi yang diperbarui dalam rentang jam ini}';

    protected $description = 'Menyelaraskan transaksi Midtrans pending dengan status resmi Midtrans.';

    public function handle(PembayaranMidtransController $midtrans): int
    {
        $hours = max(1, (int) $this->option('hours'));
        $lock = Cache::lock('payments:reconcile-pending', 600);

        if (! $lock->get()) {
            $this->warn('Rekonsiliasi sedang berjalan pada proses lain.');

            return self::SUCCESS;
        }

        try {
            $processed = 0;
            $failed = 0;

            Transaksi::query()
                ->where('status', 'pending')
                ->where('updated_at', '>=', now()->subHours($hours))
                ->orderBy('id')
                ->chunkById(50, function ($transactions) use ($midtrans, &$processed, &$failed) {
                    foreach ($transactions as $transaction) {
                        if ($midtrans->reconcilePendingTransaction($transaction)) {
                            $processed++;
                        } else {
                            $failed++;
                        }
                    }
                });

            $this->info("Rekonsiliasi selesai. Diproses: {$processed}; gagal: {$failed}.");

            return $failed > 0 ? self::FAILURE : self::SUCCESS;
        } finally {
            $lock->release();
        }
    }
}
