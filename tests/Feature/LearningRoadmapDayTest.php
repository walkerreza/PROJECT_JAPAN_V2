<?php

use App\Models\Flashcard;
use App\Models\HariModul;
use App\Models\Kuis;
use App\Models\LevelPembelajaran;
use App\Models\Modul;
use App\Models\Pengguna;
use App\Models\ProgramPembelajaran;
use App\Models\ReviewFlashcard;
use App\Models\SetFlashcard;
use App\Services\AksesKuisPenggunaService;
use App\Services\ProgresRoadmapService;
use Database\Seeders\KelasDemoSeeder;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;

function createDayRoadmapFixture(): array
{
    $level = LevelPembelajaran::create([
        'level_name' => 'D73',
        'stage' => 73,
        'is_premium' => false,
    ]);
    $program = ProgramPembelajaran::create([
        'level_id' => $level->id,
        'title' => 'Kelas Day Test',
        'slug' => 'kelas-day-test',
        'status' => 'published',
        'sort_order' => 1,
    ]);
    $module = Modul::create([
        'level_id' => $level->id,
        'program_pembelajaran_id' => $program->id,
        'title' => 'Pola Kalimat',
        'week_number' => 1,
        'description' => 'Week dengan dua Day.',
        'status' => 'published',
    ]);
    $dayOne = HariModul::create([
        'module_id' => $module->id,
        'day_number' => 1,
        'title' => 'Pengenalan',
        'status' => 'published',
    ]);
    $dayTwo = HariModul::create([
        'module_id' => $module->id,
        'day_number' => 2,
        'title' => 'Latihan',
        'status' => 'published',
    ]);

    foreach ([$dayOne, $dayTwo] as $day) {
        $set = SetFlashcard::create([
            'level_id' => $level->id,
            'module_id' => $module->id,
            'module_day_id' => $day->id,
            'title' => 'Flashcard '.$day->day_number,
            'status' => 'published',
        ]);
        Flashcard::create([
            'flashcard_set_id' => $set->id,
            'front_text' => 'kata-'.$day->day_number,
            'back_text' => 'arti-'.$day->day_number,
        ]);
    }

    return compact('level', 'program', 'module', 'dayOne', 'dayTwo');
}

it('keeps Day assignments inside the selected Week', function () {
    $fixture = createDayRoadmapFixture();
    $admin = Pengguna::factory()->create(['role' => 'admin']);
    $otherModule = Modul::create([
        'level_id' => $fixture['level']->id,
        'program_pembelajaran_id' => $fixture['program']->id,
        'title' => 'Week Lain',
        'week_number' => 2,
        'status' => 'published',
    ]);
    $otherDay = HariModul::create([
        'module_id' => $otherModule->id,
        'day_number' => 1,
        'title' => 'Day Week Lain',
        'status' => 'published',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.flashcards.store'), [
            'title' => 'Relasi tidak valid',
            'level_id' => $fixture['level']->id,
            'module_id' => $fixture['module']->id,
            'module_day_id' => $otherDay->id,
            'status' => 'draft',
        ])
        ->assertSessionHasErrors('module_day_id');
});

it('locks a later Day until the previous Day is complete', function () {
    $fixture = createDayRoadmapFixture();
    $user = Pengguna::factory()->create(['role' => 'user']);
    $roadmap = app(ProgresRoadmapService::class);
    $firstSet = SetFlashcard::where('module_day_id', $fixture['dayOne']->id)->firstOrFail();
    $secondSet = SetFlashcard::where('module_day_id', $fixture['dayTwo']->id)->firstOrFail();
    $firstCard = $firstSet->flashcards()->firstOrFail();
    $secondCard = $secondSet->flashcards()->firstOrFail();

    expect($roadmap->statusAksesHari($user, $fixture['dayTwo'])['allowed'])->toBeFalse()
        ->and($roadmap->selesaikanDariFlashcard($user, $firstSet)['day_completed'])->toBeFalse();

    ReviewFlashcard::create([
        'user_id' => $user->id,
        'flashcard_id' => $firstCard->id,
        'status' => 'learning',
    ]);
    $first = $roadmap->selesaikanDariFlashcard($user, $firstSet);

    expect($first['day_completed'])->toBeTrue()
        ->and($first['module_completed'])->toBeFalse()
        ->and($roadmap->statusAksesHari($user, $fixture['dayTwo'])['allowed'])->toBeTrue();

    ReviewFlashcard::create([
        'user_id' => $user->id,
        'flashcard_id' => $secondCard->id,
        'status' => 'learning',
    ]);
    $second = $roadmap->selesaikanDariFlashcard($user, $secondSet);

    expect($second['day_completed'])->toBeTrue()
        ->and($second['module_completed'])->toBeTrue()
        ->and($user->progress()->where('module_id', $fixture['module']->id)->whereNotNull('completed_at')->exists())->toBeTrue()
        ->and($user->dayProgress()->whereNotNull('completed_at')->count())->toBe(2);
});

