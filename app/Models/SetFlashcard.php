<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SetFlashcard extends Model
{
    protected $table = 'flashcard_sets';

    use HasFactory;

    protected $fillable = [
        'level_id',
        'module_id',
        'title',
        'description',
        'source_type',
        'status',
    ];

    public function level()
    {
        return $this->belongsTo(LevelPembelajaran::class, 'level_id');
    }

    public function module()
    {
        return $this->belongsTo(Modul::class, 'module_id');
    }

    public function flashcards()
    {
        return $this->hasMany(Flashcard::class, 'flashcard_set_id')->orderBy('order');
    }
}
