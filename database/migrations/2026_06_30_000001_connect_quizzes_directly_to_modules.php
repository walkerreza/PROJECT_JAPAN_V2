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
            if (! Schema::hasColumn('quizzes', 'module_id')) {
                $table->foreignId('module_id')
                    ->nullable()
                    ->after('lesson_id')
                    ->constrained('modules')
                    ->nullOnDelete();

                $table->index(['module_id', 'status']);
            }
        });

        DB::table('quizzes')
            ->whereNull('module_id')
            ->orderBy('id')
            ->chunkById(100, function ($quizzes) {
                foreach ($quizzes as $quiz) {
                    if (! $quiz->lesson_id) {
                        continue;
                    }

                    $moduleId = DB::table('lessons')
                        ->where('id', $quiz->lesson_id)
                        ->value('module_id');

                    if ($moduleId) {
                        DB::table('quizzes')
                            ->where('id', $quiz->id)
                            ->update(['module_id' => $moduleId]);
                    }
                }
            });

        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropForeign(['lesson_id']);
            $table->foreignId('lesson_id')->nullable()->change();
            $table->foreign('lesson_id')->references('id')->on('lessons')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            if (Schema::hasColumn('quizzes', 'module_id')) {
                $table->dropForeign(['module_id']);
                $table->dropIndex(['module_id', 'status']);
                $table->dropColumn('module_id');
            }
        });
    }
};
