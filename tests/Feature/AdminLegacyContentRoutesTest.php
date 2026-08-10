<?php

use App\Models\Pengguna;

test('legacy admin content indexes redirect to the class workspace', function (string $routeName) {
    $admin = Pengguna::factory()->create([
        'role' => 'admin',
        'status' => 'active',
    ]);

    $this->actingAs($admin)
        ->get(route($routeName))
        ->assertRedirect(route('admin.programs.index'));
})->with([
    'presentations' => 'admin.presentations.index',
    'boards' => 'admin.boards.index',
    'quizzes' => 'admin.quizzes.index',
    'flashcards' => 'admin.flashcards.index',
]);
