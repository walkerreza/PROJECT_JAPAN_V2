<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LogReward extends Model
{
    protected $table = 'reward_logs';

    use HasFactory;

    protected $fillable = [
        'user_id',
        'source_type',
        'source_id',
        'xp_amount',
        'description',
    ];

    public function user()
    {
        return $this->belongsTo(Pengguna::class, 'user_id');
    }
}
