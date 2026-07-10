<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Flashcard extends Model
{
    protected $table = 'flashcards';

    use HasFactory;

    protected $fillable = [
        'flashcard_set_id',
        'vocabulary_id',
        'front_text',
        'reading',
        'back_text',
        'hint',
        'example_sentence',
        'example_meaning',
        'audio_url',
        'order',
    ];

    public function set()
    {
        return $this->belongsTo(SetFlashcard::class, 'flashcard_set_id');
    }

    public function vocabulary()
    {
        return $this->belongsTo(Kosakata::class, 'vocabulary_id');
    }

    public function reviews()
    {
        return $this->hasMany(ReviewFlashcard::class, 'flashcard_id');
    }
}

