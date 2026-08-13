<?php

use App\Models\AnggotaKloter;
use App\Models\KloterBelajar;
use App\Models\LevelPembelajaran;
use App\Models\Modul;
use App\Models\Pengguna;
use App\Models\ProgramPembelajaran;
use App\Models\SesiKelasLive;
use Inertia\Testing\AssertableInertia as Assert;

function createLiveClassRoadmapFixture(): array
{
    $level = LevelPembelajaran::create([
        'level_name' => 'N3',
        'stage' => 301,
        'is_premium' => false,
    ]);
    $program = ProgramPembelajaran::create([
        'level_id' => $level->id,
        'title' => 'Program Live Class',
        'slug' => 'program-live-class',
        'status' => 'published',
        'sort_order' => 1,
    ]);
    $module = Modul::create([
        'level_id' => $level->id,
        'program_pembelajaran_id' => $program->id,
        'title' => 'Minggu Live Class',
        'week_number' => 1,
        'status' => 'published',
    ]);
    $mentor = Pengguna::factory()->create([
        'role' => 'admin',
        'admin_scope' => Pengguna::ADMIN_SCOPE_KLOTER,
        'status' => 'active',
    ]);
    $globalAdmin = Pengguna::factory()->create([
        'role' => 'admin',
        'admin_scope' => Pengguna::ADMIN_SCOPE_GLOBAL,
        'status' => 'active',
    ]);
    $student = Pengguna::factory()->create(['role' => 'user', 'status' => 'active']);
    $outsider = Pengguna::factory()->create(['role' => 'user', 'status' => 'active']);
    $kloter = KloterBelajar::create([
        'program_pembelajaran_id' => $program->id,
        'admin_id' => $mentor->id,
        'nama' => 'Kloter Live Class',
        'kode' => 'KLT-LIVE-CLASS',
        'tanggal_mulai' => now()->subDay()->toDateString(),
        'tanggal_selesai' => now()->addMonth()->toDateString(),
        'status' => 'active',
    ]);

    AnggotaKloter::create([
        'kloter_belajar_id' => $kloter->id,
        'user_id' => $student->id,
        'joined_at' => now(),
        'status' => 'active',
    ]);

    return compact('program', 'module', 'mentor', 'globalAdmin', 'student', 'outsider', 'kloter');
}

it('lets the assigned mentor schedule a class without starting LiveKit', function () {
    $fixture = createLiveClassRoadmapFixture();
    $scheduledAt = now()->addDay()->startOfHour();

    $this->actingAs($fixture['mentor'])
        ->post(route('admin.live-classes.store'), [
            'kloter_belajar_id' => $fixture['kloter']->id,
            'presentation_deck_id' => null,
            'action' => 'schedule',
            'scheduled_at' => $scheduledAt->format('Y-m-d H:i:s'),
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('live_class_sessions', [
        'kloter_belajar_id' => $fixture['kloter']->id,
        'mentor_id' => $fixture['mentor']->id,
        'status' => 'scheduled',
        'started_at' => null,
    ]);
});

it('allows a global admin to schedule and mentor any active kloter', function () {
    $fixture = createLiveClassRoadmapFixture();

    $this->actingAs($fixture['globalAdmin'])
        ->post(route('admin.live-classes.store'), [
            'kloter_belajar_id' => $fixture['kloter']->id,
            'presentation_deck_id' => null,
            'action' => 'schedule',
            'scheduled_at' => now()->addDay()->format('Y-m-d H:i:s'),
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('live_class_sessions', [
        'kloter_belajar_id' => $fixture['kloter']->id,
        'mentor_id' => $fixture['globalAdmin']->id,
        'status' => 'scheduled',
    ]);
});

it('denies student media tokens until the scheduled class is live', function () {
    $fixture = createLiveClassRoadmapFixture();
    $session = SesiKelasLive::create([
        'program_pembelajaran_id' => $fixture['program']->id,
        'kloter_belajar_id' => $fixture['kloter']->id,
        'mentor_id' => $fixture['mentor']->id,
        'room_name' => 'roadmap-scheduled-room',
        'join_code' => 'ROADMAPLIVE1',
        'status' => 'scheduled',
        'stage_mode' => 'board',
        'scheduled_at' => now()->addHour(),
    ]);

    $this->actingAs($fixture['student'])
        ->post(route('user.live-classes.token', $session->join_code))
        ->assertStatus(409);
});

it('starts a scheduled class idempotently from the mentor page', function () {
    $fixture = createLiveClassRoadmapFixture();
    $session = SesiKelasLive::create([
        'program_pembelajaran_id' => $fixture['program']->id,
        'kloter_belajar_id' => $fixture['kloter']->id,
        'mentor_id' => $fixture['mentor']->id,
        'room_name' => 'roadmap-start-room',
        'join_code' => 'ROADMAPLIVE2',
        'status' => 'scheduled',
        'stage_mode' => 'board',
        'scheduled_at' => now()->addHour(),
    ]);

    $this->actingAs($fixture['mentor'])
        ->post(route('admin.live-classes.start', $session))
        ->assertRedirect(route('admin.live-classes.show', $session));

    $this->actingAs($fixture['mentor'])
        ->post(route('admin.live-classes.start', $session))
        ->assertRedirect(route('admin.live-classes.show', $session));

    expect($session->fresh()->status)->toBe('live')
        ->and($session->fresh()->started_at)->not->toBeNull();
});

it('shows the scheduled roadmap node only to an active kloter member', function () {
    $fixture = createLiveClassRoadmapFixture();
    SesiKelasLive::create([
        'program_pembelajaran_id' => $fixture['program']->id,
        'kloter_belajar_id' => $fixture['kloter']->id,
        'mentor_id' => $fixture['mentor']->id,
        'room_name' => 'roadmap-visible-room',
        'join_code' => 'ROADMAPLIVE3',
        'status' => 'scheduled',
        'stage_mode' => 'board',
        'scheduled_at' => now()->addHour(),
    ]);

    $this->actingAs($fixture['student'])
        ->get(route('user.modul.program', $fixture['program']->slug))
        ->assertInertia(fn (Assert $page) => $page
            ->component('User/Modul/DaftarModul')
            ->where('weeks.0.live_session.status', 'scheduled')
            ->where('weeks.0.live_session.join_url', null));

    $this->actingAs($fixture['outsider'])
        ->get(route('user.modul.program', $fixture['program']->slug))
        ->assertInertia(fn (Assert $page) => $page
            ->component('User/Modul/DaftarModul')
            ->where('weeks.0.live_session', null));
});
