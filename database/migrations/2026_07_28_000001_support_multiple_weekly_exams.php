<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->unsignedSmallInteger('exam_order')
                ->nullable()
                ->after('module_day_id');
        });

        DB::table('modules')
            ->whereNotNull('weekly_exam_quiz_id')
            ->orderBy('id')
            ->each(function ($module) {
                DB::table('quizzes')
                    ->where('id', $module->weekly_exam_quiz_id)
                    ->update([
                        'module_day_id' => null,
                        'exam_order' => 1,
                    ]);
            });

        Schema::table('quizzes', function (Blueprint $table) {
            $table->unique(
                ['module_id', 'exam_order'],
                'quizzes_module_exam_order_unique'
            );
        });

        Schema::table('modules', function (Blueprint $table) {
            $table->dropConstrainedForeignId('weekly_exam_quiz_id');
        });
    }

    public function down(): void
    {
        Schema::table('modules', function (Blueprint $table) {
            $table->foreignId('weekly_exam_quiz_id')
                ->nullable()
                ->after('status')
                ->constrained('quizzes')
                ->nullOnDelete();
        });

        DB::table('quizzes')
            ->whereNotNull('exam_order')
            ->orderBy('module_id')
            ->orderBy('exam_order')
            ->get()
            ->groupBy('module_id')
            ->each(function ($exams, $moduleId) {
                DB::table('modules')
                    ->where('id', $moduleId)
                    ->update(['weekly_exam_quiz_id' => $exams->first()->id]);
            });

        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropUnique('quizzes_module_exam_order_unique');
            $table->dropColumn('exam_order');
        });
    }
};
