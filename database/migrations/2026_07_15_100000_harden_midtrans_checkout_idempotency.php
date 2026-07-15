<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->uuid('checkout_request_key')
                ->nullable()
                ->after('transaction_code');
            $table->string('midtrans_snap_token')->nullable()->after('checkout_request_key');
            $table->text('midtrans_snap_redirect_url')->nullable()->after('midtrans_snap_token');

            $table->unique('checkout_request_key', 'transactions_checkout_request_key_unique');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropUnique('transactions_checkout_request_key_unique');
            $table->dropColumn([
                'checkout_request_key',
                'midtrans_snap_token',
                'midtrans_snap_redirect_url',
            ]);
        });
    }
};
