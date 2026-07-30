<?php

namespace Tests\Feature;

use App\Models\Pengguna;
use App\Models\ProgramPembelajaran;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserExamTargetTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_update_and_delete_a_program_exam_target(): void
    {
        $user = Pengguna::factory()->create([
            'role' => 'user',
            'email_verified_at' => now(),
        ]);
        $program = ProgramPembelajaran::query()->create([
            'title' => 'JLPT N3',
            'slug' => 'jlpt-n3-target-test',
            'status' => 'published',
            'sort_order' => 1,
        ]);

        $this->actingAs($user)
            ->put(route('user.modul.program.exam-target.update', $program->slug), [
                'exam_date' => today()->addMonths(3)->toDateString(),
            ])
            ->assertRedirect();

        $this->actingAs($user)
            ->put(route('user.modul.program.exam-target.update', $program->slug), [
                'exam_date' => today()->addMonths(4)->toDateString(),
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('user_exam_targets', 1);
        $this->assertDatabaseHas('user_exam_targets', [
            'user_id' => $user->id,
            'program_pembelajaran_id' => $program->id,
            'exam_date' => today()->addMonths(4)->toDateString(),
        ]);

        $this->actingAs($user)
            ->delete(route('user.modul.program.exam-target.destroy', $program->slug))
            ->assertRedirect();

        $this->assertDatabaseMissing('user_exam_targets', [
            'user_id' => $user->id,
            'program_pembelajaran_id' => $program->id,
        ]);
    }

    public function test_past_exam_date_is_rejected(): void
    {
        $user = Pengguna::factory()->create([
            'role' => 'user',
            'email_verified_at' => now(),
        ]);
        $program = ProgramPembelajaran::query()->create([
            'title' => 'JLPT N2',
            'slug' => 'jlpt-n2-target-test',
            'status' => 'published',
            'sort_order' => 1,
        ]);

        $this->actingAs($user)
            ->from(route('user.modul.program', $program->slug))
            ->put(route('user.modul.program.exam-target.update', $program->slug), [
                'exam_date' => today()->subDay()->toDateString(),
            ])
            ->assertSessionHasErrors('exam_date');

        $this->assertDatabaseMissing('user_exam_targets', [
            'user_id' => $user->id,
            'program_pembelajaran_id' => $program->id,
        ]);
    }
}
