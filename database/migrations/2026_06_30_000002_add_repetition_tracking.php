<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flashcard_reviews', function (Blueprint $table) {
            if (! Schema::hasColumn('flashcard_reviews', 'mastery_level')) {
                $table->unsignedTinyInteger('mastery_level')->default(0)->after('learning_count');
            }

            if (! Schema::hasColumn('flashcard_reviews', 'correct_streak')) {
                $table->unsignedSmallInteger('correct_streak')->default(0)->after('mastery_level');
            }

            if (! Schema::hasColumn('flashcard_reviews', 'review_count')) {
                $table->unsignedInteger('review_count')->default(0)->after('correct_streak');
            }

            if (! Schema::hasColumn('flashcard_reviews', 'wrong_count')) {
                $table->unsignedInteger('wrong_count')->default(0)->after('review_count');
            }

            if (! Schema::hasColumn('flashcard_reviews', 'last_result')) {
                $table->string('last_result', 20)->nullable()->after('wrong_count');
            }

            if (! Schema::hasColumn('flashcard_reviews', 'next_review_at')) {
                $table->timestamp('next_review_at')->nullable()->index()->after('last_reviewed_at');
            }
        });

        if (! Schema::hasTable('question_reviews')) {
            Schema::create('question_reviews', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('question_id')->constrained('questions')->cascadeOnDelete();
                $table->foreignId('quiz_id')->nullable()->constrained('quizzes')->nullOnDelete();
                $table->foreignId('module_id')->nullable()->constrained('modules')->nullOnDelete();
                $table->string('status', 20)->default('new')->index();
                $table->unsignedTinyInteger('mastery_level')->default(0);
                $table->unsignedSmallInteger('correct_streak')->default(0);
                $table->unsignedInteger('wrong_count')->default(0);
                $table->unsignedInteger('review_count')->default(0);
                $table->string('last_result', 20)->nullable();
                $table->timestamp('last_answered_at')->nullable();
                $table->timestamp('next_review_at')->nullable();
                $table->timestamps();

                $table->unique(['user_id', 'question_id']);
                $table->index(['user_id', 'status', 'next_review_at']);
                $table->index(['module_id', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('question_reviews');

        Schema::table('flashcard_reviews', function (Blueprint $table) {
            if (Schema::hasColumn('flashcard_reviews', 'next_review_at')) {
                $table->dropIndex(['next_review_at']);
                $table->dropColumn('next_review_at');
            }

            foreach (['last_result', 'wrong_count', 'review_count', 'correct_streak', 'mastery_level'] as $column) {
                if (Schema::hasColumn('flashcard_reviews', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
