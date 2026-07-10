<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reward_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('source_type'); // 'lesson', 'quiz', 'achievement', 'streak'
            $table->unsignedBigInteger('source_id')->nullable();
            $table->integer('xp_amount');
            $table->string('description')->nullable();
            $table->timestamps();

            // Prevent duplicate entries easily using an index, if uniqueness is logically tied to these columns
            // $table->unique(['user_id', 'source_type', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reward_logs');
    }
};
