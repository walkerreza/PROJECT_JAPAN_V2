<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->string('type', 50)->default('multiple_choice')->after('quiz_id');
        });

        DB::table('questions')->update([
            'type' => DB::raw("
                (
                    SELECT
                    CASE
                        WHEN quizzes.type IN ('fill_blank', 'typing') THEN 'fill_blank'
                        WHEN quizzes.type = 'listening' THEN 'listening'
                        ELSE 'multiple_choice'
                    END
                    FROM quizzes
                    WHERE quizzes.id = questions.quiz_id
                )
            "),
        ]);
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
