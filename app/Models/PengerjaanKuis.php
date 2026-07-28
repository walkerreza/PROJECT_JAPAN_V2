<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PengerjaanKuis extends Model
{
    protected $table = 'attempts';

    use HasFactory;

    protected $fillable = [
        'user_id',
        'quiz_id',
        'submission_token',
        'status',
        'score',
        'xp_earned',
        'started_at',
        'completed_at',
        'attempted_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'attempted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'user_id');
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Kuis::class, 'quiz_id');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(JawabanPengerjaanKuis::class, 'attempt_id');
    }
}
