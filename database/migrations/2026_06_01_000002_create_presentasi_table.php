<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('presentation_decks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('level_id')->nullable()->constrained('levels')->nullOnDelete();
            $table->foreignId('module_id')->nullable()->constrained('modules')->nullOnDelete();
            $table->foreignId('lesson_id')->nullable()->constrained('lessons')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status', 20)->default('draft')->index();
            $table->timestamps();
        });

        Schema::create('presentation_slides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('presentation_deck_id')->constrained('presentation_decks')->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->string('layout', 40)->default('title');
            $table->text('content')->nullable();
            $table->string('media_url')->nullable();
            $table->string('background', 40)->default('light');
            $table->string('accent_color', 20)->default('#E64A19');
            $table->text('speaker_notes')->nullable();
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();

            $table->index(['presentation_deck_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('presentation_slides');
        Schema::dropIfExists('presentation_decks');
    }
};
