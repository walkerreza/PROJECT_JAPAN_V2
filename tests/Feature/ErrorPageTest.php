<?php

use Inertia\Testing\AssertableInertia as Assert;

it('renders the Inertia error page for a missing web route', function () {
    $response = $this->get('/halaman-yang-tidak-ada');

    $response
        ->assertStatus(404)
        ->assertInertia(fn (Assert $page) => $page
            ->component('Errors/Status')
            ->where('status', 404)
            ->where('home_url', route('dashboard')));
});

it('returns an Inertia payload for a missing route during internal navigation', function () {
    $response = $this
        ->withHeader('X-Inertia', 'true')
        ->get('/halaman-yang-tidak-ada');

    $response
        ->assertStatus(404)
        ->assertHeader('X-Inertia', 'true')
        ->assertJsonPath('component', 'Errors/Status')
        ->assertJsonPath('props.status', 404);
});
