<?php

namespace App\Services;

use App\Models\PengerjaanKuis;
use App\Models\LevelPembelajaran;
use App\Models\Progres;
use App\Models\Kuis;
use App\Models\Modul;
use App\Models\LogReward;
use App\Models\Pengguna;
use Illuminate\Support\Collection;

class RingkasanProgresPenggunaService
{
    public function summary(Pengguna $user): array
    {
        $completedModuleIds = Progres::where('user_id', $user->id)
            ->whereNotNull('completed_at')
            ->pluck('module_id')
            ->all();
        $attemptedQuizIds = PengerjaanKuis::where('user_id', $user->id)->pluck('quiz_id')->unique()->all();
        $modulesDone = count($completedModuleIds);
        $quizzesDone = count($attemptedQuizIds);
        $completedModules = Modul::whereIn('id', $completedModuleIds)->get(['id', 'title']);
        $completedQuizzes = Kuis::with('module:id,title')->whereIn('id', $attemptedQuizIds)->get(['id', 'module_id', 'type']);

        return [
            'stats' => [
                'xp' => number_format($user->xp),
                'streak' => $user->streak_count,
                'lessonsDone' => $modulesDone,
                'quizzesDone' => $quizzesDone,
            ],
            'weekActivity' => $this->weekActivity($user),
            'jlptJourney' => $this->jlptJourney($completedModuleIds),
            'recentActivity' => $this->recentActivity($user),
            'skills' => $this->skills($modulesDone, $quizzesDone, $completedModules, $completedQuizzes),
        ];
    }

    private function weekActivity(Pengguna $user): Collection
    {
        $start = now()->subDays(6)->startOfDay();
        $end = now()->endOfDay();
        $xpByDate = LogReward::where('user_id', $user->id)
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('DATE(created_at) as activity_date, SUM(xp_amount) as total_xp')
            ->groupByRaw('DATE(created_at)')
            ->pluck('total_xp', 'activity_date');

        return collect(range(6, 1))
            ->map(fn ($daysAgo) => now()->subDays($daysAgo))
            ->push(now())
            ->map(function ($date, $index) use ($xpByDate) {
                $key = $date->toDateString();
                $xp = (int) ($xpByDate[$key] ?? 0);

                return [
                    'day' => $date->translatedFormat('D'),
                    'xp' => $xp,
                    'height' => $xp > 0 ? min(100, max(10, ($xp / 500) * 100)) . '%' : '0%',
                    'today' => $index === 6,
                ];
            });
    }

    private function jlptJourney(array $completedModuleIds): Collection
    {
        $completed = array_flip($completedModuleIds);

        return LevelPembelajaran::with(['modules:id,level_id'])
            ->orderBy('stage')
            ->get()
            ->map(function (LevelPembelajaran $level) use ($completed) {
                $moduleIds = $level->modules->pluck('id');
                $totalModules = $moduleIds->count();
                $completedCount = $moduleIds->filter(fn ($id) => isset($completed[$id]))->count();
                $pct = $totalModules > 0 ? round(($completedCount / $totalModules) * 100) : 0;

                return [
                    'level' => $level->level_name,
                    'pct' => $pct,
                    'done' => $pct === 100 && $totalModules > 0,
                ];
            });
    }

    private function recentActivity(Pengguna $user): Collection
    {
        return LogReward::where('user_id', $user->id)
            ->latest()
            ->take(5)
            ->get()
            ->map(fn (LogReward $log) => [
                'text' => $log->description,
                'xp' => '+' . $log->xp_amount . ' XP',
                'time' => $log->created_at->diffForHumans(),
                'type' => $log->source_type,
            ]);
    }

    private function skills(int $modulesDone, int $quizzesDone, Collection $modules, Collection $quizzes): array
    {
        $grammarCount = $modulesDone * 5;
        $kanjiCount = $modulesDone * 2;
        $vocabCount = $modulesDone * 8;
        $listenCount = $quizzesDone * 5;
        $readCount = ($modulesDone * 3) + ($quizzesDone * 3);

        $grammarCount += $modules->filter(fn ($module) => $this->titleContains($module->title, ['grammar', 'partikel', 'pola']))->count() * 15;
        $kanjiCount += $modules->filter(fn ($module) => $this->titleContains($module->title, ['kanji']))->count() * 15;
        $vocabCount += $modules->filter(fn ($module) => $this->titleContains($module->title, ['vocab', 'kosakata']))->count() * 15;
        $listenCount += $modules->filter(fn ($module) => $this->titleContains($module->title, ['listen', 'audio']))->count() * 20;
        $readCount += $modules->filter(fn ($module) => $this->titleContains($module->title, ['read', 'baca', 'dokkai']))->count() * 15;

        $grammarCount += $quizzes->filter(fn ($quiz) => $this->titleContains($this->quizSkillText($quiz), ['grammar', 'partikel']))->count() * 10;
        $vocabCount += $quizzes->filter(fn ($quiz) => $this->titleContains($this->quizSkillText($quiz), ['vocab', 'kosakata']))->count() * 10;
        $kanjiCount += $quizzes->filter(fn ($quiz) => $this->titleContains($this->quizSkillText($quiz), ['kanji']))->count() * 10;

        return [
            ['label' => 'Grammar', 'value' => min(100, $grammarCount), 'color' => 'bg-red-500'],
            ['label' => 'Kanji', 'value' => min(100, $kanjiCount), 'color' => 'bg-blue-500'],
            ['label' => 'Kosakata', 'value' => min(100, $vocabCount), 'color' => 'bg-green-500'],
            ['label' => 'Listening', 'value' => min(100, $listenCount), 'color' => 'bg-amber-500'],
            ['label' => 'Reading', 'value' => min(100, $readCount), 'color' => 'bg-purple-500'],
        ];
    }

    private function titleContains(string $title, array $needles): bool
    {
        foreach ($needles as $needle) {
            if (stripos($title, $needle) !== false) {
                return true;
            }
        }

        return false;
    }

    private function quizSkillText(Kuis $quiz): string
    {
        return trim($quiz->type . ' ' . ($quiz->module?->title ?? ''));
    }
}
