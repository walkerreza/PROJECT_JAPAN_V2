<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // modules: tambah description
        Schema::table('modules', function (Blueprint $table) {
            $table->text('description')->nullable()->after('week_number');
        });

        // lessons: tambah order dan duration_minutes
        Schema::table('lessons', function (Blueprint $table) {
            $table->integer('order')->default(0)->after('content');
            $table->integer('duration_minutes')->nullable()->after('order');
            $table->index(['module_id', 'order']);
        });

        // quizzes: tambah time_limit
        Schema::table('quizzes', function (Blueprint $table) {
            $table->integer('time_limit')->nullable()->after('type')->comment('Waktu dalam detik, null = tidak ada batas');
        });

        // questions: tambah options, audio_url, order
        Schema::table('questions', function (Blueprint $table) {
            $table->json('options')->nullable()->after('correct_answer')->comment('Array pilihan untuk tipe multiple_choice');
            $table->string('audio_url')->nullable()->after('options')->comment('URL audio untuk tipe listening');
            $table->integer('order')->default(0)->after('audio_url');
            $table->index(['quiz_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::table('modules', function (Blueprint $table) {
            $table->dropColumn('description');
        });

        Schema::table('lessons', function (Blueprint $table) {
            $table->dropIndex(['module_id', 'order']);
            $table->dropColumn(['order', 'duration_minutes']);
        });

        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropColumn('time_limit');
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->dropIndex(['quiz_id', 'order']);
            $table->dropColumn(['options', 'audio_url', 'order']);
        });
    }
};
