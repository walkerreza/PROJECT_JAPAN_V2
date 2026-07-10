<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Langganan extends Model
{
    protected $table = 'subscriptions';

    use HasFactory;

    protected $fillable = [
        'user_id',
        'payment_plan_id',
        'scope_type',
        'program_pembelajaran_id',
        'kloter_belajar_id',
        'status',
        'start_date',
        'end_date',
        'auto_renew',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'auto_renew' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(Pengguna::class, 'user_id');
    }

    public function paymentPlan()
    {
        return $this->belongsTo(PaketPembayaran::class, 'payment_plan_id');
    }

    public function transactions()
    {
        return $this->hasMany(Transaksi::class, 'subscription_id');
    }

    public function programPembelajaran()
    {
        return $this->belongsTo(ProgramPembelajaran::class, 'program_pembelajaran_id');
    }

    public function kloterBelajar()
    {
        return $this->belongsTo(KloterBelajar::class, 'kloter_belajar_id');
    }
}
