<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('live_class_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_pembelajaran_id')->constrained('program_pembelajaran')->cascadeOnDelete();
            $table->foreignId('kloter_belajar_id')->constrained('kloter_belajar')->cascadeOnDelete();
            $table->foreignId('presentation_deck_id')->nullable()->constrained('presentation_decks')->nullOnDelete();
            $table->foreignId('mentor_id')->constrained('users')->restrictOnDelete();
            $table->string('room_name')->unique();
            $table->string('join_code', 16)->unique();
            $table->string('status', 20)->default('draft')->index();
            $table->string('stage_mode', 20)->default('slides');
            $table->unsignedInteger('current_slide_index')->default(0);
            $table->json('board_snapshot')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            $table->index(['kloter_belajar_id', 'status']);
        });

        Schema::create('live_class_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('live_class_session_id')->constrained('live_class_sessions')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role', 20)->default('student');
            $table->boolean('can_draw')->default(false);
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('left_at')->nullable();
            $table->timestamp('mic_blocked_at')->nullable();
            $table->timestamp('kicked_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            $table->unique(['live_class_session_id', 'user_id'], 'live_class_participant_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_class_participants');
        Schema::dropIfExists('live_class_sessions');
    }
};
