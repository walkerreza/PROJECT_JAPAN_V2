<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Berita extends Model
{
    use HasFactory;

    protected $table = 'news';

    protected $fillable = [
        'created_by',
        'updated_by',
        'title',
        'excerpt',
        'body',
        'status',
        'audience',
        'is_pinned',
        'published_at',
        'starts_at',
        'ends_at',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
        'published_at' => 'datetime',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function creator()
    {
        return $this->belongsTo(Pengguna::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(Pengguna::class, 'updated_by');
    }

    public function attachments()
    {
        return $this->hasMany(LampiranBerita::class, 'news_id')->orderBy('sort_order');
    }

    public function thumbnailUrl(): ?string
    {
        $attachment = $this->relationLoaded('attachments')
            ? $this->attachments->firstWhere('file_type', 'image')
            : $this->attachments()->where('file_type', 'image')->first();

        if ($attachment?->file_path) {
            return asset("storage/{$attachment->file_path}");
        }

        if (! $this->body || ! preg_match('/<img[^>]+src=["\']([^"\']+)["\']/i', $this->body, $matches)) {
            return null;
        }

        $src = html_entity_decode($matches[1]);

        if (str_starts_with($src, 'http://') || str_starts_with($src, 'https://')) {
            return $src;
        }

        if (str_starts_with($src, 'data:image')) {
            return null;
        }

        return url($src);
    }
}
