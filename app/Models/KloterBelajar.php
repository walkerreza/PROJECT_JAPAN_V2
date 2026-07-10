<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KloterBelajar extends Model
{
    use HasFactory;

    protected $table = 'kloter_belajar';

    protected $fillable = [
        'program_pembelajaran_id',
        'admin_id',
        'nama',
        'kode',
        'tanggal_mulai',
        'tanggal_selesai',
        'max_siswa',
        'is_default',
        'status',
        'catatan',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
        'is_default' => 'boolean',
    ];

    public function programPembelajaran(): BelongsTo
    {
        return $this->belongsTo(ProgramPembelajaran::class, 'program_pembelajaran_id');
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'admin_id');
    }

    public function anggota(): HasMany
    {
        return $this->hasMany(AnggotaKloter::class, 'kloter_belajar_id');
    }

    public function accessKeys(): HasMany
    {
        return $this->hasMany(KodeAkses::class, 'kloter_belajar_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Langganan::class, 'kloter_belajar_id');
    }
}
