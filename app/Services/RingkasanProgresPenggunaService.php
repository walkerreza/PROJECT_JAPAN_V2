<?php

namespace App\Services;

use App\Models\PengerjaanKuis;
use App\Models\LevelPembelajaran;
use App\Models\Progres;
use App\Models\Kuis;
use App\Models\Modul;
use App\Models\LogReward;
use App\Models\Pengguna;
use App\Models\ProgramPembelajaran;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class RingkasanProgresPenggunaService
{
    public function summary(Pengguna $user): array
    {
        return Cache::remember(
            $this->cacheKey($user),
            now()->addSeconds(45),
            fn () => $this->buildSummary($user)
        );
    }

    public function forget(Pengguna $user): void
    {
        Cache::forget($this->cacheKey($user));
    }

    private function buildSummary(Pengguna $user): array
    {
        $completedModuleIds = Progres::where('user_id', $user->id)
            ->whereNotNull('completed_at')
            ->distinct()
            ->pluck('module_id')
            ->all();
        $attemptedQuizIds = PengerjaanKuis::where('user_id', $user->id)->distinct()->pluck('quiz_id')->all();
        $modulesDone = count($completedModuleIds);
        $quizzesDone = count($attemptedQuizIds);
        $completedModules = empty($completedModuleIds)
            ? collect()
            : Modul::whereIn('id', $completedModuleIds)->get(['id', 'title']);
        $completedQuizzes = empty($attemptedQuizIds)
            ? collect()
            : Kuis::with('module:id,title')->whereIn('id', $attemptedQuizIds)->get(['id', 'module_id', 'type']);

        return [
            'stats' => [
                'xp' => (int) $user->xp,
                'streak' => (int) $user->streak_count,
                'lessonsDone' => $modulesDone,
                'quizzesDone' => $quizzesDone,
            ],
            'weekActivity' => $this->weekActivity($user)->values()->all(),
            'jlptJourney' => $this->jlptJourney($completedModuleIds)->values()->all(),
            'recentActivity' => $this->recentActivity($user)->values()->all(),
            'skills' => $this->topicActivity($modulesDone, $quizzesDone, $completedModules, $completedQuizzes),
            'next_learning' => $this->nextLearning($user, $completedModuleIds),
        ];
    }

    private function cacheKey(Pengguna $user): string
    {
        return "user-progress-summary:v2:{$user->id}";
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

        $today = now();
        $days = collect(range(6, 1))
            ->map(fn ($daysAgo) => now()->subDays($daysAgo))
            ->push($today)
            ->map(function ($date, $index) use ($xpByDate) {
                $key = $date->toDateString();
                $xp = (int) ($xpByDate[$key] ?? 0);

                return [
                    'day' => $date->translatedFormat('D'),
                    'xp' => $xp,
                    'today' => $index === 6,
                ];
            });

        $peakXp = max(1, (int) $days->max('xp'));

        return $days->map(fn (array $day) => [
            ...$day,
            'height' => $day['xp'] > 0 ? min(100, max(10, ($day['xp'] / $peakXp) * 100)) . '%' : '0%',
        ]);
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
                'xp' => (int) $log->xp_amount,
                'time' => $log->created_at->diffForHumans(),
                'type' => $log->source_type,
            ]);
    }

    private function nextLearning(Pengguna $user, array $completedModuleIds): ?array
    {
        $access = app(AksesPremiumService::class);
        $kloterBelajar = app(KloterBelajarService::class);
        $completed = array_flip($completedModuleIds);

        $programs = ProgramPembelajaran::query()
            ->with(['modules' => fn ($query) => $query
                ->where('status', 'published')
                ->orderBy('week_number')
                ->orderBy('id')])
            ->where('status', 'published')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->filter(fn (ProgramPembelajaran $program) => $access->punyaAksesKelas($user, $program->id));

        foreach ($programs as $program) {
            $roadmapUrl = route('user.modul.program', $program->slug);
            $kloter = $kloterBelajar->kloterAktifUser($user, $program->id);

            if (! $kloter) {
                return [
                    'state' => 'waiting',
                    'title' => $program->title,
                    'message' => 'Kelas aktif, menunggu penempatan kloter belajar.',
                    'url' => $roadmapUrl,
                    'action_label' => 'Lihat roadmap',
                ];
            }

            $module = $program->modules
                ->filter(fn (Modul $item) => $access->bolehAksesModul($user, $item))
                ->first(fn (Modul $item) => ! isset($completed[$item->id]));

            if ($module) {
                return [
                    'state' => 'ready',
                    'title' => $module->title,
                    'program_title' => $program->title,
                    'week_number' => $module->week_number,
                    'message' => 'Lanjutkan dari modul yang tersedia berikutnya.',
                    'url' => $roadmapUrl,
                    'action_label' => 'Lanjutkan roadmap',
                ];
            }
        }

        return null;
    }

    private function topicActivity(int $modulesDone, int $quizzesDone, Collection $modules, Collection $quizzes): array
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
