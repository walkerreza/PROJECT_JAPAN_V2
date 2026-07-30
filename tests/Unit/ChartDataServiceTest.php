<?php

namespace Tests\Unit;

use App\Services\ChartDataService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ChartDataServiceTest extends TestCase
{
    public function test_it_accepts_only_supported_chart_periods(): void
    {
        $service = app(ChartDataService::class);

        $this->assertSame(7, $service->resolvePeriod(Request::create('/', 'GET', ['period' => 7])));
        $this->assertSame(30, $service->resolvePeriod(Request::create('/', 'GET', ['period' => 14])));
    }

    public function test_it_fills_missing_days_in_a_daily_series(): void
    {
        Carbon::setTestNow('2026-07-30 10:00:00');

        $series = app(ChartDataService::class)->dailySeries(3, [
            'xp' => collect([
                '2026-07-28' => 10,
                '2026-07-30' => 35,
            ]),
        ]);

        $this->assertSame(['2026-07-28', '2026-07-29', '2026-07-30'], array_column($series, 'date'));
        $this->assertSame([10.0, 0.0, 35.0], array_column($series, 'xp'));

        Carbon::setTestNow();
    }
}
