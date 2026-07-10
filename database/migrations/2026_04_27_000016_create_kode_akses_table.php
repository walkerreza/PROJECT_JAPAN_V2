<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('access_keys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_plan_id')->nullable()->constrained('payment_plans')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('code', 64)->unique();
            $table->string('name')->nullable();
            $table->unsignedInteger('duration_days')->default(30);
            $table->unsignedInteger('max_uses')->default(1);
            $table->unsignedInteger('used_count')->default(0);
            $table->string('status', 30)->default('active');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['status', 'expires_at']);
        });

        Schema::create('access_key_redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('access_key_id')->constrained('access_keys')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained('subscriptions')->nullOnDelete();
            $table->timestamp('redeemed_at');
            $table->string('ip_address')->nullable();
            $table->timestamps();

            $table->unique(['access_key_id', 'user_id']);
            $table->index(['user_id', 'redeemed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('access_key_redemptions');
        Schema::dropIfExists('access_keys');
    }
};
