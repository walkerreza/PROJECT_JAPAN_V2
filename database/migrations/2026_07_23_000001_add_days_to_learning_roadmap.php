<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('module_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('modules')->cascadeOnDelete();
            $table->unsignedSmallInteger('day_number');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status', 20)->default('draft')->index();
            $table->foreignId('checkpoint_quiz_id')->nullable()->constrained('quizzes')->nullOnDelete();
            $table->timestamps();

            $table->unique(['module_id', 'day_number']);
        });

        foreach (['flashcard_sets', 'quizzes', 'presentation_decks'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->foreignId('module_day_id')
                    ->nullable()
                    ->after('module_id')
                    ->constrained('module_days')
                    ->nullOnDelete();
                $table->index(['module_id', 'module_day_id']);
            });
        }

        Schema::create('module_day_vocabulary', function (Blueprint $table) {
            $table->foreignId('module_day_id')->constrained('module_days')->cascadeOnDelete();
            $table->foreignId('vocabulary_id')->constrained('vocabulary_bank')->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->primary(['module_day_id', 'vocabulary_id']);
        });

        Schema::create('module_day_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('module_day_id')->constrained('module_days')->cascadeOnDelete();
            $table->unsignedTinyInteger('score')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'module_day_id']);
            $table->index(['module_day_id', 'completed_at']);
        });

        $now = now();

        DB::table('modules')
            ->orderBy('id')
            ->get(['id', 'title', 'status'])
            ->each(function ($module) use ($now) {
                $dayId = DB::table('module_days')->insertGetId([
                    'module_id' => $module->id,
                    'day_number' => 1,
                    'title' => 'Hari 1',
                    'description' => 'Konten awal hasil migrasi dari '.$module->title.'.',
                    'status' => $module->status ?? 'published',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                foreach (['flashcard_sets', 'quizzes', 'presentation_decks'] as $tableName) {
                    DB::table($tableName)
                        ->where('module_id', $module->id)
                        ->whereNull('module_day_id')
                        ->update(['module_day_id' => $dayId]);
                }

                DB::table('vocabulary_bank')
                    ->where('module_id', $module->id)
                    ->orderBy('id')
                    ->pluck('id')
                    ->each(function ($vocabularyId, $index) use ($dayId, $now) {
                        DB::table('module_day_vocabulary')->insertOrIgnore([
                            'module_day_id' => $dayId,
                            'vocabulary_id' => $vocabularyId,
                            'sort_order' => $index,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]);
                    });

                $checkpointQuizId = DB::table('quizzes')
                    ->where('module_day_id', $dayId)
                    ->where('status', 'published')
                    ->orderBy('id')
                    ->value('id');

                if ($checkpointQuizId) {
                    DB::table('module_days')
                        ->where('id', $dayId)
                        ->update(['checkpoint_quiz_id' => $checkpointQuizId]);
                }

                DB::table('progress')
                    ->where('module_id', $module->id)
                    ->whereNotNull('completed_at')
                    ->orderBy('id')
                    ->get(['user_id', 'score', 'completed_at', 'created_at', 'updated_at'])
                    ->each(function ($progress) use ($dayId, $now) {
                        DB::table('module_day_progress')->insertOrIgnore([
                            'user_id' => $progress->user_id,
                            'module_day_id' => $dayId,
                            'score' => $progress->score,
                            'completed_at' => $progress->completed_at,
                            'created_at' => $progress->created_at ?? $now,
                            'updated_at' => $progress->updated_at ?? $now,
                        ]);
                    });
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('module_day_progress');
        Schema::dropIfExists('module_day_vocabulary');

        foreach (['presentation_decks', 'quizzes', 'flashcard_sets'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropIndex(['module_id', 'module_day_id']);
                $table->dropConstrainedForeignId('module_day_id');
            });
        }

        Schema::dropIfExists('module_days');
    }
};
