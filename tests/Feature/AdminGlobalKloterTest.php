<?php

use App\Models\AnggotaKloter;
use App\Models\KloterBelajar;
use App\Models\Langganan;
use App\Models\LevelPembelajaran;
use App\Models\PaketPembayaran;
use App\Models\Pengguna;
use App\Models\ProgramPembelajaran;
use Inertia\Testing\AssertableInertia as Assert;

function createAdminGlobalKloterFixture(): array
{
    $level = LevelPembelajaran::create([
        'level_name' => 'N3 Scope',
        'stage' => 90,
        'is_premium' => true,
    ]);
    $programA = ProgramPembelajaran::create([
        'level_id' => $level->id,
        'title' => 'Program Scope A',
        'slug' => 'program-scope-a',
        'status' => 'published',
        'sort_order' => 1,
    ]);
    $programB = ProgramPembelajaran::create([
        'level_id' => $level->id,
        'title' => 'Program Scope B',
        'slug' => 'program-scope-b',
        'status' => 'published',
        'sort_order' => 2,
    ]);
    $globalAdmin = Pengguna::factory()->create([
        'username' => 'Global Admin',
        'role' => 'admin',
        'admin_scope' => Pengguna::ADMIN_SCOPE_GLOBAL,
        'status' => 'active',
    ]);
    $kloterAdmin = Pengguna::factory()->create([
        'username' => 'Kloter Admin A',
        'role' => 'admin',
        'admin_scope' => Pengguna::ADMIN_SCOPE_KLOTER,
        'status' => 'active',
    ]);
    $otherKloterAdmin = Pengguna::factory()->create([
        'username' => 'Kloter Admin B',
        'role' => 'admin',
        'admin_scope' => Pengguna::ADMIN_SCOPE_KLOTER,
        'status' => 'active',
    ]);
    $studentA = Pengguna::factory()->create(['role' => 'user', 'status' => 'active']);
    $studentB = Pengguna::factory()->create(['role' => 'user', 'status' => 'active']);
    $kloterA = KloterBelajar::create([
        'program_pembelajaran_id' => $programA->id,
        'admin_id' => $kloterAdmin->id,
        'nama' => 'Kloter Scope A',
        'kode' => 'KLT-SCOPE-A',
        'tanggal_mulai' => now()->subWeek()->toDateString(),
        'tanggal_selesai' => now()->addMonth()->toDateString(),
        'status' => 'active',
    ]);
    $kloterB = KloterBelajar::create([
        'program_pembelajaran_id' => $programB->id,
        'admin_id' => $otherKloterAdmin->id,
        'nama' => 'Kloter Scope B',
        'kode' => 'KLT-SCOPE-B',
        'tanggal_mulai' => now()->subWeek()->toDateString(),
        'tanggal_selesai' => now()->addMonth()->toDateString(),
        'status' => 'active',
    ]);

    foreach ([[$kloterA, $studentA], [$kloterB, $studentB]] as [$kloter, $student]) {
        AnggotaKloter::create([
            'kloter_belajar_id' => $kloter->id,
            'user_id' => $student->id,
            'joined_at' => now(),
            'status' => 'active',
        ]);
    }

    return compact(
        'level',
        'programA',
        'programB',
        'globalAdmin',
        'kloterAdmin',
        'otherKloterAdmin',
        'studentA',
        'studentB',
        'kloterA',
        'kloterB'
    );
}

it('keeps shared content routes available to global and kloter admins', function () {
    $fixture = createAdminGlobalKloterFixture();

    $this->actingAs($fixture['globalAdmin'])
        ->get(route('admin.modules.index'))
        ->assertOk();

    $this->actingAs($fixture['kloterAdmin'])
        ->get(route('admin.modules.index'))
        ->assertOk();
});

