<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_exam_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('program_pembelajaran_id')->constrained('program_pembelajaran')->cascadeOnDelete();
            $table->date('exam_date');
            $table->timestamps();

            $table->unique(['user_id', 'program_pembelajaran_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_exam_targets');
    }
};
