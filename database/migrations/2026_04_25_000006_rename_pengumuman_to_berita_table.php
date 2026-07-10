<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('announcements') && ! Schema::hasTable('news')) {
            Schema::rename('announcements', 'news');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('news') && ! Schema::hasTable('announcements')) {
            Schema::rename('news', 'announcements');
        }
    }
};
