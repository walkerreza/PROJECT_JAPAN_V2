<?php

use App\Models\LogReward;
use App\Models\Pengguna;
use App\Services\LeaderboardService;
use App\Services\RingkasanProgresPenggunaService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

afterEach(function () {
    Carbon::setTestNow();
    Cache::flush();
});

test('weekly leaderboard uses rewards from the current Monday to Sunday period', function () {
    Carbon::setTestNow(Carbon::parse('2026-07-15 12:00:00', 'Asia/Jakarta'));

    $viewer = Pengguna::factory()->create(['role' => 'user', 'xp' => 500]);
    $leader = Pengguna::factory()->create(['role' => 'user', 'xp' => 1000]);
    $oldRewardUser = Pengguna::factory()->create(['role' => 'user', 'xp' => 900]);

    DB::table('reward_logs')->insert([
        'user_id' => $viewer->id,
        'source_type' => 'quiz',
        'source_id' => 101,
        'xp_amount' => 20,
        'description' => 'Kuis mingguan',
        'created_at' => Carbon::parse('2026-07-14 10:00:00', 'Asia/Jakarta'),
        'updated_at' => Carbon::parse('2026-07-14 10:00:00', 'Asia/Jakarta'),
    ]);
    DB::table('reward_logs')->insert([
        'user_id' => $leader->id,
        'source_type' => 'quiz',
        'source_id' => 102,
        'xp_amount' => 50,
        'description' => 'Kuis mingguan',
        'created_at' => Carbon::parse('2026-07-13 08:00:00', 'Asia/Jakarta'),
        'updated_at' => Carbon::parse('2026-07-13 08:00:00', 'Asia/Jakarta'),
    ]);
    DB::table('reward_logs')->insert([
        'user_id' => $oldRewardUser->id,
        'source_type' => 'quiz',
        'source_id' => 103,
        'xp_amount' => 99,
        'description' => 'Kuis lama',
        'created_at' => Carbon::parse('2026-07-12 23:59:59', 'Asia/Jakarta'),
        'updated_at' => Carbon::parse('2026-07-12 23:59:59', 'Asia/Jakarta'),
    ]);

    $payload = app(LeaderboardService::class)->payload($viewer, 'week', [
        ['name' => 'Bronze', 'min_xp' => 0, 'icon' => 'bronze_kabuto'],
    ]);

    expect($payload['period'])->toBe('week')
        ->and($payload['players'][0]['name'])->toBe($leader->username)
        ->and($payload['players'][0]['xp'])->toBe(50)
        ->and($payload['my_position']['rank'])->toBe(2)
        ->and($payload['my_position']['xp'])->toBe(20);
});

test('all time leaderboard uses accumulated user xp', function () {
    $viewer = Pengguna::factory()->create(['role' => 'user', 'xp' => 500]);
    $leader = Pengguna::factory()->create(['role' => 'user', 'xp' => 1000]);

    $payload = app(LeaderboardService::class)->payload($viewer, 'all', [
        ['name' => 'Bronze', 'min_xp' => 0, 'icon' => 'bronze_kabuto'],
    ]);

    expect($payload['period'])->toBe('all')
        ->and($payload['players'][0]['name'])->toBe($leader->username)
        ->and($payload['my_position']['rank'])->toBe(2)
        ->and($payload['my_position']['xp'])->toBe(500);
});

test('leaderboard snapshot is reused for at most one minute before it is refreshed', function () {
    $viewer = Pengguna::factory()->create(['role' => 'user', 'xp' => 100]);
    $leader = Pengguna::factory()->create(['role' => 'user', 'xp' => 200]);
    $leagues = [['name' => 'Bronze', 'min_xp' => 0, 'icon' => 'bronze_kabuto']];
    $service = app(LeaderboardService::class);

    $first = $service->payload($viewer, 'all', $leagues);
    $leader->update(['xp' => 500]);
    $cached = $service->payload($viewer, 'all', $leagues);

    expect($first['players'][0]['xp'])->toBe(200)
        ->and($cached['players'][0]['xp'])->toBe(200);

    Cache::forget('leaderboard:all:snapshot');

    expect($service->payload($viewer, 'all', $leagues)['players'][0]['xp'])->toBe(500);
});

test('progress summary keeps xp numeric and activity xp unformatted', function () {
    $user = Pengguna::factory()->create(['role' => 'user', 'xp' => 1234]);
    LogReward::create([
        'user_id' => $user->id,
        'source_type' => 'quiz',
        'source_id' => 201,
        'xp_amount' => 15,
        'description' => 'Kuis selesai',
    ]);

    $summary = app(RingkasanProgresPenggunaService::class)->summary($user);

    expect($summary['stats']['xp'])->toBe(1234)
        ->and($summary['recentActivity'][0]['xp'])->toBe(15)
        ->and($summary)->toHaveKey('next_learning');
});
