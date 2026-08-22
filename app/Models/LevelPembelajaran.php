<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LevelPembelajaran extends Model
{
    protected $table = 'levels';

    use HasFactory;

    protected $fillable = [
        'curriculum_track_id',
        'level_name',
        'stage',
        'is_premium',
    ];

    public function curriculumTrack(): BelongsTo
    {
        return $this->belongsTo(CurriculumTrack::class, 'curriculum_track_id');
    }

    public function modules(): HasMany
    {
        return $this->hasMany(Modul::class, 'level_id');
    }

    public function programPembelajaran(): HasMany
    {
        return $this->hasMany(ProgramPembelajaran::class, 'level_id');
    }
}
