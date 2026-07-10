<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RiwayatStatusPengguna extends Model
{
    protected $table = 'user_status_histories';

    use HasFactory;

    protected $fillable = [
        'user_id',
        'changed_by',
        'old_status',
        'new_status',
        'reason',
    ];

    public function user()
    {
        return $this->belongsTo(Pengguna::class, 'user_id');
    }

    public function changer()
    {
        return $this->belongsTo(Pengguna::class, 'changed_by');
    }
}
