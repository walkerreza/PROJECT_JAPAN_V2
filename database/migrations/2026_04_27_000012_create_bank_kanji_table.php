<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kanji_bank', function (Blueprint $table) {
            $table->id();
            $table->string('kanji', 8)->unique();
            $table->text('onyomi')->nullable();
            $table->text('kunyomi')->nullable();
            $table->text('meaning')->nullable();
            $table->text('indonesian_meaning')->nullable();
            $table->string('jlpt_level', 8)->default('N3')->index();
            $table->unsignedSmallInteger('stroke_count')->nullable();
            $table->json('tags')->nullable();
            $table->string('example_word')->nullable();
            $table->string('example_reading')->nullable();
            $table->text('example_meaning')->nullable();
            $table->text('example_sentence')->nullable();
            $table->text('example_sentence_reading')->nullable();
            $table->text('example_sentence_meaning')->nullable();
            $table->string('status', 20)->default('draft')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kanji_bank');
    }
};
