<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeckPresentasi extends Model
{
    protected $table = 'presentation_decks';

    use HasFactory;

    protected $fillable = [
        'level_id',
        'module_id',
        'title',
        'description',
        'status',
        'source_type',
        'source_file_path',
        'source_file_name',
        'source_file_size',
        'import_status',
        'import_summary',
    ];

    protected $casts = [
        'import_summary' => 'array',
    ];

    protected $appends = [
        'source_file_url',
    ];

    public function level(): BelongsTo
    {
        return $this->belongsTo(LevelPembelajaran::class, 'level_id');
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Modul::class, 'module_id');
    }

    public function slides(): HasMany
    {
        return $this->hasMany(SlidePresentasi::class, 'presentation_deck_id')->orderBy('order');
    }

    public function getSourceFileUrlAttribute(): ?string
    {
        $path = $this->finalPdfPath();

        if (! $path) {
            return null;
        }

        if (str_starts_with($path, 'http')) {
            return $path;
        }

        return route('presentations.pdf.content', $this, false);
    }

    public function finalPdfPath(): ?string
    {
        if ($this->source_type === 'pdf' && filled($this->source_file_path)) {
            return $this->source_file_path;
        }

        $slide = $this->relationLoaded('slides')
            ? $this->slides->where('layout', 'pdf')->where('source_type', 'pdf')->last()
            : $this->slides()->where('layout', 'pdf')->where('source_type', 'pdf')->latest('id')->first();

        return $slide?->source_meta['path'] ?? null;
    }

    public function finalPdfName(): string
    {
        if ($this->source_type === 'pdf' && filled($this->source_file_name)) {
            return $this->source_file_name;
        }

        $slide = $this->relationLoaded('slides')
            ? $this->slides->where('layout', 'pdf')->where('source_type', 'pdf')->last()
            : $this->slides()->where('layout', 'pdf')->where('source_type', 'pdf')->latest('id')->first();

        return $slide?->source_meta['original_name'] ?? "presentasi-{$this->id}.pdf";
    }
}
