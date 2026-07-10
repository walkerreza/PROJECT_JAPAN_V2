<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('presentation_slides', function (Blueprint $table) {
            if (! Schema::hasColumn('presentation_slides', 'jamboard_data')) {
                $table->json('jamboard_data')->nullable()->after('canvas_json');
            }

            if (! Schema::hasColumn('presentation_slides', 'jamboard_snapshot')) {
                $table->longText('jamboard_snapshot')->nullable()->after('jamboard_data');
            }
        });

        if (Schema::hasTable('teaching_boards')) {
            $boards = DB::table('teaching_boards')
                ->whereNotNull('presentation_slide_id')
                ->get(['presentation_slide_id', 'board_data', 'snapshot_data']);

            foreach ($boards as $board) {
                DB::table('presentation_slides')
                    ->where('id', $board->presentation_slide_id)
                    ->update([
                        'jamboard_data' => $board->board_data,
                        'jamboard_snapshot' => $board->snapshot_data,
                    ]);
            }

            Schema::dropIfExists('teaching_boards');
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('teaching_boards')) {
            Schema::create('teaching_boards', function (Blueprint $table) {
                $table->id();
                $table->foreignId('level_id')->nullable()->constrained('levels')->nullOnDelete();
                $table->foreignId('module_id')->nullable()->constrained('modules')->nullOnDelete();
                $table->foreignId('presentation_slide_id')->nullable()->constrained('presentation_slides')->cascadeOnDelete();
                $table->string('title');
                $table->text('description')->nullable();
                $table->json('board_data')->nullable();
                $table->longText('snapshot_data')->nullable();
                $table->string('status', 20)->default('draft')->index();
                $table->timestamps();
            });
        }

        Schema::table('presentation_slides', function (Blueprint $table) {
            foreach (['jamboard_snapshot', 'jamboard_data'] as $column) {
                if (Schema::hasColumn('presentation_slides', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
