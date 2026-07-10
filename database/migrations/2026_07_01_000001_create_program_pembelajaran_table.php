<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('program_pembelajaran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('level_id')->nullable()->constrained('levels')->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('status', 30)->default('published')->index();
            $table->unsignedInteger('sort_order')->default(1);
            $table->timestamps();

            $table->index(['status', 'sort_order']);
        });

        Schema::table('modules', function (Blueprint $table) {
            if (! Schema::hasColumn('modules', 'program_pembelajaran_id')) {
                $table->foreignId('program_pembelajaran_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('program_pembelajaran')
                    ->nullOnDelete();
            }
        });

        $levelId = DB::table('levels')->where('level_name', 'JLPT N3')->value('id');
        $programId = DB::table('program_pembelajaran')->insertGetId([
            'level_id' => $levelId,
            'title' => 'JLPT N3 Mingguan',
            'slug' => Str::slug('JLPT N3 Mingguan'),
            'description' => 'Program belajar mingguan yang menggabungkan flashcard dan kuis dalam satu roadmap.',
            'status' => 'published',
            'sort_order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('modules')
            ->whereNull('program_pembelajaran_id')
            ->update(['program_pembelajaran_id' => $programId]);
    }

    public function down(): void
    {
        Schema::table('modules', function (Blueprint $table) {
            if (Schema::hasColumn('modules', 'program_pembelajaran_id')) {
                $table->dropConstrainedForeignId('program_pembelajaran_id');
            }
        });

        Schema::dropIfExists('program_pembelajaran');
    }
};
