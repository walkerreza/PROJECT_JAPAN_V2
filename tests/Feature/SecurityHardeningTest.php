<?php

use App\Http\Controllers\PembayaranMidtransController;
use App\Models\Flashcard;
use App\Models\Langganan;
use App\Models\LevelPembelajaran;
use App\Models\LogReward;
use App\Models\Modul;
use App\Models\PaketPembayaran;
use App\Models\Pengguna;
use App\Models\SetFlashcard;
use App\Models\Transaksi;
use App\Services\AksesFlashcardPenggunaService;
use App\Services\XpService;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpKernel\Exception\HttpException;

it('blocks direct flashcard access outside the allowed module access', function () {
    $user = Pengguna::factory()->create(['role' => 'user']);
    $level = LevelPembelajaran::create(['level_name' => 'N3', 'stage' => 1, 'is_premium' => true]);
    $module = Modul::create([
        'level_id' => $level->id,
        'title' => 'Week premium',
        'week_number' => 2,
        'description' => 'Konten premium.',
        'status' => 'published',
    ]);
    $set = SetFlashcard::create([
        'level_id' => $level->id,
        'module_id' => $module->id,
        'title' => 'Set premium',
        'status' => 'published',
    ]);
    $card = Flashcard::create([
        'flashcard_set_id' => $set->id,
        'front_text' => 'taberu',
        'back_text' => 'makan',
    ]);

    expect(fn () => app(AksesFlashcardPenggunaService::class)->abortJikaTerkunci($user, $set))
        ->toThrow(HttpException::class);
    expect(fn () => app(AksesFlashcardPenggunaService::class)->abortJikaKartuTerkunci($user, $card))
        ->toThrow(HttpException::class);
});

it('awards an identified reward only once', function () {
    $user = Pengguna::factory()->create(['role' => 'user', 'xp' => 0, 'level' => 1]);
    $xp = app(XpService::class);

    $first = $xp->awardXP($user, 10, 'flashcard', 99, 'Sesi flashcard');
    $second = $xp->awardXP($user->fresh(), 10, 'flashcard', 99, 'Sesi flashcard');

    expect($first['xp_awarded'])->toBe(10)
        ->and($second['duplicate'])->toBeTrue()
        ->and($user->fresh()->xp)->toBe(10)
        ->and(LogReward::where('user_id', $user->id)->where('source_type', 'flashcard')->where('source_id', 99)->count())->toBe(1);
});

it('maps Midtrans capture statuses without false success', function () {
    $method = new ReflectionMethod(PembayaranMidtransController::class, 'mapStatus');
    $controller = app(PembayaranMidtransController::class);

    expect($method->invoke($controller, 'capture', 'accept'))->toBe('success')
        ->and($method->invoke($controller, 'capture', 'challenge'))->toBe('pending')
        ->and($method->invoke($controller, 'capture', 'deny'))->toBe('failed')
        ->and($method->invoke($controller, 'capture', null))->toBe('pending')
        ->and($method->invoke($controller, 'settlement', null))->toBe('success')
        ->and($method->invoke($controller, 'cancel', null))->toBe('canceled')
        ->and($method->invoke($controller, 'refund', null))->toBe('refunded')
        ->and($method->invoke($controller, 'chargeback', null))->toBe('refunded');
});

it('rejects a signed Midtrans callback when its amount differs from the local transaction', function () {
    config(['services.midtrans.server_key' => 'test-server-key']);

    $user = Pengguna::factory()->create(['role' => 'user']);
    $transaction = Transaksi::create([
        'transaction_code' => 'MIDTRANS-AMOUNT-TEST',
        'user_id' => $user->id,
        'amount' => 99000,
        'payment_method' => 'midtrans',
        'status' => 'pending',
    ]);
    $payload = [
        'order_id' => $transaction->transaction_code,
        'status_code' => '200',
        'gross_amount' => '1000.00',
        'transaction_status' => 'capture',
        'fraud_status' => 'accept',
    ];
    $payload['signature_key'] = hash('sha512', $payload['order_id'].$payload['status_code'].$payload['gross_amount'].'test-server-key');

    $this->post(route('payments.midtrans.notification'), $payload)
        ->assertStatus(422);

    expect($transaction->fresh()->status)->toBe('pending');
});

