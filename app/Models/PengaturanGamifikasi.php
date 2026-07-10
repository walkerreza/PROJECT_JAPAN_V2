<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PengaturanGamifikasi extends Model
{
    protected $table = 'gamification_settings';

    protected $fillable = [
        'key',
        'value',
        'description',
    ];

    protected $casts = [
        'value' => 'array',
    ];
}
