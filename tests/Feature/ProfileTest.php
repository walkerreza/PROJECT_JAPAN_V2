<?php

use App\Http\Controllers\Auth\LoginSosialController;
use App\Models\Pengguna as User;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;

test('profile page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get('/profile');

    $response->assertOk();
});

test('profile information can be updated', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch('/profile', [
            'username' => 'Test User',
            'email' => 'test@example.com',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile');

    $user->refresh();

    $this->assertSame('Test User', $user->username);
    $this->assertSame('test@example.com', $user->email);
    $this->assertNull($user->email_verified_at);
});

test('email verification status is unchanged when the email address is unchanged', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch('/profile', [
            'username' => 'Test User',
            'email' => $user->email,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile');

    $this->assertNotNull($user->refresh()->email_verified_at);
});

test('user can delete their account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->delete('/profile', [
            'confirmation_username' => $user->username,
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    $this->assertGuest();
    $this->assertNull($user->fresh());
});

test('correct password must be provided to delete account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from('/profile')
        ->delete('/profile', [
            'confirmation_username' => $user->username,
            'password' => 'wrong-password',
        ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect('/profile');

    $this->assertNotNull($user->fresh());
});

test('matching username must be provided to delete account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from('/profile')
        ->delete('/profile', [
            'confirmation_username' => 'username-lain',
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasErrors('confirmation_username')
        ->assertRedirect('/profile');

    $this->assertNotNull($user->fresh());
});

test('Google-only account requires recent Google confirmation to delete account', function () {
    $user = User::factory()->create([
        'password_login_enabled' => false,
        'auth_provider' => 'google',
        'google_id' => 'google-user-123',
    ]);

    $response = $this
        ->actingAs($user)
        ->from('/profile')
        ->delete('/profile', [
            'confirmation_username' => $user->username,
        ]);

    $response
        ->assertSessionHasErrors('google_confirmation')
        ->assertRedirect('/profile');

    $this->assertNotNull($user->fresh());
});

test('Google token revocation failure does not prevent local account deletion', function () {
    Http::fake([
        'https://oauth2.googleapis.com/revoke' => Http::response(['error' => 'temporarily_unavailable'], 503),
    ]);

    $user = User::factory()->create([
        'password_login_enabled' => false,
        'auth_provider' => 'google',
        'google_id' => 'google-user-123',
    ]);

    $response = $this
        ->actingAs($user)
        ->withSession([
            LoginSosialController::ACCOUNT_DELETION_CONFIRMED_AT => now()->timestamp,
            LoginSosialController::ACCOUNT_DELETION_CONFIRMED_USER_ID => $user->id,
            LoginSosialController::ACCOUNT_DELETION_GOOGLE_TOKEN => Crypt::encryptString('google-access-token'),
        ])
        ->delete('/profile', [
            'confirmation_username' => $user->username,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');
    $this->assertGuest();
    $this->assertNull($user->fresh());
});