it('reuses one pending Midtrans checkout for the same checkout intent', function () {
    config(['services.midtrans.server_key' => 'test-server-key']);

    $user = Pengguna::factory()->create(['role' => 'user']);
    $plan = PaketPembayaran::create([
        'name' => 'Plan idempotent checkout',
        'slug' => 'plan-idempotent-checkout',
        'scope_type' => 'global',
        'price' => 99000,
        'duration_days' => 30,
        'is_active' => true,
    ]);
    $checkoutRequestKey = '510a13fc-736f-4a6f-8abc-8c5b5a89f104';

    Http::fake([
        'https://app.sandbox.midtrans.com/snap/v1/transactions' => Http::response([
            'token' => 'snap-token-idempotent',
            'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-idempotent',
        ]),
    ]);

    $first = $this->actingAs($user)->postJson(route('payments.midtrans.checkout'), [
        'payment_plan_id' => $plan->id,
        'checkout_request_key' => $checkoutRequestKey,
    ])->assertOk();
    $second = $this->actingAs($user)->postJson(route('payments.midtrans.checkout'), [
        'payment_plan_id' => $plan->id,
        'checkout_request_key' => '5ef2c99e-4d75-44a6-bc21-66ad7d15c8e3',
    ])->assertOk();

    expect($first->json('transaction_code'))->toBe($second->json('transaction_code'))
        ->and(Transaksi::where('checkout_request_key', $checkoutRequestKey)->count())->toBe(1)
        ->and(Transaksi::where('checkout_request_key', $checkoutRequestKey)->value('midtrans_snap_token'))->toBe('snap-token-idempotent');

    Http::assertSentCount(1);
});

it('cancels only the subscription linked to a refunded Midtrans transaction', function () {
    config(['services.midtrans.server_key' => 'test-server-key']);

    $user = Pengguna::factory()->create(['role' => 'user', 'subscription_status' => 'premium']);
    $plan = PaketPembayaran::create([
        'name' => 'Plan refund test',
        'slug' => 'plan-refund-test',
        'scope_type' => 'global',
        'price' => 99000,
        'duration_days' => 30,
        'is_active' => true,
    ]);
    $subscription = Langganan::create([
        'user_id' => $user->id,
        'payment_plan_id' => $plan->id,
        'scope_type' => 'global',
        'status' => 'active',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDays(30)->toDateString(),
        'auto_renew' => false,
    ]);
    $transaction = Transaksi::create([
        'transaction_code' => 'MIDTRANS-REFUND-TEST',
        'user_id' => $user->id,
        'payment_plan_id' => $plan->id,
        'subscription_id' => $subscription->id,
        'amount' => 99000,
        'payment_method' => 'midtrans',
        'status' => 'success',
    ]);
    $payload = [
        'order_id' => $transaction->transaction_code,
        'status_code' => '200',
        'gross_amount' => '99000.00',
        'transaction_status' => 'refund',
    ];
    $payload['signature_key'] = hash('sha512', $payload['order_id'].$payload['status_code'].$payload['gross_amount'].'test-server-key');

    $this->post(route('payments.midtrans.notification'), $payload)->assertOk();

    expect($transaction->fresh()->status)->toBe('refunded')
        ->and($subscription->fresh()->status)->toBe('cancelled')
        ->and($user->fresh()->subscription_status)->toBe('free');
});