it('only completes a Day from its checkpoint quiz', function () {
    $fixture = createDayRoadmapFixture();
    $user = Pengguna::factory()->create(['role' => 'user']);
    $checkpoint = Kuis::create([
        'module_id' => $fixture['module']->id,
        'module_day_id' => $fixture['dayOne']->id,
        'type' => 'multiple_choice',
        'passing_score' => 70,
        'status' => 'published',
    ]);
    $otherQuiz = Kuis::create([
        'module_id' => $fixture['module']->id,
        'module_day_id' => $fixture['dayOne']->id,
        'type' => 'fill_blank',
        'passing_score' => 70,
        'status' => 'published',
    ]);
    $fixture['dayOne']->update(['checkpoint_quiz_id' => $checkpoint->id]);
    $roadmap = app(ProgresRoadmapService::class);
    $flashcardSet = SetFlashcard::where('module_day_id', $fixture['dayOne']->id)->firstOrFail();
    $card = $flashcardSet->flashcards()->firstOrFail();
    ReviewFlashcard::create([
        'user_id' => $user->id,
        'flashcard_id' => $card->id,
        'status' => 'learning',
    ]);

    $flashcardResult = $roadmap->selesaikanDariFlashcard($user, $flashcardSet);
    $ignored = $roadmap->selesaikanDariKuis($user, $otherQuiz, 100);
    $completed = $roadmap->selesaikanDariKuis($user, $checkpoint, 80);

    expect($flashcardResult['day_completed'])->toBeFalse()
        ->and($ignored['day_completed'])->toBeFalse()
        ->and($completed['day_completed'])->toBeTrue()
        ->and($roadmap->hariSelesai($user, $fixture['dayOne']))->toBeTrue();
});

it('requires every published flashcard set in a Day before its checkpoint quiz unlocks', function () {
    $fixture = createDayRoadmapFixture();
    $user = Pengguna::factory()->create(['role' => 'user']);
    $checkpoint = Kuis::create([
        'module_id' => $fixture['module']->id,
        'module_day_id' => $fixture['dayOne']->id,
        'type' => 'multiple_choice',
        'passing_score' => 70,
        'status' => 'published',
    ]);
    $fixture['dayOne']->update(['checkpoint_quiz_id' => $checkpoint->id]);
    $secondSet = SetFlashcard::create([
        'level_id' => $fixture['level']->id,
        'module_id' => $fixture['module']->id,
        'module_day_id' => $fixture['dayOne']->id,
        'title' => 'Flashcard tambahan',
        'status' => 'published',
    ]);
    $secondCard = Flashcard::create([
        'flashcard_set_id' => $secondSet->id,
        'front_text' => 'tambahan',
        'back_text' => 'additional',
    ]);
    $firstCard = SetFlashcard::where('module_day_id', $fixture['dayOne']->id)
        ->where('id', '!=', $secondSet->id)
        ->firstOrFail()
        ->flashcards()
        ->firstOrFail();
    ReviewFlashcard::create([
        'user_id' => $user->id,
        'flashcard_id' => $firstCard->id,
        'status' => 'learning',
    ]);

    $access = app(AksesKuisPenggunaService::class);
    $blocked = $access->status($user, $checkpoint->fresh());

    expect($blocked['allowed'])->toBeFalse()
        ->and($blocked['reason'])->toBe('flashcard_required')
        ->and($blocked['flashcard_stats'])->toBe(['total' => 2, 'reviewed' => 1]);

    ReviewFlashcard::create([
        'user_id' => $user->id,
        'flashcard_id' => $secondCard->id,
        'status' => 'learning',
    ]);

    expect($access->status($user, $checkpoint->fresh())['allowed'])->toBeTrue();
});

it('does not expose a manual Day completion route', function () {
    expect(Route::has('user.module-days.complete'))->toBeFalse();
});

