<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReviewSoal extends Model
{
    use HasFactory;

    protected $table = 'question_reviews';

    protected $fillable = [
        'user_id',
        'question_id',
        'quiz_id',
        'module_id',
        'status',
        'mastery_level',
        'correct_streak',
        'wrong_count',
        'review_count',
        'last_result',
        'last_answered_at',
        'next_review_at',
    ];

    protected $casts = [
        'last_answered_at' => 'datetime',
        'next_review_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'user_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Soal::class, 'question_id');
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Kuis::class, 'quiz_id');
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Modul::class, 'module_id');
    }
}
