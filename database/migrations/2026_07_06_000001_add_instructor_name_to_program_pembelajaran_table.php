<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('program_pembelajaran', function (Blueprint $table) {
            if (! Schema::hasColumn('program_pembelajaran', 'instructor_name')) {
                $table->string('instructor_name')->nullable()->after('description');
            }

            if (! Schema::hasColumn('program_pembelajaran', 'thumbnail_url')) {
                $table->string('thumbnail_url')->nullable()->after('instructor_name');
            }
        });

        DB::table('program_pembelajaran')
            ->where('slug', 'jlpt-n3-mingguan')
            ->update([
                'instructor_name' => 'Mas Fuad',
                'thumbnail_url' => '/build/assets/bahasa-jepang-guru-1-BKAqu58U.jpg',
            ]);
    }

    public function down(): void
    {
        Schema::table('program_pembelajaran', function (Blueprint $table) {
            if (Schema::hasColumn('program_pembelajaran', 'instructor_name')) {
                $table->dropColumn('instructor_name');
            }

            if (Schema::hasColumn('program_pembelajaran', 'thumbnail_url')) {
                $table->dropColumn('thumbnail_url');
            }
        });
    }
};
