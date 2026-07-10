<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LevelPembelajaran extends Model
{
    protected $table = 'levels';

    use HasFactory;

    protected $fillable = [
        'level_name',
        'stage',
        'is_premium',
    ];

    public function modules(): HasMany
    {
        return $this->hasMany(Modul::class, 'level_id');
    }

    public function programPembelajaran(): HasMany
    {
        return $this->hasMany(ProgramPembelajaran::class, 'level_id');
    }
}
