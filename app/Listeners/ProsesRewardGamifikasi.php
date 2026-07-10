<?php

namespace App\Listeners;

use App\Events\KuisSelesai;
use App\Services\XpService;
use App\Services\StreakService;
use App\Services\PencapaianService;
use Illuminate\Events\Dispatcher;

class ProsesRewardGamifikasi
{
    protected $xpService;
    protected $streakService;
    protected $achievementService;

    public function __construct(XpService $xpService, StreakService $streakService, PencapaianService $achievementService)
    {
        $this->xpService = $xpService;
        $this->streakService = $streakService;
        $this->achievementService = $achievementService;
    }

    public function handleQuizCompleted(KuisSelesai $event)
    {
        $streakInfo = $this->streakService->updateStreak($event->user);
        
        $totalXp = $event->xpEarned + $streakInfo['bonus_xp'];
        $this->xpService->awardXP($event->user, $totalXp, 'quiz', $event->quizId, 'Penyelesaian Kuis');

        $newAchievements = $this->achievementService->evaluateAchievements($event->user, 'quiz');

        if (!empty($newAchievements)) {
            session()->flash('newAchievements', $newAchievements);
        }
    }

    public function subscribe(Dispatcher $events): void
    {
        $events->listen(
            KuisSelesai::class,
            [ProsesRewardGamifikasi::class, 'handleQuizCompleted']
        );
    }
}
