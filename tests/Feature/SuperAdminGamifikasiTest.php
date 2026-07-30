<?php

use App\Models\Pencapaian;
use App\Models\Pengguna;
use Inertia\Testing\AssertableInertia as Assert;

it('lets superadmin manage global achievements and blocks admin legacy endpoints', function () {
    $superadmin = Pengguna::factory()->create([
        'role' => 'superadmin',
        'status' => 'active',
    ]);
    $admin = Pengguna::factory()->create([
        'role' => 'admin',
        'status' => 'active',
    ]);

    $this->actingAs($superadmin)
        ->get(route('superadmin.gamification'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('SuperAdmin/Gamifikasi/Gamifikasi')
            ->has('achievements'));

    $payload = [
        'name' => 'Kuis Perdana',
        'description' => 'Selesaikan kuis sempurna pertama.',
        'icon' => 'badge',
        'xp_reward' => 25,
        'condition_type' => 'quiz_perfect',
        'condition_value' => 1,
    ];

    $this->actingAs($superadmin)
        ->post(route('superadmin.gamification.achievements.store'), $payload)
        ->assertRedirect();

    $achievement = Pencapaian::query()->where('name', $payload['name'])->firstOrFail();
    expect($achievement->xp_reward)->toBe(25);

    $this->actingAs($superadmin)
        ->put(route('superadmin.gamification.achievements.update', $achievement), [
            ...$payload,
            'name' => 'Kuis Perdana Diperbarui',
            'xp_reward' => 30,
        ])
        ->assertRedirect();

    expect($achievement->fresh()->name)->toBe('Kuis Perdana Diperbarui')
        ->and($achievement->fresh()->xp_reward)->toBe(30);

    $this->actingAs($admin)
        ->get('/admin/gamification')
        ->assertForbidden();
    $this->actingAs($admin)
        ->post('/admin/achievements', $payload)
        ->assertForbidden();

    $this->actingAs($superadmin)
        ->delete(route('superadmin.gamification.achievements.destroy', $achievement))
        ->assertRedirect();

    expect(Pencapaian::query()->whereKey($achievement->id)->exists())->toBeFalse();
});
