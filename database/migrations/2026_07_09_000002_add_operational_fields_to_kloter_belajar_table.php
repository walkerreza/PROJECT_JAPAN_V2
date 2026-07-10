<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kloter_belajar', function (Blueprint $table) {
            if (! Schema::hasColumn('kloter_belajar', 'max_siswa')) {
                $table->unsignedInteger('max_siswa')->nullable()->after('tanggal_selesai');
            }
        });
    }

    public function down(): void
    {
        Schema::table('kloter_belajar', function (Blueprint $table) {
            if (Schema::hasColumn('kloter_belajar', 'max_siswa')) {
                $table->dropColumn('max_siswa');
            }
        });
    }
};
