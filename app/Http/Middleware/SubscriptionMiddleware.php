<?php

namespace App\Http\Middleware;

use App\Models\Kuis;
use App\Services\AksesPremiumService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class SubscriptionMiddleware
{
    public function __construct(private AksesPremiumService $aksesPremium)
    {
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if (! $user || $user->role !== 'user') {
            return $next($request);
        }

        $module = null;

        if ($request->routeIs('user.quizzes.show')) {
            $quizParam = $request->route('quiz');
            $quiz = $quizParam instanceof Kuis
                ? $quizParam->loadMissing('module.level')
                : Kuis::with('module.level')->find($quizParam);

            $module = $quiz?->module;
        }

        if ($module && ! $this->aksesPremium->bolehAksesModul($user, $module)) {
            return redirect()
                ->route('pricing')
                ->with('error', 'Preview gratis hanya membuka materi dan kuis Week 1. Upgrade Premium untuk membuka Week berikutnya.');
        }

        return $next($request);
    }
}
