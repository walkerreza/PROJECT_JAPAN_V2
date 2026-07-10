<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SlidePresentasi extends Model
{
    protected $table = 'presentation_slides';

    use HasFactory;

    protected $fillable = [
        'presentation_deck_id',
        'title',
        'layout',
        'content',
        'media_url',
        'background',
        'accent_color',
        'speaker_notes',
        'order',
        'source_type',
        'canvas_json',
        'jamboard_data',
        'jamboard_snapshot',
        'snapshot_url',
        'source_meta',
    ];

    protected $casts = [
        'canvas_json' => 'array',
        'jamboard_data' => 'array',
        'source_meta' => 'array',
    ];

    public function deck(): BelongsTo
    {
        return $this->belongsTo(DeckPresentasi::class, 'presentation_deck_id');
    }

}
