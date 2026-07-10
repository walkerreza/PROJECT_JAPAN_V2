<?php

namespace App\Services;

use App\Models\AnggotaKloter;
use App\Models\KloterBelajar;
use App\Models\KodeAkses;
use App\Models\Langganan;
use App\Models\Pengguna;
use App\Models\Transaksi;
use Illuminate\Validation\ValidationException;

class KloterBelajarService
{
    public function kloterUntukPembayaran(?int $programPembelajaranId): ?KloterBelajar
    {
        $query = KloterBelajar::query()
            ->where('status', 'active')
            ->whereDate('tanggal_mulai', '<=', now()->toDateString())
            ->where(function ($query) {
                $query->whereNull('tanggal_selesai')
                    ->orWhereDate('tanggal_selesai', '>=', now()->toDateString());
            });

        if ($programPembelajaranId) {
            $query->where('program_pembelajaran_id', $programPembelajaranId);
        }

        return $query
            ->withCount(['anggota as anggota_aktif_count' => fn ($query) => $query->where('status', 'active')])
            ->orderByDesc('is_default')
            ->orderByDesc('tanggal_mulai')
            ->orderByDesc('id')
            ->get()
            ->first(fn (KloterBelajar $kloter) => $this->masihAdaKapasitas($kloter));
    }

    public function assignUser(
        Pengguna $user,
        KloterBelajar $kloter,
        ?Langganan $subscription = null,
        ?Transaksi $transaction = null,
        ?KodeAkses $accessKey = null,
        ?string $catatan = null
    ): AnggotaKloter {
        if (! $this->masihAdaKapasitas($kloter, $user->id)) {
            throw ValidationException::withMessages([
                'kloter' => 'Kapasitas kloter sudah penuh.',
            ]);
        }

        $anggota = AnggotaKloter::firstOrNew([
            'kloter_belajar_id' => $kloter->id,
            'user_id' => $user->id,
        ]);
        $shouldNotify = ! $anggota->exists || $anggota->status !== 'active';

        $anggota->fill([
            'subscription_id' => $subscription?->id ?: $anggota->subscription_id,
            'transaction_id' => $transaction?->id ?: $anggota->transaction_id,
            'access_key_id' => $accessKey?->id ?: $anggota->access_key_id,
            'joined_at' => $anggota->exists ? $anggota->joined_at : now(),
            'status' => 'active',
            'catatan' => $catatan ?: $anggota->catatan,
        ]);

        $anggota->save();

        if ($subscription && $subscription->kloter_belajar_id !== $kloter->id) {
            $subscription->update(['kloter_belajar_id' => $kloter->id]);
        }

        if ($transaction && $transaction->kloter_belajar_id !== $kloter->id) {
            $transaction->update(['kloter_belajar_id' => $kloter->id]);
        }

        if ($shouldNotify) {
            app(NotifikasiPenggunaService::class)->kirimKePengguna(
                $user,
                'kloter_assigned',
                'Kamu masuk kloter belajar',
                "Kamu sekarang masuk ke kloter {$kloter->nama}. Roadmap mingguan akan mengikuti jadwal kloter ini.",
                route('user.kelas.index'),
                ['kloter_id' => $kloter->id, 'program_id' => $kloter->program_pembelajaran_id]
            );
        }

        return $anggota;
    }

    public function kloterAktifUser(Pengguna $user, ?int $programPembelajaranId = null): ?KloterBelajar
    {
        return KloterBelajar::query()
            ->whereHas('anggota', fn ($query) => $query
                ->where('user_id', $user->id)
                ->where('status', 'active'))
            ->when($programPembelajaranId, fn ($query) => $query->where('program_pembelajaran_id', $programPembelajaranId))
            ->where('status', 'active')
            ->orderByDesc('tanggal_mulai')
            ->orderByDesc('id')
            ->first();
    }

    public function mingguAktif(?KloterBelajar $kloter): ?int
    {
        if (! $kloter?->tanggal_mulai) {
            return null;
        }

        if ($kloter->tanggal_mulai->isFuture()) {
            return 0;
        }

        return max(1, (int) floor($kloter->tanggal_mulai->copy()->startOfDay()->diffInDays(now()->startOfDay()) / 7) + 1);
    }

    public function masihAdaKapasitas(KloterBelajar $kloter, ?int $userId = null): bool
    {
        if ($userId && AnggotaKloter::where('kloter_belajar_id', $kloter->id)->where('user_id', $userId)->where('status', 'active')->exists()) {
            return true;
        }

        if (! $kloter->max_siswa) {
            return true;
        }

        $anggotaAktif = $kloter->anggota_aktif_count
            ?? AnggotaKloter::where('kloter_belajar_id', $kloter->id)->where('status', 'active')->count();

        return $anggotaAktif < $kloter->max_siswa;
    }
}
