<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('learning_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('quiz_id')->constrained('quizzes')->cascadeOnDelete();
            $table->foreignId('module_id')->constrained('modules')->cascadeOnDelete();
            $table->foreignId('program_pembelajaran_id')->constrained('program_pembelajaran')->cascadeOnDelete();
            $table->string('rating', 20);
            $table->boolean('continue_learning')->default(false);
            $table->date('feedback_date');
            $table->timestamps();

            $table->unique(['user_id', 'quiz_id', 'feedback_date']);
            $table->index(['program_pembelajaran_id', 'feedback_date']);
            $table->index(['module_id', 'feedback_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('learning_feedback');
    }
};
