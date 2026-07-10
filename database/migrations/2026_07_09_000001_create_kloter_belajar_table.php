<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kloter_belajar', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_pembelajaran_id')->constrained('program_pembelajaran')->cascadeOnDelete();
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('nama');
            $table->string('kode', 64)->unique();
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai')->nullable();
            $table->boolean('is_default')->default(false);
            $table->string('status', 30)->default('active');
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->index(['program_pembelajaran_id', 'status', 'is_default'], 'kloter_program_status_default_index');
            $table->index(['admin_id', 'status'], 'kloter_admin_status_index');
            $table->index(['tanggal_mulai', 'status'], 'kloter_mulai_status_index');
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            if (! Schema::hasColumn('subscriptions', 'kloter_belajar_id')) {
                $table->foreignId('kloter_belajar_id')
                    ->nullable()
                    ->after('program_pembelajaran_id')
                    ->constrained('kloter_belajar')
                    ->nullOnDelete();
            }
        });

        Schema::table('transactions', function (Blueprint $table) {
            if (! Schema::hasColumn('transactions', 'kloter_belajar_id')) {
                $table->foreignId('kloter_belajar_id')
                    ->nullable()
                    ->after('program_pembelajaran_id')
                    ->constrained('kloter_belajar')
                    ->nullOnDelete();
            }
        });

        Schema::table('access_keys', function (Blueprint $table) {
            if (! Schema::hasColumn('access_keys', 'kloter_belajar_id')) {
                $table->foreignId('kloter_belajar_id')
                    ->nullable()
                    ->after('program_pembelajaran_id')
                    ->constrained('kloter_belajar')
                    ->nullOnDelete();
            }
        });

        Schema::table('access_key_redemptions', function (Blueprint $table) {
            if (! Schema::hasColumn('access_key_redemptions', 'kloter_belajar_id')) {
                $table->foreignId('kloter_belajar_id')
                    ->nullable()
                    ->after('subscription_id')
                    ->constrained('kloter_belajar')
                    ->nullOnDelete();
            }
        });

        Schema::create('anggota_kloter', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kloter_belajar_id')->constrained('kloter_belajar')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained('subscriptions')->nullOnDelete();
            $table->foreignId('transaction_id')->nullable()->constrained('transactions')->nullOnDelete();
            $table->foreignId('access_key_id')->nullable()->constrained('access_keys')->nullOnDelete();
            $table->timestamp('joined_at');
            $table->string('status', 30)->default('active');
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->unique(['kloter_belajar_id', 'user_id'], 'anggota_kloter_unique');
            $table->index(['user_id', 'status'], 'anggota_kloter_user_status_index');
            $table->index(['kloter_belajar_id', 'status'], 'anggota_kloter_status_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('anggota_kloter');

        Schema::table('access_key_redemptions', function (Blueprint $table) {
            if (Schema::hasColumn('access_key_redemptions', 'kloter_belajar_id')) {
                $table->dropConstrainedForeignId('kloter_belajar_id');
            }
        });

        Schema::table('access_keys', function (Blueprint $table) {
            if (Schema::hasColumn('access_keys', 'kloter_belajar_id')) {
                $table->dropConstrainedForeignId('kloter_belajar_id');
            }
        });

        Schema::table('transactions', function (Blueprint $table) {
            if (Schema::hasColumn('transactions', 'kloter_belajar_id')) {
                $table->dropConstrainedForeignId('kloter_belajar_id');
            }
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            if (Schema::hasColumn('subscriptions', 'kloter_belajar_id')) {
                $table->dropConstrainedForeignId('kloter_belajar_id');
            }
        });

        Schema::dropIfExists('kloter_belajar');
    }
};
