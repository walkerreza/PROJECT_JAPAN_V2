<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnggotaKloter extends Model
{
    use HasFactory;

    protected $table = 'anggota_kloter';

    protected $fillable = [
        'kloter_belajar_id',
        'user_id',
        'subscription_id',
        'transaction_id',
        'access_key_id',
        'joined_at',
        'status',
        'catatan',
    ];

    protected $casts = [
        'joined_at' => 'datetime',
    ];

    public function kloterBelajar(): BelongsTo
    {
        return $this->belongsTo(KloterBelajar::class, 'kloter_belajar_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'user_id');
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Langganan::class, 'subscription_id');
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaksi::class, 'transaction_id');
    }

    public function accessKey(): BelongsTo
    {
        return $this->belongsTo(KodeAkses::class, 'access_key_id');
    }
}
