<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kuis extends Model
{
    protected $table = 'quizzes';

    use HasFactory;

    protected $fillable = [
        'module_id',
        'type',
        'time_limit',
        'passing_score',
        'status',
    ];

    public function module(): BelongsTo
    {
        return $this->belongsTo(Modul::class, 'module_id');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Soal::class, 'quiz_id')->orderBy('order');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(PengerjaanKuis::class, 'quiz_id');
    }

    public function questionReviews(): HasMany
    {
        return $this->hasMany(ReviewSoal::class, 'quiz_id');
    }
}
