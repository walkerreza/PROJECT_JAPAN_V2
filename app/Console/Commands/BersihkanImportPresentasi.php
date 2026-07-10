<?php

namespace App\Console\Commands;

use App\Services\BersihkanImportPresentasiService;
use Illuminate\Console\Command;

class BersihkanImportPresentasi extends Command
{
    protected $signature = 'presentations:cleanup-imports {--days=14 : Umur maksimal file import sementara}';

    protected $description = 'Clean old presentation import files from local VPS storage.';

    public function handle(BersihkanImportPresentasiService $service): int
    {
        $days = max(1, (int) $this->option('days'));
        $result = $service->bersihkan($days);

        $this->info('Presentation import cleanup finished.');
        $this->line('Private import files deleted: ' . $result['private_import_files']);
        $this->line('Private temp items deleted: ' . $result['private_tmp_items']);

        return self::SUCCESS;
    }
}
