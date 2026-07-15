<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('subscriptions:expire')->dailyAt('00:10');
Schedule::command('presentations:cleanup-imports --days=14')->dailyAt('00:30');
Schedule::command('logs:prune --days=90')->dailyAt('00:45');
Schedule::command('payments:reconcile-pending --hours=48')->everyTenMinutes()->withoutOverlapping();
Schedule::command('news:publish-scheduled')->everyMinute()->withoutOverlapping();
