<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kosakata extends Model
{
    use HasFactory;

    public const TYPE_KOSAKATA = 'kosakata';

    public const TYPE_KANJI = 'kanji';

    public const TYPE_BUNPO = 'bunpo';

    protected $table = 'vocabulary_bank';

    protected $fillable = [
        'content_type',
        'module_id',
        'word',
        'reading',
        'meaning_id',
        'meaning_en',
        'jlpt_level',
        'category',
        'tags',
        'example_sentence',
        'example_reading',
        'example_meaning',
        'audio_url',
        'source_type',
        'source_title',
        'metadata',
        'status',
    ];

    protected $casts = [
        'tags' => 'array',
        'metadata' => 'array',
    ];

    public static function contentTypes(): array
    {
        return [
            self::TYPE_KOSAKATA,
            self::TYPE_KANJI,
            self::TYPE_BUNPO,
        ];
    }

    public function module()
    {
        return $this->belongsTo(Modul::class, 'module_id');
    }

    public function flashcards()
    {
        return $this->hasMany(Flashcard::class, 'vocabulary_id');
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeType($query, ?string $type)
    {
        return $type && $type !== 'all'
            ? $query->where('content_type', $type)
            : $query;
    }

    public function scopeForModule($query, ?int $moduleId)
    {
        return $moduleId
            ? $query->where('module_id', $moduleId)
            : $query;
    }
}
