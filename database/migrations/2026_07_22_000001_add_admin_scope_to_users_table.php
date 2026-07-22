<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('admin_scope', 20)->nullable()->after('role')->index();
        });

        DB::table('users')
            ->where('role', 'admin')
            ->update(['admin_scope' => 'global']);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['admin_scope']);
            $table->dropColumn('admin_scope');
        });
    }
};
