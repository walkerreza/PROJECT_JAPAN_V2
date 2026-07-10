<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PenukaranKodeAkses extends Model
{
    protected $table = 'access_key_redemptions';

    use HasFactory;

    protected $fillable = [
        'access_key_id',
        'user_id',
        'subscription_id',
        'kloter_belajar_id',
        'redeemed_at',
        'ip_address',
    ];

    protected $casts = [
        'redeemed_at' => 'datetime',
    ];

    public function accessKey()
    {
        return $this->belongsTo(KodeAkses::class, 'access_key_id');
    }

    public function user()
    {
        return $this->belongsTo(Pengguna::class, 'user_id');
    }

    public function subscription()
    {
        return $this->belongsTo(Langganan::class, 'subscription_id');
    }

    public function kloterBelajar()
    {
        return $this->belongsTo(KloterBelajar::class, 'kloter_belajar_id');
    }
}
