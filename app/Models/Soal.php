<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Soal extends Model
{
    protected $table = 'questions';

    use HasFactory;

    protected $fillable = [
        'quiz_id',
        'type',
        'question_text',
        'correct_answer',
        'explanation',
        'options',
        'audio_url',
        'order',
    ];

    protected $casts = [
        'options' => 'array',
    ];

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Kuis::class, 'quiz_id');
    }

    public function attemptAnswers(): HasMany
    {
        return $this->hasMany(JawabanPengerjaanKuis::class, 'question_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(ReviewSoal::class, 'question_id');
    }
}
