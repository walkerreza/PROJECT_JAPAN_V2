<?php

use App\Models\Pengguna as User;
use App\Notifications\PasswordResetOtpNotification;
use App\Notifications\EmailVerificationNotification;
use App\Services\MailtrapTemplateService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;

test('password reset OTP request screen can be rendered', function () {
    $this->get('/forgot-password')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Auth/PasswordResetOtp')
            ->where('mode', 'request'));
});

test('a manual account receives a password reset OTP', function () {
    Notification::fake();
    $user = User::factory()->create(['password_login_enabled' => true]);

    $this->post('/forgot-password', ['email' => $user->email])
        ->assertRedirect(route('password.reset', ['email' => $user->email]));

    Notification::assertSentTo($user, PasswordResetOtpNotification::class);
    expect(DB::table('password_reset_tokens')->where('email', $user->email)->value('token'))->not->toBeNull();
});

test('a Google-only account does not receive a password reset OTP', function () {
    Notification::fake();
    $user = User::factory()->create([
        'password_login_enabled' => false,
        'auth_provider' => 'google',
        'google_id' => 'google-only-account',
    ]);

    $this->post('/forgot-password', ['email' => $user->email])
        ->assertRedirect(route('password.reset', ['email' => $user->email]));

    Notification::assertNothingSent();
});

test('a configured Mailtrap template receives the OTP variables through the backend API', function () {
    config([
        'services.mailtrap.templates_enabled' => true,
        'services.mailtrap.api_token' => 'test-api-token',
        'services.mailtrap.sandbox_inbox_id' => '12345',
        'services.mailtrap.templates.password_reset_otp' => 'otp-template-uuid',
    ]);
    Http::fake([
        'https://sandbox.api.mailtrap.io/api/send/12345' => Http::response(['success' => true]),
    ]);
    $user = User::factory()->create(['password_login_enabled' => true]);

    $user->notify(new PasswordResetOtpNotification('123456', 10));

    Http::assertSent(function ($request) use ($user) {
        return $request->url() === 'https://sandbox.api.mailtrap.io/api/send/12345'
            && $request['template_uuid'] === 'otp-template-uuid'
            && $request['template_variables']['user_name'] === $user->username
            && $request['template_variables']['otp_code'] === '123456'
            && $request['template_variables']['expires_minutes'] === '10'
            && $request->hasHeader('Api-Token', 'test-api-token');
    });
});

test('an incomplete Mailtrap Sandbox configuration falls back to SMTP', function () {
    config([
        'services.mailtrap.templates_enabled' => true,
        'services.mailtrap.api_token' => 'test-api-token',
        'services.mailtrap.api_endpoint' => 'https://sandbox.api.mailtrap.io/api/send',
        'services.mailtrap.sandbox_inbox_id' => null,
        'services.mailtrap.templates.password_reset_otp' => 'otp-template-uuid',
    ]);

    expect(app(MailtrapTemplateService::class)->shouldUse('password_reset_otp'))->toBeFalse();
});

test('a valid OTP resets a manual account password once', function () {
    $user = User::factory()->create(['password_login_enabled' => true]);
    DB::table('password_reset_tokens')->insert([
        'email' => $user->email,
        'token' => Hash::make('123456'),
        'created_at' => now(),
    ]);

    $this->post('/reset-password', [
        'email' => $user->email,
        'otp' => '123456',
        'password' => 'new-password-123',
        'password_confirmation' => 'new-password-123',
    ])->assertRedirect(route('login'));

    expect(Hash::check('new-password-123', $user->fresh()->password))->toBeTrue()
        ->and(DB::table('password_reset_tokens')->where('email', $user->email)->exists())->toBeFalse();

    $this->post('/reset-password', [
        'email' => $user->email,
        'otp' => '123456',
        'password' => 'another-password-123',
        'password_confirmation' => 'another-password-123',
    ])->assertSessionHasErrors('otp');
});

test('an expired OTP is rejected', function () {
    $user = User::factory()->create(['password_login_enabled' => true]);
    DB::table('password_reset_tokens')->insert([
        'email' => $user->email,
        'token' => Hash::make('123456'),
        'created_at' => now()->subMinutes(11),
    ]);

    $this->post('/reset-password', [
        'email' => $user->email,
        'otp' => '123456',
        'password' => 'new-password-123',
        'password_confirmation' => 'new-password-123',
    ])->assertSessionHasErrors('otp');
});

test('manual registration sends email verification', function () {
    Notification::fake();

    $this->post('/register', [
        'name' => 'Manual User',
        'email' => 'manual-verification@example.test',
        'password' => 'new-password-123',
        'password_confirmation' => 'new-password-123',
    ])->assertRedirect(route('user.dashboard', absolute: false));

    $user = User::where('email', 'manual-verification@example.test')->firstOrFail();

    expect($user->password_login_enabled)->toBeTrue();
    Notification::assertSentTo($user, EmailVerificationNotification::class);
});
