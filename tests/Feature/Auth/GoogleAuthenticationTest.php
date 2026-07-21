<?php

use App\Models\Pengguna;
use Illuminate\Support\Facades\Notification;
use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

function mockGoogleUser(array $attributes = []): void
{
    $googleUser = SocialiteUser::fake(array_merge([
        'id' => 'google-user-123',
        'name' => 'Google User',
        'email' => 'google@example.com',
        'email_verified' => true,
    ], $attributes));

    $provider = Mockery::mock(Provider::class);
    $provider->shouldReceive('user')->once()->andReturn($googleUser);

    Socialite::shouldReceive('driver')
        ->once()
        ->with('google')
        ->andReturn($provider);
}

test('new Google user is verified and logged in without email notification', function () {
    Notification::fake();
    mockGoogleUser();

    $response = $this->get(route('auth.google.callback'));

    $user = Pengguna::where('email', 'google@example.com')->firstOrFail();

    $response->assertRedirect(route('user.dashboard'));
    $this->assertAuthenticatedAs($user);
    expect($user->email_verified_at)->not->toBeNull()
        ->and($user->google_id)->toBe('google-user-123')
        ->and($user->auth_provider)->toBe('google')
        ->and($user->password_login_enabled)->toBeFalse();
    Notification::assertNothingSent();
});

test('existing manual user can link Google and keeps password login enabled', function () {
    Notification::fake();
    $user = Pengguna::factory()->unverified()->create([
        'email' => 'google@example.com',
        'password_login_enabled' => true,
        'auth_provider' => 'email',
        'google_id' => null,
    ]);
    mockGoogleUser();

    $response = $this->get(route('auth.google.callback'));

    $user->refresh();

    $response->assertRedirect(route('user.dashboard'));
    $this->assertAuthenticatedAs($user);
    expect($user->email_verified_at)->not->toBeNull()
        ->and($user->google_id)->toBe('google-user-123')
        ->and($user->auth_provider)->toBe('email')
        ->and($user->password_login_enabled)->toBeTrue();
    Notification::assertNothingSent();
});

test('Google account with unverified email is rejected', function () {
    Notification::fake();
    mockGoogleUser(['email_verified' => false]);

    $response = $this->from(route('login'))->get(route('auth.google.callback'));

    $response->assertRedirect(route('login'))
        ->assertSessionHasErrors('email');
    $this->assertGuest();
    expect(Pengguna::where('email', 'google@example.com')->exists())->toBeFalse();
    Notification::assertNothingSent();
});

test('unlinked administrator account cannot be linked automatically', function () {
    Notification::fake();
    Pengguna::factory()->create([
        'email' => 'google@example.com',
        'role' => 'admin',
        'google_id' => null,
    ]);
    mockGoogleUser();

    $response = $this->from(route('login'))->get(route('auth.google.callback'));

    $response->assertRedirect(route('login'))
        ->assertSessionHasErrors('email');
    $this->assertGuest();
    Notification::assertNothingSent();
});

test('suspended Google account cannot log in', function () {
    Notification::fake();
    Pengguna::factory()->create([
        'email' => 'google@example.com',
        'auth_provider' => 'google',
        'google_id' => 'google-user-123',
        'status' => 'suspended',
    ]);
    mockGoogleUser();

    $response = $this->from(route('login'))->get(route('auth.google.callback'));

    $response->assertRedirect(route('login'))
        ->assertSessionHasErrors('email');
    $this->assertGuest();
    Notification::assertNothingSent();
});
