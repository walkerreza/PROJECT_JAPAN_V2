<?php

use App\Models\Kuis;
use App\Models\HariModul;
use App\Models\AnggotaKloter;
use App\Models\KloterBelajar;
use App\Models\Langganan;
use App\Models\LevelPembelajaran;
use App\Models\LogReward;
use App\Models\Modul;
use App\Models\PengerjaanKuis;
use App\Models\Pengguna;
use App\Models\PaketPembayaran;
use App\Models\ProgramPembelajaran;
use App\Models\UmpanBalikPembelajaran;
use Inertia\Testing\AssertableInertia as Assert;

function createLearningFeedbackFixture(): array
{
    $level = LevelPembelajaran::create([
        'level_name' => 'FB N3',
        'stage' => 91,
        'is_premium' => false,
    ]);
    $program = ProgramPembelajaran::create([
        'level_id' => $level->id,
        'title' => 'Kelas Feedback',
        'slug' => 'kelas-feedback',
        'status' => 'published',
        'sort_order' => 1,
    ]);
    $module = Modul::create([
        'level_id' => $level->id,
        'program_pembelajaran_id' => $program->id,
        'title' => 'Week Feedback',
        'week_number' => 1,
        'status' => 'published',
    ]);
    $quiz = Kuis::create([
        'module_id' => $module->id,
        'type' => 'multiple_choice',
        'status' => 'published',
    ]);

    return compact('program', 'module', 'quiz');
}

it('returns a daily goal payload from reward and completed session aggregates', function () {
    $user = Pengguna::factory()->create(['role' => 'user']);
    $fixture = createLearningFeedbackFixture();
    $day = HariModul::create([
        'module_id' => $fixture['module']->id,
        'day_number' => 1,
        'title' => 'Hari Target',
        'status' => 'published',
    ]);
    $plan = PaketPembayaran::create([
        'name' => 'Paket Feedback',
        'slug' => 'paket-feedback',
        'scope_type' => 'program',
        'program_pembelajaran_id' => $fixture['program']->id,
        'price' => 79000,
        'duration_days' => 30,
        'is_active' => true,
    ]);
    $subscription = Langganan::create([
        'user_id' => $user->id,
        'payment_plan_id' => $plan->id,
        'scope_type' => 'program',
        'program_pembelajaran_id' => $fixture['program']->id,
        'status' => 'active',
        'start_date' => today(),
        'end_date' => today()->addDays(30),
    ]);
    $kloter = KloterBelajar::create([
        'program_pembelajaran_id' => $fixture['program']->id,
        'nama' => 'Kloter Feedback',
        'kode' => 'FB-001',
        'tanggal_mulai' => today(),
        'is_default' => true,
        'status' => 'active',
    ]);
    AnggotaKloter::create([
        'kloter_belajar_id' => $kloter->id,
        'user_id' => $user->id,
        'subscription_id' => $subscription->id,
        'joined_at' => now(),
        'status' => 'active',
    ]);

    LogReward::create([
        'user_id' => $user->id,
        'source_type' => 'quiz',
        'source_id' => $fixture['quiz']->id,
        'xp_amount' => 35,
        'description' => 'Target harian',
    ]);
    PengerjaanKuis::create([
        'user_id' => $user->id,
        'quiz_id' => $fixture['quiz']->id,
        'status' => 'completed',
        'score' => 100,
        'xp_earned' => 35,
        'started_at' => now()->subMinutes(3),
        'completed_at' => now(),
        'attempted_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('user.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('User/Beranda/Beranda')
            ->where('dailyGoal.xp_target', 30)
            ->where('dailyGoal.xp_earned', 35)
            ->where('dailyGoal.sessions_done', true)
            ->where('dailyGoal.completed', true)
            ->where('learningDashboard.next_module.current_day.id', $day->id));
});

it('stores one feedback record per quiz session per day', function () {
    $user = Pengguna::factory()->create(['role' => 'user']);
    $fixture = createLearningFeedbackFixture();
    PengerjaanKuis::create([
        'user_id' => $user->id,
        'quiz_id' => $fixture['quiz']->id,
        'status' => 'completed',
        'score' => 100,
        'xp_earned' => 35,
        'started_at' => now()->subMinutes(3),
        'completed_at' => now(),
        'attempted_at' => now(),
    ]);

    $this->actingAs($user)
        ->postJson(route('user.quizzes.feedback.store', $fixture['quiz']), [
            'rating' => 'repeat',
            'continue_learning' => false,
        ])
        ->assertOk()
        ->assertJsonPath('feedback.rating', 'repeat');

    $this->actingAs($user)
        ->postJson(route('user.quizzes.feedback.store', $fixture['quiz']), [
            'rating' => 'just_right',
            'continue_learning' => true,
        ])
        ->assertOk()
        ->assertJsonPath('feedback.rating', 'just_right');

    expect(UmpanBalikPembelajaran::query()->count())->toBe(1)
        ->and(UmpanBalikPembelajaran::query()->value('continue_learning'))->toBeTrue();
});