it('returns Week and Day hierarchy to the user roadmap', function () {
    $fixture = createDayRoadmapFixture();
    $user = Pengguna::factory()->create(['role' => 'user']);

    $this->actingAs($user)
        ->get(route('user.modul.program', $fixture['program']->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('User/Modul/DaftarModul')
            ->has('weeks', 1)
            ->where('weeks.0.week_number', 1)
            ->where('weeks.0.display_title', $fixture['module']->title)
            ->has('weeks.0.days', 2)
             ->where('weeks.0.days.0.day_number', 1)
             ->where('weeks.0.days.0.status', 'active')
             ->where('weeks.0.days.0.completion_method', 'flashcard')
             ->where('weeks.0.days.0.flashcard_summary.total', 1)
             ->where('weeks.0.days.0.flashcard_summary.reviewed', 0)
             ->where('weeks.0.days.1.status', 'locked'));
});

it('returns a selected class as an admin Week and Day workspace', function () {
    $fixture = createDayRoadmapFixture();
    $admin = Pengguna::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->get(route('admin.modules.index', [
            'program_id' => $fixture['program']->id,
            'focus' => 'flashcard',
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ModulMateri/ManajemenModulMateri')
            ->where('filters.program_id', (string) $fixture['program']->id)
            ->where('filters.focus', 'flashcard')
            ->has('modules.data', 1)
            ->where('modules.data.0.id', $fixture['module']->id)
             ->has('modules.data.0.days', 2)
             ->where('modules.data.0.days.0.day_number', 1)
             ->where('modules.data.0.days.0.is_ready', true)
             ->where('modules.data.0.days.0.completion_method', 'flashcard')
             ->has('modules.data.0.days.0.flashcard_sets', 1)
            ->where('modules.data.0.days.0.flashcard_sets.0.item_count', 1));
});

it('does not mix Weeks from every class when the admin workspace has no class context', function () {
    createDayRoadmapFixture();
    $admin = Pengguna::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->get(route('admin.modules.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ModulMateri/ManajemenModulMateri')
            ->has('modules.data', 0));
});

it('opens the quiz editor after creating a quiz from a Day context', function () {
    $fixture = createDayRoadmapFixture();
    $admin = Pengguna::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)
        ->post(route('admin.quizzes.store'), [
            'module_id' => $fixture['module']->id,
            'module_day_id' => $fixture['dayOne']->id,
            'type' => 'multiple_choice',
            'time_limit' => null,
            'passing_score' => 70,
            'status' => 'draft',
        ]);

    $quiz = Kuis::query()->latest('id')->firstOrFail();

    $response->assertRedirect(route('admin.quizzes.builder', $quiz));
    expect($quiz->module_day_id)->toBe($fixture['dayOne']->id);
});

it('rejects direct resource URLs for a locked Day', function () {
    $fixture = createDayRoadmapFixture();
    $user = Pengguna::factory()->create(['role' => 'user']);
    $query = [
        'module' => $fixture['module']->id,
        'day' => $fixture['dayTwo']->id,
    ];

    $this->actingAs($user)
        ->get(route('user.modul.program.kosakata', $fixture['program']->slug).'?'.http_build_query($query))
        ->assertForbidden();

    $this->actingAs($user)
        ->get(route('user.modul.program.presentasi', $fixture['program']->slug).'?'.http_build_query($query))
        ->assertForbidden();
});

it('seeds an idempotent two-Day roadmap for every demo Week', function () {
    $this->seed(KelasDemoSeeder::class);
    $this->seed(KelasDemoSeeder::class);

    expect(ProgramPembelajaran::count())->toBe(4)
        ->and(Modul::count())->toBe(12)
        ->and(HariModul::count())->toBe(24)
        ->and(SetFlashcard::count())->toBe(12)
        ->and(Kuis::count())->toBe(12);

    Modul::with(['days', 'flashcardSets', 'quizzes', 'presentationDecks'])
        ->get()
        ->each(function (Modul $module) {
            expect($module->days->pluck('day_number')->sort()->values()->all())->toBe([1, 2])
                ->and($module->flashcardSets->first()?->module_day_id)->toBe($module->days->firstWhere('day_number', 1)?->id)
                ->and($module->presentationDecks->first()?->module_day_id)->toBe($module->days->firstWhere('day_number', 1)?->id)
                ->and($module->quizzes->first()?->module_day_id)->toBe($module->days->firstWhere('day_number', 2)?->id)
                ->and($module->days->firstWhere('day_number', 2)?->checkpoint_quiz_id)->toBe($module->quizzes->first()?->id);
        });
});
