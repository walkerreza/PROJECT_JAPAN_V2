<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vocabulary_bank', function (Blueprint $table) {
            if (! Schema::hasColumn('vocabulary_bank', 'content_type')) {
                $table->string('content_type', 20)->default('kosakata')->index()->after('id');
            }

            if (! Schema::hasColumn('vocabulary_bank', 'module_id')) {
                $table->foreignId('module_id')->nullable()->after('content_type')->constrained('modules')->nullOnDelete();
            }

            if (! Schema::hasColumn('vocabulary_bank', 'source_type')) {
                $table->string('source_type', 30)->nullable()->index()->after('audio_url');
            }

            if (! Schema::hasColumn('vocabulary_bank', 'source_title')) {
                $table->string('source_title')->nullable()->after('source_type');
            }

            if (! Schema::hasColumn('vocabulary_bank', 'metadata')) {
                $table->json('metadata')->nullable()->after('source_title');
            }
        });
    }

    public function down(): void
    {
        Schema::table('vocabulary_bank', function (Blueprint $table) {
            if (Schema::hasColumn('vocabulary_bank', 'module_id')) {
                $table->dropConstrainedForeignId('module_id');
            }

            foreach (['metadata', 'source_title', 'source_type', 'content_type'] as $column) {
                if (Schema::hasColumn('vocabulary_bank', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
