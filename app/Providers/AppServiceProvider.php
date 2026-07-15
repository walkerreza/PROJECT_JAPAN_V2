<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        RateLimiter::for('access-keys', fn (Request $request) => Limit::perMinute(5)
            ->by(($request->user()?->id ?? 'guest').':'.$request->ip()));
        RateLimiter::for('payments-checkout', fn (Request $request) => Limit::perMinute(5)
            ->by((string) ($request->user()?->id ?? $request->ip())));
        RateLimiter::for('payments-sync', fn (Request $request) => Limit::perMinute(10)
            ->by((string) ($request->user()?->id ?? $request->ip())));
        RateLimiter::for('payments-cancel', fn (Request $request) => Limit::perMinute(3)
            ->by((string) ($request->user()?->id ?? $request->ip())));
        RateLimiter::for('learning-actions', fn (Request $request) => Limit::perMinute(60)
            ->by(($request->user()?->id ?? 'guest').':'.$request->ip()));
        RateLimiter::for('admin-imports', fn (Request $request) => Limit::perMinutes(10, 3)
            ->by(($request->user()?->id ?? 'guest').':'.$request->ip()));
        RateLimiter::for('admin-uploads', fn (Request $request) => Limit::perMinutes(10, 20)
            ->by(($request->user()?->id ?? 'guest').':'.$request->ip()));
        RateLimiter::for('guest-sensitive', fn (Request $request) => Limit::perMinute(5)
            ->by(strtolower((string) $request->input('email')).':'.$request->ip()));
    }
}