it('shows every student to global admin and only assigned students to kloter admin', function () {
    $fixture = createAdminGlobalKloterFixture();

    $this->actingAs($fixture['globalAdmin'])
        ->get(route('admin.users'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/DataUser/DataUser')
            ->where('adminScope', Pengguna::ADMIN_SCOPE_GLOBAL)
            ->has('students.data', 2)
            ->has('kloters', 2));

    $this->actingAs($fixture['kloterAdmin'])
        ->get(route('admin.users'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/DataUser/DataUser')
            ->where('adminScope', Pengguna::ADMIN_SCOPE_KLOTER)
            ->has('students.data', 1)
            ->where('students.data.0.id', $fixture['studentA']->id)
            ->has('kloters', 1));
});

it('rejects student and cohort access outside a kloter admin assignment', function () {
    $fixture = createAdminGlobalKloterFixture();

    $this->actingAs($fixture['kloterAdmin'])
        ->get(route('admin.users.show', $fixture['studentB']))
        ->assertForbidden();

    $this->actingAs($fixture['kloterAdmin'])
        ->get(route('admin.users', ['kloter' => $fixture['kloterB']->id]))
        ->assertNotFound();

    $this->actingAs($fixture['kloterAdmin'])
        ->patch(route('admin.kloters.schedule.update', $fixture['kloterB']), [
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_selesai' => now()->addMonth()->toDateString(),
        ])
        ->assertForbidden();
});

it('returns an empty student scope when a kloter admin has no assignment', function () {
    createAdminGlobalKloterFixture();
    $unassigned = Pengguna::factory()->create([
        'role' => 'admin',
        'admin_scope' => Pengguna::ADMIN_SCOPE_KLOTER,
        'status' => 'active',
    ]);

    $this->actingAs($unassigned)
        ->get(route('admin.users'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/DataUser/DataUser')
            ->has('students.data', 0)
            ->has('kloters', 0));
});

it('lets an assigned admin update schedule and manage roster without deleting access', function () {
    $fixture = createAdminGlobalKloterFixture();
    $candidate = Pengguna::factory()->create(['role' => 'user', 'status' => 'active']);
    $plan = PaketPembayaran::create([
        'name' => 'Program Scope A',
        'slug' => 'program-scope-a-plan',
        'scope_type' => 'program',
        'program_pembelajaran_id' => $fixture['programA']->id,
        'price' => 10000,
        'duration_days' => 30,
        'is_active' => true,
    ]);
    $subscription = Langganan::create([
        'user_id' => $candidate->id,
        'payment_plan_id' => $plan->id,
        'scope_type' => 'program',
        'program_pembelajaran_id' => $fixture['programA']->id,
        'status' => 'active',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'auto_renew' => false,
    ]);

    $this->actingAs($fixture['kloterAdmin'])
        ->patch(route('admin.kloters.schedule.update', $fixture['kloterA']), [
            'tanggal_mulai' => now()->addDay()->toDateString(),
            'tanggal_selesai' => now()->addMonths(2)->toDateString(),
        ])
        ->assertRedirect();

    $this->actingAs($fixture['kloterAdmin'])
        ->post(route('admin.kloters.users.store', $fixture['kloterA']), [
            'user_id' => $candidate->id,
        ])
        ->assertRedirect();

    $membership = AnggotaKloter::where('kloter_belajar_id', $fixture['kloterA']->id)
        ->where('user_id', $candidate->id)
        ->firstOrFail();

    expect($membership->status)->toBe('active')
        ->and($subscription->fresh()->kloter_belajar_id)->toBe($fixture['kloterA']->id);

    $this->actingAs($fixture['kloterAdmin'])
        ->delete(route('admin.kloters.users.destroy', [$fixture['kloterA'], $candidate]))
        ->assertRedirect();

    expect($membership->fresh()->status)->toBe('removed')
        ->and($subscription->fresh()->status)->toBe('active');
});

it('allows superadmin to provision scoped admins and lists only kloter admins as instructors', function () {
    $fixture = createAdminGlobalKloterFixture();
    $superadmin = Pengguna::factory()->create([
        'role' => 'superadmin',
        'admin_scope' => null,
        'status' => 'active',
    ]);

    $this->actingAs($superadmin)
        ->post(route('superadmin.admins.store'), [
            'username' => 'Admin Kloter Baru',
            'email' => 'admin-kloter-baru@example.com',
            'password' => 'password123',
            'role' => 'admin',
            'admin_scope' => Pengguna::ADMIN_SCOPE_KLOTER,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('users', [
        'email' => 'admin-kloter-baru@example.com',
        'role' => 'admin',
        'admin_scope' => Pengguna::ADMIN_SCOPE_KLOTER,
    ]);
    $newKloterAdmin = Pengguna::where('email', 'admin-kloter-baru@example.com')->firstOrFail();

    $this->actingAs($superadmin)
        ->get(route('superadmin.kloters'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('SuperAdmin/Kloter/Kloter')
            ->has('admins', 3)
            ->where('admins.0.id', $newKloterAdmin->id));
});

it('prevents removing kloter scope while an admin still owns a cohort', function () {
    $fixture = createAdminGlobalKloterFixture();
    $superadmin = Pengguna::factory()->create([
        'role' => 'superadmin',
        'admin_scope' => null,
        'status' => 'active',
    ]);

    $this->actingAs($superadmin)
        ->patch(route('superadmin.admins.scope', $fixture['kloterAdmin']), [
            'admin_scope' => Pengguna::ADMIN_SCOPE_GLOBAL,
        ])
        ->assertSessionHasErrors('admin_scope');

    expect($fixture['kloterAdmin']->fresh()->admin_scope)->toBe(Pengguna::ADMIN_SCOPE_KLOTER);
});
