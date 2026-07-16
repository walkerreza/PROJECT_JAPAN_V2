<?php

namespace App\Services;

use App\Models\Pengguna;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class LeaderboardService
{
    public const PERIOD_WEEK = 'week';
    public const PERIOD_ALL = 'all';

    public function payload(Pengguna $viewer, ?string $requestedPeriod, array $leagues): array
    {
        $period = $this->normalizePeriod($requestedPeriod);
        $snapshot = Cache::remember(
            $this->snapshotCacheKey($period),
            now()->addSeconds(60),
            fn (): array => $this->snapshot($period, $leagues),
        );

        $myPosition = Cache::remember(
            $this->positionCacheKey($period, $viewer),
            now()->addSeconds(60),
            fn (): ?array => $this->positionFor($period, $leagues, $viewer),
        );

        return [
            'period' => $period,
            'players' => $this->publicPlayers($snapshot['players'], $viewer),
            'leagues' => $leagues,
            'my_position' => $myPosition,
        ];
    }

    public function normalizePeriod(?string $period): string
    {
        return in_array($period, [self::PERIOD_WEEK, self::PERIOD_ALL], true)
            ? $period
            : self::PERIOD_WEEK;
    }

    private function rankingQuery(string $period): Builder
    {
        $query = Pengguna::query()
            ->where('users.role', 'user')
            ->select([
                'users.id',
                'users.username',
                'users.level',
                'users.xp',
                'users.streak_count',
            ]);

        if ($period === self::PERIOD_ALL) {
            return $query->selectRaw('users.xp as score');
        }

        $now = now('Asia/Jakarta');
        $rewards = DB::table('reward_logs')
            ->select('user_id', DB::raw('COALESCE(SUM(xp_amount), 0) as period_xp'))
            ->whereBetween('created_at', [
                $now->copy()->startOfWeek(CarbonInterface::MONDAY),
                $now->copy()->endOfWeek(CarbonInterface::SUNDAY),
            ])
            ->groupBy('user_id');

        return $query
            ->leftJoinSub($rewards, 'period_rewards', fn ($join) => $join->on('users.id', '=', 'period_rewards.user_id'))
            ->selectRaw('COALESCE(period_rewards.period_xp, 0) as score');
    }

    private function snapshot(string $period, array $leagues): array
    {
        $scoreExpression = $this->scoreExpression($period);
        $ranking = $this->rankingQuery($period);

        return ['players' => $this->topPlayers($ranking, $scoreExpression, $leagues)];
    }

    private function topPlayers(Builder $ranking, string $scoreExpression, array $leagues): array
    {
        return (clone $ranking)
            ->orderByDesc(DB::raw($scoreExpression))
            ->orderBy('users.id')
            ->limit(50)
            ->get()
            ->values()
            ->map(fn (Pengguna $user, int $index) => ['user_id' => $user->id] + $this->playerPayload($user, $index + 1, $leagues, false))
            ->all();
    }

    private function publicPlayers(array $players, Pengguna $viewer): array
    {
        return array_map(function (array $player) use ($viewer): array {
            $isMe = (int) $player['user_id'] === $viewer->id;
            unset($player['user_id']);

            return array_merge($player, ['isMe' => $isMe]);
        }, $players);
    }

    private function positionFor(string $period, array $leagues, Pengguna $viewer): ?array
    {
        $scoreExpression = $this->scoreExpression($period);
        $ranking = $this->rankingQuery($period);
        $viewerRow = (clone $ranking)->where('users.id', $viewer->id)->first();

        return $viewerRow
            ? $this->myPosition($ranking, $scoreExpression, $viewerRow, $leagues, $viewer)
            : null;
    }

    private function myPosition(
        Builder $ranking,
        string $scoreExpression,
        Pengguna $viewerRow,
        array $leagues,
        Pengguna $viewer
    ): array {
        $score = (int) $viewerRow->score;
        $above = $this->aboveQuery($ranking, $scoreExpression, $score, $viewer);
        $rank = (clone $above)->count() + 1;
        $nearestAbove = (clone $above)
            ->orderByRaw("{$scoreExpression} asc")
            ->orderByDesc('users.id')
            ->first();

        return $this->playerPayload($viewerRow, $rank, $leagues, true) + [
            'xp_to_next_rank' => $nearestAbove ? max(0, (int) $nearestAbove->score - $score + 1) : null,
            'next_rank_name' => $nearestAbove?->username,
        ];
    }

    private function aboveQuery(Builder $ranking, string $scoreExpression, int $score, Pengguna $viewer): Builder
    {
        return (clone $ranking)->where(function (Builder $query) use ($scoreExpression, $score, $viewer) {
            $query->whereRaw("{$scoreExpression} > ?", [$score])
                ->orWhere(function (Builder $tie) use ($scoreExpression, $score, $viewer) {
                    $tie->whereRaw("{$scoreExpression} = ?", [$score])
                        ->where('users.id', '<', $viewer->id);
                });
        });
    }

    private function scoreExpression(string $period): string
    {
        return $period === self::PERIOD_ALL
            ? 'users.xp'
            : 'COALESCE(period_rewards.period_xp, 0)';
    }

    private function snapshotCacheKey(string $period): string
    {
        return "leaderboard:{$period}:snapshot";
    }

    private function positionCacheKey(string $period, Pengguna $viewer): string
    {
        return "leaderboard:{$period}:position:{$viewer->id}";
    }

    private function playerPayload(Pengguna $user, int $rank, array $leagues, bool $isMe): array
    {
        return [
            'rank' => $rank,
            'name' => $user->username,
            'level' => 'Level ' . $user->level,
            'xp' => (int) $user->score,
            'total_xp' => (int) $user->xp,
            'streak' => (int) $user->streak_count,
            'isMe' => $isMe,
            'league' => $this->leagueFor((int) $user->xp, $leagues),
        ];
    }

    private function leagueFor(int $xp, array $leagues): array
    {
        $sortedLeagues = collect($leagues)->sortBy('min_xp')->values();

        return $sortedLeagues
            ->reverse()
            ->first(fn (array $league) => $xp >= (int) ($league['min_xp'] ?? 0))
            ?? $sortedLeagues->first()
            ?? ['name' => 'Bronze', 'min_xp' => 0, 'icon' => 'bronze_kabuto'];
    }
}