it('does not downgrade a successful Midtrans transaction from a delayed pending callback', function () {
    config(['services.midtrans.server_key' => 'test-server-key']);

    $user = Pengguna::factory()->create(['role' => 'user']);
    $transaction = Transaksi::create([
        'transaction_code' => 'MIDTRANS-LATE-PENDING-TEST',
        'user_id' => $user->id,
        'amount' => 99000,
        'payment_method' => 'midtrans',
        'status' => 'success',
    ]);
    $payload = [
        'order_id' => $transaction->transaction_code,
        'status_code' => '201',
        'gross_amount' => '99000.00',
        'transaction_status' => 'pending',
    ];
    $payload['signature_key'] = hash('sha512', $payload['order_id'].$payload['status_code'].$payload['gross_amount'].'test-server-key');

    $this->post(route('payments.midtrans.notification'), $payload)->assertOk();

    expect($transaction->fresh()->status)->toBe('success');
});

it('lets the transaction owner cancel a pending Midtrans invoice', function () {
    config(['services.midtrans.server_key' => 'test-server-key']);

    $user = Pengguna::factory()->create(['role' => 'user']);
    $transaction = Transaksi::create([
        'transaction_code' => 'MIDTRANS-CANCEL-TEST',
        'user_id' => $user->id,
        'amount' => 99000,
        'payment_method' => 'midtrans',
        'status' => 'pending',
    ]);

    Http::fake([
        'https://api.sandbox.midtrans.com/v2/MIDTRANS-CANCEL-TEST/status' => Http::response([
            'order_id' => $transaction->transaction_code,
            'gross_amount' => '99000.00',
            'transaction_status' => 'pending',
        ]),
        'https://api.sandbox.midtrans.com/v2/MIDTRANS-CANCEL-TEST/cancel' => Http::response([
            'order_id' => $transaction->transaction_code,
            'gross_amount' => '99000.00',
            'transaction_status' => 'cancel',
        ]),
    ]);

    $this->actingAs($user)
        ->postJson(route('payments.midtrans.cancel', $transaction->transaction_code))
        ->assertOk()
        ->assertJsonPath('status', 'canceled')
        ->assertJsonPath('canceled', true);

    expect($transaction->fresh()->status)->toBe('canceled')
        ->and($transaction->fresh()->subscription_id)->toBeNull();
});

it('does not let another user cancel a Midtrans invoice', function () {
    $owner = Pengguna::factory()->create(['role' => 'user']);
    $otherUser = Pengguna::factory()->create(['role' => 'user']);
    $transaction = Transaksi::create([
        'transaction_code' => 'MIDTRANS-CANCEL-OWNER-TEST',
        'user_id' => $owner->id,
        'amount' => 99000,
        'payment_method' => 'midtrans',
        'status' => 'pending',
    ]);

    $this->actingAs($otherUser)
        ->postJson(route('payments.midtrans.cancel', $transaction->transaction_code))
        ->assertNotFound();

    expect($transaction->fresh()->status)->toBe('pending');
});

it('does not reactivate a canceled Midtrans invoice from a delayed success callback', function () {
    config(['services.midtrans.server_key' => 'test-server-key']);

    $user = Pengguna::factory()->create(['role' => 'user']);
    $transaction = Transaksi::create([
        'transaction_code' => 'MIDTRANS-LATE-CANCEL-TEST',
        'user_id' => $user->id,
        'amount' => 99000,
        'payment_method' => 'midtrans',
        'status' => 'canceled',
    ]);
    $payload = [
        'order_id' => $transaction->transaction_code,
        'status_code' => '200',
        'gross_amount' => '99000.00',
        'transaction_status' => 'settlement',
    ];
    $payload['signature_key'] = hash('sha512', $payload['order_id'].$payload['status_code'].$payload['gross_amount'].'test-server-key');

    $this->post(route('payments.midtrans.notification'), $payload)->assertOk();

    expect($transaction->fresh()->status)->toBe('canceled')
        ->and($user->fresh()->subscription_status)->not->toBe('premium');
});
