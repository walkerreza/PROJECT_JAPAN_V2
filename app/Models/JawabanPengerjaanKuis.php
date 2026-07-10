<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JawabanPengerjaanKuis extends Model
{
    protected $table = 'attempt_answers';

    use HasFactory;

    protected $fillable = [
        'attempt_id',
        'question_id',
        'answer_text',
        'answer_payload',
        'is_correct',
        'earned_points',
    ];

    protected $casts = [
        'answer_payload' => 'array',
        'is_correct' => 'boolean',
    ];

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(PengerjaanKuis::class, 'attempt_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Soal::class, 'question_id');
    }
}
