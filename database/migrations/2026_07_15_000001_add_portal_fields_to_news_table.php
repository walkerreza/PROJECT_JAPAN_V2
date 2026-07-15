<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('news', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('title');
            $table->string('category', 60)->default('platform')->after('audience');
            $table->timestamp('scheduled_at')->nullable()->after('published_at');
            $table->string('cover_image_path')->nullable()->after('body');
            $table->string('cover_image_alt', 160)->nullable()->after('cover_image_path');
            $table->string('cover_image_caption', 255)->nullable()->after('cover_image_alt');
            $table->string('seo_title', 70)->nullable()->after('cover_image_caption');
            $table->string('seo_description', 160)->nullable()->after('seo_title');
        });

        $usedSlugs = [];

        DB::table('news')->orderBy('id')->select(['id', 'title'])->each(function (object $news) use (&$usedSlugs): void {
            $base = Str::slug($news->title) ?: "news-{$news->id}";
            $slug = $base;
            $suffix = 2;

            while (isset($usedSlugs[$slug]) || DB::table('news')->where('slug', $slug)->where('id', '!=', $news->id)->exists()) {
                $slug = "{$base}-{$suffix}";
                $suffix++;
            }

            $usedSlugs[$slug] = true;

            DB::table('news')->where('id', $news->id)->update(['slug' => $slug]);
        });

        DB::table('news')->where('status', 'pending')->update(['status' => 'draft']);

        Schema::table('news', function (Blueprint $table) {
            $table->unique('slug');
            $table->index(['status', 'scheduled_at']);
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::table('news', function (Blueprint $table) {
            $table->dropIndex(['status', 'scheduled_at']);
            $table->dropIndex(['category']);
            $table->dropUnique(['slug']);
            $table->dropColumn([
                'slug',
                'category',
                'scheduled_at',
                'cover_image_path',
                'cover_image_alt',
                'cover_image_caption',
                'seo_title',
                'seo_description',
            ]);
        });
    }
};
