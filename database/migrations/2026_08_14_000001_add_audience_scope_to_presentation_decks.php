<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('presentation_decks', function (Blueprint $table) {
            $table->foreignId('created_by')
                ->nullable()
                ->after('level_id')
                ->constrained('users')
                ->nullOnDelete();
            $table->string('audience_scope', 30)
                ->default('shared')
                ->after('status')
                ->index();
        });
    }

    public function down(): void
    {
        Schema::table('presentation_decks', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropIndex(['audience_scope']);
            $table->dropColumn(['created_by', 'audience_scope']);
        });
    }
};
