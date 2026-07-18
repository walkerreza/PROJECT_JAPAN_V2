<?php

use Inertia\Testing\AssertableInertia as Assert;

test('legal pages are publicly accessible', function (string $path, string $title) {
    $this->get($path)
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Legal/LegalPage')
            ->where('title', $title)
            ->has('sections')
        );
})->with([
    ['/privacy-policy', 'Kebijakan Privasi'],
    ['/terms', 'Syarat & Ketentuan'],
    ['/cookie-policy', 'Kebijakan Cookies'],
]);
