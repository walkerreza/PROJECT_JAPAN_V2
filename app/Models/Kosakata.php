<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kosakata extends Model
{
    use HasFactory;

    protected $table = 'vocabulary_bank';

    protected $fillable = [
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
        'status',
    ];

    protected $casts = [
        'tags' => 'array',
    ];

    public function flashcards()
    {
        return $this->hasMany(Flashcard::class, 'vocabulary_id');
    }
}

