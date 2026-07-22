<?php

namespace App\Services;

use App\Models\AnggotaKloter;
use App\Models\KloterBelajar;
use App\Models\KodeAkses;
use App\Models\Langganan;
use App\Models\Pengguna;
use App\Models\Transaksi;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class KloterBelajarService
{
    public function kloterDikelola(Pengguna $admin): Builder
    {
        abort_unless($admin->role === 'admin', 403);

        return KloterBelajar::query()
            ->when($admin->isAdminKloter(), fn (Builder $query) => $query->where('admin_id', $admin->id));
    }

    public function resolveKloterDikelola(Pengguna $admin, ?int $kloterId): ?KloterBelajar
    {
        if (! $kloterId) {
            return null;
        }

        return $this->kloterDikelola($admin)->findOrFail($kloterId);
    }

    public function pilihanKloterAdmin(Pengguna $admin): Collection
    {
        return $this->kloterDikelola($admin)
            ->with('programPembelajaran:id,title')
            ->withCount(['anggota as anggota_aktif_count' => fn (Builder $query) => $query->where('status', 'active')])
            ->orderByRaw("CASE status WHEN 'active' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END")
            ->orderByDesc('tanggal_mulai')
            ->get()
            ->map(fn (KloterBelajar $kloter) => [
                'id' => $kloter->id,
                'name' => $kloter->nama,
                'program_name' => $kloter->programPembelajaran?->title,
                'program_id' => $kloter->program_pembelajaran_id,
                'status' => $kloter->status,
                'tanggal_mulai' => optional($kloter->tanggal_mulai)->format('Y-m-d'),
                'tanggal_selesai' => optional($kloter->tanggal_selesai)->format('Y-m-d'),
                'anggota_aktif_count' => (int) $kloter->anggota_aktif_count,
                'max_siswa' => $kloter->max_siswa,
                'is_read_only' => $kloter->status === 'archived',
            ]);
    }

    public function programIdsDikelola(Pengguna $admin, ?KloterBelajar $kloter = null): ?Collection
    {
        if ($kloter) {
            return collect([(int) $kloter->program_pembelajaran_id]);
        }

        if ($admin->isAdminGlobal()) {
            return null;
        }

        return $this->kloterDikelola($admin)
            ->distinct()
            ->pluck('program_pembelajaran_id')
            ->map(fn ($id) => (int) $id)
            ->values();
    }

    public function batasiSiswaDikelola(Builder $query, Pengguna $admin, ?KloterBelajar $kloter = null): Builder
    {
        if ($admin->isAdminGlobal() && ! $kloter) {
            return $query;
        }

        return $query->whereHas('anggotaKloter', function (Builder $anggotaQuery) use ($admin, $kloter) {
            $anggotaQuery
                ->where('status', 'active')
                ->whereHas('kloterBelajar', function (Builder $kloterQuery) use ($admin, $kloter) {
                    $kloterQuery
                        ->when($admin->isAdminKloter(), fn (Builder $query) => $query->where('admin_id', $admin->id))
                        ->when($kloter, fn (Builder $query) => $query->whereKey($kloter->id));
                });
        });
    }

    public function abortJikaSiswaDiLuarCakupan(Pengguna $admin, Pengguna $student): void
    {
        abort_unless($student->role === 'user', 404);

        $allowed = $this->batasiSiswaDikelola(
            Pengguna::query()->whereKey($student->id),
            $admin
        )->exists();

        abort_unless($allowed, 403, 'Siswa ini bukan anggota kloter yang Anda kelola.');
    }

    public function abortJikaKloterDiLuarCakupan(Pengguna $admin, KloterBelajar $kloter): void
    {
        abort_unless(
            $admin->isAdminGlobal() || ($admin->isAdminKloter() && $kloter->admin_id === $admin->id),
            403,
            'Kloter ini berada di luar cakupan akun Anda.'
        );
    }

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
