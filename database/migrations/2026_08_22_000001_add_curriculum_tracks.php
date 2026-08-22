<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('curriculum_tracks', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name', 100);
            $table->string('status', 20)->default('active')->index();
            $table->unsignedInteger('sort_order')->default(1);
            $table->timestamps();

            $table->index(['status', 'sort_order']);
        });

        Schema::table('levels', function (Blueprint $table) {
            $table->foreignId('curriculum_track_id')
                ->nullable()
                ->after('id')
                ->constrained('curriculum_tracks')
                ->nullOnDelete();
        });

        Schema::table('program_pembelajaran', function (Blueprint $table) {
            $table->foreignId('curriculum_track_id')
                ->nullable()
                ->after('id')
                ->constrained('curriculum_tracks')
                ->nullOnDelete();
        });

        Schema::table('vocabulary_bank', function (Blueprint $table) {
            $table->string('jlpt_level', 8)->nullable()->default(null)->change();
        });

        $now = now();
        DB::table('curriculum_tracks')->insert([
            ['code' => 'jlpt', 'name' => 'JLPT', 'status' => 'active', 'sort_order' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'ssw', 'name' => 'SSW', 'status' => 'active', 'sort_order' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'tg', 'name' => 'TG Jepang', 'status' => 'active', 'sort_order' => 3, 'created_at' => $now, 'updated_at' => $now],
        ]);

        $jlptId = DB::table('curriculum_tracks')->where('code', 'jlpt')->value('id');

        DB::table('levels')->whereNull('curriculum_track_id')->update([
            'curriculum_track_id' => $jlptId,
        ]);

        DB::table('program_pembelajaran')->whereNull('curriculum_track_id')->update([
            'curriculum_track_id' => $jlptId,
        ]);
    }

    public function down(): void
    {
        DB::table('vocabulary_bank')->whereNull('jlpt_level')->update([
            'jlpt_level' => 'N3',
        ]);

        Schema::table('vocabulary_bank', function (Blueprint $table) {
            $table->string('jlpt_level', 8)->default('N3')->nullable(false)->change();
        });

        Schema::table('program_pembelajaran', function (Blueprint $table) {
            $table->dropConstrainedForeignId('curriculum_track_id');
        });

        Schema::table('levels', function (Blueprint $table) {
            $table->dropConstrainedForeignId('curriculum_track_id');
        });

        Schema::dropIfExists('curriculum_tracks');
    }
};
