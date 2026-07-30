<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TargetUjianPengguna extends Model
{
    use HasFactory;

    protected $table = 'user_exam_targets';

    protected $fillable = [
        'user_id',
        'program_pembelajaran_id',
        'exam_date',
    ];

    protected function casts(): array
    {
        return [
            'exam_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'user_id');
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(ProgramPembelajaran::class, 'program_pembelajaran_id');
    }
}
