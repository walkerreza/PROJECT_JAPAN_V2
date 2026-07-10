<?php

namespace App\Console\Commands;

use App\Models\Langganan;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class KadaluarsaLangganan extends Command
{
    protected $signature = 'subscriptions:expire';

    protected $description = 'Expire premium subscriptions that have passed their end date.';

    public function handle(): int
    {
        $expiredSubscriptions = Langganan::with('user')
            ->where('status', 'active')
            ->whereDate('end_date', '<', now()->toDateString())
            ->get();

        DB::transaction(function () use ($expiredSubscriptions) {
            foreach ($expiredSubscriptions as $subscription) {
                $subscription->update(['status' => 'expired']);

                $hasOtherActiveSubscription = Langganan::where('user_id', $subscription->user_id)
                    ->where('id', '!=', $subscription->id)
                    ->where('status', 'active')
                    ->whereDate('end_date', '>=', now()->toDateString())
                    ->exists();

                if (! $hasOtherActiveSubscription) {
                    $subscription->user?->update(['subscription_status' => 'free']);
                }
            }
        });

        $this->info($expiredSubscriptions->count() . ' subscription(s) expired.');

        return self::SUCCESS;
    }
}
