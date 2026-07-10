<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RiwayatLogin extends Model
{
    protected $table = 'login_histories';

    use HasFactory;

    protected $fillable = [
        'user_id',
        'email',
        'role',
        'status',
        'ip_address',
        'user_agent',
        'logged_in_at',
    ];

    protected $casts = [
        'logged_in_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(Pengguna::class, 'user_id');
    }
}
