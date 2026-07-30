<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class ChartDataService
{
    private const PERIODS = [7, 30, 90];

    public function resolvePeriod(Request $request): int
    {
        $period = $request->integer('period');

        return in_array($period, self::PERIODS, true) ? $period : 30;
    }

    /**
     * @param array<string, Collection<string, int|float>> $datasets
     */
    public function dailySeries(int $period, array $datasets): array
    {
        return collect(range($period - 1, 0))
            ->map(function (int $daysAgo) use ($datasets) {
                $date = now()->startOfDay()->subDays($daysAgo);
                $key = $date->toDateString();
                $row = [
                    'date' => $key,
                    'label' => $date->translatedFormat('d M'),
                ];

                foreach ($datasets as $name => $values) {
                    $row[$name] = (float) ($values->get($key) ?? 0);
                }

                return $row;
            })
            ->values()
            ->all();
    }

    public function fromDate(int $period): Carbon
    {
        return now()->startOfDay()->subDays($period - 1);
    }
}
