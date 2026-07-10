<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teaching_boards', function (Blueprint $table) {
            $table->foreignId('presentation_slide_id')
                ->nullable()
                ->after('lesson_id')
                ->constrained('presentation_slides')
                ->cascadeOnDelete();

            $table->index('presentation_slide_id');
        });
    }

    public function down(): void
    {
        Schema::table('teaching_boards', function (Blueprint $table) {
            $table->dropConstrainedForeignId('presentation_slide_id');
        });
    }
};
