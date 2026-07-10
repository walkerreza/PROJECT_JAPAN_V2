<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('progress') && ! Schema::hasColumn('progress', 'module_id')) {
            Schema::table('progress', function (Blueprint $table) {
                $table->foreignId('module_id')
                    ->nullable()
                    ->after('lesson_id')
                    ->constrained('modules')
                    ->cascadeOnDelete();
            });
        }

        if (Schema::hasTable('progress') && Schema::hasTable('lessons') && Schema::hasColumn('progress', 'lesson_id')) {
            DB::table('progress')
                ->join('lessons', 'progress.lesson_id', '=', 'lessons.id')
                ->whereNull('progress.module_id')
                ->update(['progress.module_id' => DB::raw('lessons.module_id')]);
        }

        if (Schema::hasTable('progress') && Schema::hasColumn('progress', 'module_id')) {
            DB::table('progress')->whereNull('module_id')->delete();

            DB::table('progress')
                ->select('user_id', 'module_id', DB::raw('MIN(id) as keep_id'))
                ->groupBy('user_id', 'module_id')
                ->havingRaw('COUNT(*) > 1')
                ->get()
                ->each(function ($row) {
                    DB::table('progress')
                        ->where('user_id', $row->user_id)
                        ->where('module_id', $row->module_id)
                        ->where('id', '!=', $row->keep_id)
                        ->delete();
                });
        }

        $this->dropLessonReference('quizzes');
        $this->dropLessonReference('progress');
        $this->dropLessonReference('flashcard_sets');
        $this->dropLessonReference('presentation_decks');
        $this->dropLessonReference('teaching_boards');

        if (Schema::hasTable('progress')) {
            Schema::table('progress', function (Blueprint $table) {
                $table->unique(['user_id', 'module_id'], 'progress_user_module_unique');
            });
        }

        Schema::dropIfExists('lessons');
        Schema::dropIfExists('kanji_bank');
    }

    public function down(): void
    {
        if (! Schema::hasTable('lessons')) {
            Schema::create('lessons', function (Blueprint $table) {
                $table->id();
                $table->foreignId('module_id')->constrained('modules')->cascadeOnDelete();
                $table->string('title', 255);
                $table->text('content')->nullable();
                $table->string('type', 40)->default('text');
                $table->unsignedInteger('order')->default(0);
                $table->unsignedInteger('duration_minutes')->default(5);
                $table->string('status', 20)->default('draft');
                $table->string('video_url')->nullable();
                $table->string('file_url')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('kanji_bank')) {
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

        $this->restoreLessonReference('quizzes');
        $this->restoreLessonReference('progress');
        $this->restoreLessonReference('flashcard_sets');
        $this->restoreLessonReference('presentation_decks');
        $this->restoreLessonReference('teaching_boards');

        if (Schema::hasTable('progress') && Schema::hasColumn('progress', 'module_id')) {
            Schema::table('progress', function (Blueprint $table) {
                $table->dropUnique('progress_user_module_unique');
                $table->dropConstrainedForeignId('module_id');
            });
        }
    }

    private function dropLessonReference(string $tableName): void
    {
        if (! Schema::hasTable($tableName) || ! Schema::hasColumn($tableName, 'lesson_id')) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) {
            $table->dropForeign(['lesson_id']);
            $table->dropColumn('lesson_id');
        });
    }

    private function restoreLessonReference(string $tableName): void
    {
        if (! Schema::hasTable($tableName) || Schema::hasColumn($tableName, 'lesson_id')) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) {
            $table->foreignId('lesson_id')
                ->nullable()
                ->constrained('lessons')
                ->nullOnDelete();
        });
    }
};
