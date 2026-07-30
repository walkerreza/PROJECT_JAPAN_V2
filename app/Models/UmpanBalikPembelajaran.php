<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UmpanBalikPembelajaran extends Model
{
    use HasFactory;

    protected $table = 'learning_feedback';

    protected $fillable = [
        'user_id',
        'quiz_id',
        'module_id',
        'program_pembelajaran_id',
        'rating',
        'continue_learning',
        'feedback_date',
    ];

    protected function casts(): array
    {
        return [
            'continue_learning' => 'boolean',
            'feedback_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'user_id');
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Kuis::class, 'quiz_id');
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Modul::class, 'module_id');
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(ProgramPembelajaran::class, 'program_pembelajaran_id');
    }
}
