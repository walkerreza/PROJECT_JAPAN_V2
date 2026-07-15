<?php

namespace App\Console\Commands;

use App\Models\Berita;
use Illuminate\Console\Command;

class PublishScheduledNews extends Command
{
    protected $signature = 'news:publish-scheduled';

    protected $description = 'Publish scheduled news whose publication time has arrived.';

    public function handle(): int
    {
        $published = 0;

        Berita::query()
            ->where('status', 'scheduled')
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now())
            ->orderBy('id')
            ->chunkById(100, function ($news) use (&$published): void {
                foreach ($news as $item) {
                    $item->update([
                        'status' => 'published',
                        'published_at' => now(),
                        'scheduled_at' => null,
                    ]);

                    $published++;
                }
            });

        $this->info("{$published} scheduled news item(s) published.");

        return self::SUCCESS;
    }
}
