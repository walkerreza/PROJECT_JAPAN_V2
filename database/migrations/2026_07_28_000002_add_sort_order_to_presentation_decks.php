<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('presentation_decks', function (Blueprint $table) {
            $table->unsignedSmallInteger('sort_order')->default(0)->after('week_slot');
            $table->index(
                ['module_id', 'week_slot', 'module_day_id', 'sort_order'],
                'presentation_decks_roadmap_order_index'
            );
        });
    }

    public function down(): void
    {
        Schema::table('presentation_decks', function (Blueprint $table) {
            $table->dropIndex('presentation_decks_roadmap_order_index');
            $table->dropColumn('sort_order');
        });
    }
};
