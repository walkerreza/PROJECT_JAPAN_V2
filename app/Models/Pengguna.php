<?php

namespace App\Models;

use App\Notifications\EmailVerificationNotification;
// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail as MustVerifyEmailContract;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Pengguna extends Authenticatable implements MustVerifyEmailContract
{
    protected $table = 'users';

    /** @use HasFactory<\Database\Factories\PenggunaFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'username',
        'email',
        'password',
        'password_login_enabled',
        'role',
        'subscription_status',
        'auth_provider',
        'google_id',
        'avatar',
        'status',
        'suspended_at',
        'suspended_reason',
        'xp',
        'level',
        'streak_count',
        'last_activity_date',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_activity_date' => 'date',
            'suspended_at' => 'datetime',
            'password' => 'hashed',
            'password_login_enabled' => 'boolean',
        ];
    }

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new EmailVerificationNotification);
    }

    public function attempts(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(PengerjaanKuis::class, 'user_id');
    }

    public function progress(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Progres::class, 'user_id');
    }

    public function certificates(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Sertifikat::class, 'user_id');
    }

    public function achievements(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Pencapaian::class, 'user_achievements', 'user_id', 'achievement_id')
            ->withPivot('unlocked_at')
            ->withTimestamps();
    }

    public function createdNews(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Berita::class, 'created_by');
    }

    public function activityLogs(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(LogAktivitas::class, 'actor_id');
    }

    public function loginHistories(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(RiwayatLogin::class, 'user_id');
    }

    public function statusHistories(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(RiwayatStatusPengguna::class, 'user_id');
    }

    public function subscriptions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Langganan::class, 'user_id');
    }

    public function transactions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Transaksi::class, 'user_id');
    }

    public function anggotaKloter(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(AnggotaKloter::class, 'user_id');
    }

    public function kloterBelajar(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(KloterBelajar::class, 'anggota_kloter', 'user_id', 'kloter_belajar_id')
            ->withPivot(['subscription_id', 'transaction_id', 'access_key_id', 'joined_at', 'status', 'catatan'])
            ->withTimestamps();
    }
}
