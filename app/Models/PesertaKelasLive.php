<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PesertaKelasLive extends Model
{
    use HasFactory;

    protected $table = 'live_class_participants';

    protected $fillable = [
        'live_class_session_id',
        'user_id',
        'role',
        'can_draw',
        'joined_at',
        'left_at',
        'mic_blocked_at',
        'kicked_at',
        'last_seen_at',
    ];

    protected function casts(): array
    {
        return [
            'can_draw' => 'boolean',
            'joined_at' => 'datetime',
            'left_at' => 'datetime',
            'mic_blocked_at' => 'datetime',
            'kicked_at' => 'datetime',
            'last_seen_at' => 'datetime',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(SesiKelasLive::class, 'live_class_session_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'user_id');
    }
}
