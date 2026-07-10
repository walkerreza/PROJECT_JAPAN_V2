<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('presentation_decks', function (Blueprint $table) {
            if (! Schema::hasColumn('presentation_decks', 'source_type')) {
                $table->string('source_type', 30)->default('manual')->after('status')->index();
            }

            if (! Schema::hasColumn('presentation_decks', 'source_file_path')) {
                $table->string('source_file_path')->nullable()->after('source_type');
            }

            if (! Schema::hasColumn('presentation_decks', 'source_file_name')) {
                $table->string('source_file_name')->nullable()->after('source_file_path');
            }

            if (! Schema::hasColumn('presentation_decks', 'source_file_size')) {
                $table->unsignedBigInteger('source_file_size')->nullable()->after('source_file_name');
            }

            if (! Schema::hasColumn('presentation_decks', 'import_status')) {
                $table->string('import_status', 30)->default('ready')->after('source_file_size')->index();
            }

            if (! Schema::hasColumn('presentation_decks', 'import_summary')) {
                $table->json('import_summary')->nullable()->after('import_status');
            }
        });

        Schema::table('presentation_slides', function (Blueprint $table) {
            if (! Schema::hasColumn('presentation_slides', 'source_type')) {
                $table->string('source_type', 30)->default('manual')->after('order')->index();
            }

            if (! Schema::hasColumn('presentation_slides', 'canvas_json')) {
                $table->json('canvas_json')->nullable()->after('source_type');
            }

            if (! Schema::hasColumn('presentation_slides', 'snapshot_url')) {
                $table->string('snapshot_url')->nullable()->after('canvas_json');
            }

            if (! Schema::hasColumn('presentation_slides', 'source_meta')) {
                $table->json('source_meta')->nullable()->after('snapshot_url');
            }
        });
    }

    public function down(): void
    {
        Schema::table('presentation_slides', function (Blueprint $table) {
            foreach (['source_meta', 'snapshot_url', 'canvas_json', 'source_type'] as $column) {
                if (Schema::hasColumn('presentation_slides', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('presentation_decks', function (Blueprint $table) {
            foreach (['import_summary', 'import_status', 'source_file_size', 'source_file_name', 'source_file_path', 'source_type'] as $column) {
                if (Schema::hasColumn('presentation_decks', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
