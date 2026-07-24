<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProgresHariModul extends Model
{
    use HasFactory;

    protected $table = 'module_day_progress';

    protected $fillable = [
        'user_id',
        'module_day_id',
        'score',
        'completed_at',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'user_id');
    }

    public function day(): BelongsTo
    {
        return $this->belongsTo(HariModul::class, 'module_day_id');
    }
}
