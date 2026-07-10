<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LogTransaksi extends Model
{
    protected $table = 'transaction_logs';

    use HasFactory;

    protected $fillable = [
        'transaction_id',
        'changed_by',
        'old_status',
        'new_status',
        'notes',
    ];

    public function transaction()
    {
        return $this->belongsTo(Transaksi::class, 'transaction_id');
    }

    public function changer()
    {
        return $this->belongsTo(Pengguna::class, 'changed_by');
    }
}
