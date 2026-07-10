<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vocabulary_bank', function (Blueprint $table) {
            $table->id();
            $table->string('word');
            $table->string('reading')->nullable();
            $table->text('meaning_id')->nullable();
            $table->text('meaning_en')->nullable();
            $table->string('jlpt_level', 8)->default('N3')->index();
            $table->string('category')->nullable()->index();
            $table->json('tags')->nullable();
            $table->text('example_sentence')->nullable();
            $table->text('example_reading')->nullable();
            $table->text('example_meaning')->nullable();
            $table->string('audio_url')->nullable();
            $table->string('status', 20)->default('draft')->index();
            $table->timestamps();

            $table->unique(['word', 'reading']);
        });

        Schema::create('flashcard_sets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('level_id')->nullable()->constrained('levels')->nullOnDelete();
            $table->foreignId('module_id')->nullable()->constrained('modules')->nullOnDelete();
            $table->foreignId('lesson_id')->nullable()->constrained('lessons')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('source_type', 30)->default('vocabulary');
            $table->string('status', 20)->default('draft')->index();
            $table->timestamps();
        });

        Schema::create('flashcards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flashcard_set_id')->constrained('flashcard_sets')->cascadeOnDelete();
            $table->foreignId('vocabulary_id')->nullable()->constrained('vocabulary_bank')->nullOnDelete();
            $table->string('front_text');
            $table->string('reading')->nullable();
            $table->text('back_text')->nullable();
            $table->text('hint')->nullable();
            $table->text('example_sentence')->nullable();
            $table->text('example_meaning')->nullable();
            $table->string('audio_url')->nullable();
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();

            $table->index(['flashcard_set_id', 'order']);
        });

        Schema::create('flashcard_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('flashcard_id')->constrained('flashcards')->cascadeOnDelete();
            $table->string('status', 20)->default('new')->index();
            $table->unsignedInteger('known_count')->default(0);
            $table->unsignedInteger('learning_count')->default(0);
            $table->timestamp('last_reviewed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'flashcard_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flashcard_reviews');
        Schema::dropIfExists('flashcards');
        Schema::dropIfExists('flashcard_sets');
        Schema::dropIfExists('vocabulary_bank');
    }
};

