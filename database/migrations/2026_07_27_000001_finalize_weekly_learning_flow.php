<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('presentation_decks', function (Blueprint $table) {
            $table->string('week_slot', 20)->nullable()->after('module_day_id')->index();
        });

        Schema::table('modules', function (Blueprint $table) {
            $table->foreignId('weekly_exam_quiz_id')
                ->nullable()
                ->after('status')
                ->constrained('quizzes')
                ->nullOnDelete();
        });

        Schema::table('quizzes', function (Blueprint $table) {
            $table->timestamp('available_at')->nullable()->after('passing_score')->index();
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->unsignedSmallInteger('points')->default(1)->after('order');
        });

        Schema::table('attempts', function (Blueprint $table) {
            $table->uuid('submission_token')->nullable()->after('quiz_id');
            $table->string('status', 20)->default('completed')->after('submission_token')->index();
            $table->timestamp('started_at')->nullable()->after('xp_earned');
            $table->timestamp('completed_at')->nullable()->after('started_at');
            $table->unique(
                ['user_id', 'quiz_id', 'submission_token'],
                'attempts_user_quiz_submission_unique'
            );
        });

        DB::table('presentation_decks')
            ->whereNotNull('module_id')
            ->whereNull('module_day_id')
            ->orderBy('module_id')
            ->orderBy('id')
            ->get(['id', 'module_id'])
            ->groupBy('module_id')
            ->each(function ($decks) {
                $first = $decks->first();
                $second = $decks->skip(1)->first();

                if ($first) {
                    DB::table('presentation_decks')
                        ->where('id', $first->id)
                        ->update(['week_slot' => 'opening']);
                }

                if ($second) {
                    DB::table('presentation_decks')
                        ->where('id', $second->id)
                        ->update(['week_slot' => 'closing']);
                }
            });

        DB::table('modules')
            ->orderBy('id')
            ->get(['id'])
            ->each(function ($module) {
                $weeklyExamId = DB::table('quizzes')
                    ->where('module_id', $module->id)
                    ->whereNull('module_day_id')
                    ->orderBy('id')
                    ->value('id');

                if ($weeklyExamId) {
                    DB::table('modules')
                        ->where('id', $module->id)
                        ->update(['weekly_exam_quiz_id' => $weeklyExamId]);
                }
            });

        DB::table('attempts')
            ->whereNull('started_at')
            ->update([
                'status' => 'completed',
                'started_at' => DB::raw('attempted_at'),
                'completed_at' => DB::raw('attempted_at'),
            ]);
    }

    public function down(): void
    {
        Schema::table('attempts', function (Blueprint $table) {
            $table->dropUnique('attempts_user_quiz_submission_unique');
            $table->dropColumn(['submission_token', 'status', 'started_at', 'completed_at']);
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn('points');
        });

        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropIndex(['available_at']);
            $table->dropColumn('available_at');
        });

        Schema::table('modules', function (Blueprint $table) {
            $table->dropConstrainedForeignId('weekly_exam_quiz_id');
        });

        Schema::table('presentation_decks', function (Blueprint $table) {
            $table->dropIndex(['week_slot']);
            $table->dropColumn('week_slot');
        });
    }
};
