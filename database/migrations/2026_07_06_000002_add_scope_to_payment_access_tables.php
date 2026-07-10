<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_plans', function (Blueprint $table) {
            if (! Schema::hasColumn('payment_plans', 'scope_type')) {
                $table->string('scope_type', 24)->default('global')->after('slug');
            }

            if (! Schema::hasColumn('payment_plans', 'program_pembelajaran_id')) {
                $table->foreignId('program_pembelajaran_id')
                    ->nullable()
                    ->after('scope_type')
                    ->constrained('program_pembelajaran')
                    ->nullOnDelete();
            }
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            if (! Schema::hasColumn('subscriptions', 'scope_type')) {
                $table->string('scope_type', 24)->default('global')->after('payment_plan_id');
            }

            if (! Schema::hasColumn('subscriptions', 'program_pembelajaran_id')) {
                $table->foreignId('program_pembelajaran_id')
                    ->nullable()
                    ->after('scope_type')
                    ->constrained('program_pembelajaran')
                    ->nullOnDelete();
            }
        });

        Schema::table('transactions', function (Blueprint $table) {
            if (! Schema::hasColumn('transactions', 'scope_type')) {
                $table->string('scope_type', 24)->default('global')->after('subscription_id');
            }

            if (! Schema::hasColumn('transactions', 'program_pembelajaran_id')) {
                $table->foreignId('program_pembelajaran_id')
                    ->nullable()
                    ->after('scope_type')
                    ->constrained('program_pembelajaran')
                    ->nullOnDelete();
            }
        });

        Schema::table('access_keys', function (Blueprint $table) {
            if (! Schema::hasColumn('access_keys', 'scope_type')) {
                $table->string('scope_type', 24)->default('global')->after('payment_plan_id');
            }

            if (! Schema::hasColumn('access_keys', 'program_pembelajaran_id')) {
                $table->foreignId('program_pembelajaran_id')
                    ->nullable()
                    ->after('scope_type')
                    ->constrained('program_pembelajaran')
                    ->nullOnDelete();
            }
        });

        DB::table('payment_plans')->whereNull('scope_type')->orWhere('scope_type', '')->update(['scope_type' => 'global']);
        DB::table('subscriptions')->whereNull('scope_type')->orWhere('scope_type', '')->update(['scope_type' => 'global']);
        DB::table('transactions')->whereNull('scope_type')->orWhere('scope_type', '')->update(['scope_type' => 'global']);
        DB::table('access_keys')->whereNull('scope_type')->orWhere('scope_type', '')->update(['scope_type' => 'global']);

        Schema::table('payment_plans', function (Blueprint $table) {
            $table->index(['scope_type', 'program_pembelajaran_id', 'is_active'], 'payment_plans_scope_active_index');
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->index(['user_id', 'status', 'scope_type', 'program_pembelajaran_id'], 'subscriptions_user_scope_index');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->index(['user_id', 'status', 'scope_type', 'program_pembelajaran_id'], 'transactions_user_scope_index');
        });

        Schema::table('access_keys', function (Blueprint $table) {
            $table->index(['status', 'scope_type', 'program_pembelajaran_id'], 'access_keys_scope_status_index');
        });
    }

    public function down(): void
    {
        Schema::table('access_keys', function (Blueprint $table) {
            $table->dropIndex('access_keys_scope_status_index');
            $table->dropConstrainedForeignId('program_pembelajaran_id');
            $table->dropColumn('scope_type');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('transactions_user_scope_index');
            $table->dropConstrainedForeignId('program_pembelajaran_id');
            $table->dropColumn('scope_type');
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropIndex('subscriptions_user_scope_index');
            $table->dropConstrainedForeignId('program_pembelajaran_id');
            $table->dropColumn('scope_type');
        });

        Schema::table('payment_plans', function (Blueprint $table) {
            $table->dropIndex('payment_plans_scope_active_index');
            $table->dropConstrainedForeignId('program_pembelajaran_id');
            $table->dropColumn('scope_type');
        });
    }
};
