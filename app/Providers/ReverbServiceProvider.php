<?php

namespace App\Providers;

use Laravel\Reverb\ApplicationManagerServiceProvider;
use Laravel\Reverb\Contracts\Logger;
use Laravel\Reverb\Loggers\NullLogger;
use Laravel\Reverb\ReverbServiceProvider as BaseReverbServiceProvider;
use Laravel\Reverb\ServerProviderManager;

class ReverbServiceProvider extends BaseReverbServiceProvider
{
    public function register(): void
    {
        $this->app->register(ApplicationManagerServiceProvider::class);

        $this->mergeConfigFrom(
            base_path('vendor/laravel/reverb/config/reverb.php'),
            'reverb'
        );

        $this->app->instance(Logger::class, new NullLogger);
        $this->app->singleton(ServerProviderManager::class);
        $this->app->make(ServerProviderManager::class)->register();

        // Reverb 1.11 registers a vendor-owned `composer dev` shortcut that
        // Laravel 13 rejects. The actual reverb:start command is unaffected.
    }
}
