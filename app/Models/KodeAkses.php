<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KodeAkses extends Model
{
    protected $table = 'access_keys';

    use HasFactory;

    protected $fillable = [
        'payment_plan_id',
        'scope_type',
        'program_pembelajaran_id',
        'kloter_belajar_id',
        'created_by',
        'code',
        'name',
        'duration_days',
        'max_uses',
        'used_count',
        'status',
        'starts_at',
        'expires_at',
        'notes',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function paymentPlan()
    {
        return $this->belongsTo(PaketPembayaran::class, 'payment_plan_id');
    }

    public function creator()
    {
        return $this->belongsTo(Pengguna::class, 'created_by');
    }

    public function redemptions()
    {
        return $this->hasMany(PenukaranKodeAkses::class, 'access_key_id');
    }

    public function programPembelajaran()
    {
        return $this->belongsTo(ProgramPembelajaran::class, 'program_pembelajaran_id');
    }

    public function kloterBelajar()
    {
        return $this->belongsTo(KloterBelajar::class, 'kloter_belajar_id');
    }

    public function isRedeemable(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        if ($this->starts_at && $this->starts_at->isFuture()) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        return $this->used_count < $this->max_uses;
    }
}
