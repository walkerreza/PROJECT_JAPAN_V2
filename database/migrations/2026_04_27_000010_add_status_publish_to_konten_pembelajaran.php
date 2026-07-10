<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['modules', 'lessons', 'quizzes'] as $tableName) {
            if (! Schema::hasColumn($tableName, 'status')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->string('status', 30)->default('published')->index();
                });
            }
        }
    }

    public function down(): void
    {
        foreach (['modules', 'lessons', 'quizzes'] as $tableName) {
            if (Schema::hasColumn($tableName, 'status')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropColumn('status');
                });
            }
        }
    }
};
