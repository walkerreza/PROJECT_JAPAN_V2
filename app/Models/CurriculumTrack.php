<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CurriculumTrack extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'status',
        'sort_order',
    ];

    public function levels(): HasMany
    {
        return $this->hasMany(LevelPembelajaran::class, 'curriculum_track_id');
    }

    public function programs(): HasMany
    {
        return $this->hasMany(ProgramPembelajaran::class, 'curriculum_track_id');
    }
}
