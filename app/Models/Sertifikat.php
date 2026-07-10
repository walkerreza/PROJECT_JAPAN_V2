<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model Sertifikat
 *
 * Merepresentasikan sertifikat yang diterima user setelah menyelesaikan satu level JLPT.
 * Contoh: Setelah menyelesaikan semua module N5, user mendapat sertifikat N5.
 *
 * Tabel: certificates
 * Relasi:
 *   - belongs to Pengguna  (siapa yang mendapat sertifikat)
 *   - belongs to LevelPembelajaran (sertifikat untuk level apa: N5/N4/N3/N2/N1)
 */
class Sertifikat extends Model
{
    protected $table = 'certificates';

    protected $fillable = [
        'user_id',           // ID pemilik sertifikat
        'level_id',          // Sertifikat untuk level JLPT apa
        'issued_at',         // Tanggal sertifikat diterbitkan
        'certificate_number',// Nomor unik sertifikat (contoh: CERT-2026-00012)
        'file_path',         // Path file PDF di storage
    ];

    protected $casts = [
        'issued_at' => 'datetime',
    ];

    /**
     * Pengguna pemilik sertifikat ini
     */
    public function user()
    {
        return $this->belongsTo(Pengguna::class, 'user_id');
    }

    /**
     * LevelPembelajaran JLPT yang sudah diselesaikan (yang menjadi dasar penerbitan sertifikat)
     */
    public function level()
    {
        return $this->belongsTo(LevelPembelajaran::class, 'level_id');
    }
}
