<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model Pencapaian / Lencana.
 *
 * Menyimpan daftar pencapaian yang bisa dibuka oleh user berdasarkan aktivitas belajar.
 * Contoh:
 * - First Steps: selesaikan 1 modul.
 * - Week Warrior: streak 7 hari.
 * - Kuis Master: skor 100% di beberapa kuis.
 */
class Pencapaian extends Model
{
    protected $table = 'achievements';

    protected $fillable = [
        'name',
        'description',
        'icon',
        'xp_reward',
        'condition_type',
        'condition_value',
    ];

    public function users()
    {
        return $this->belongsToMany(Pengguna::class, 'user_achievements', 'achievement_id', 'user_id')
            ->withPivot('unlocked_at')
            ->withTimestamps();
    }
}
