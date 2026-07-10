<?php

namespace App\Services;

use App\Models\Modul;
use App\Models\Pengguna;
use App\Notifications\NotifikasiPengguna;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;

class NotifikasiPenggunaService
{
    public function __construct(private readonly AksesPremiumService $aksesPremium)
    {
    }

    public function kirimKePengguna(
        Pengguna $pengguna,
        string $jenis,
        string $judul,
        string $pesan,
        ?string $url = null,
        array $meta = [],
        ?string $category = null,
        ?string $severity = null,
        ?bool $sendMail = null,
    ): void {
        $category ??= $this->categoryFor($jenis);
        $severity ??= $this->severityFor($jenis);
        $sendMail ??= $this->shouldSendMail($jenis, $severity);
        $meta['dedupe_key'] ??= $this->targetKeyFromMeta($meta);

        if ($this->hasSimilarUnreadNotification($pengguna, $jenis, $meta)) {
            return;
        }

        $pengguna->notify(new NotifikasiPengguna($jenis, $judul, $pesan, $url, $meta, $category, $severity, $sendMail));
    }

    public function kirimKeRole(
        string|array $roles,
        string $jenis,
        string $judul,
        string $pesan,
        ?string $url = null,
        array $meta = [],
        ?string $category = null,
        ?string $severity = null,
        ?bool $sendMail = null,
    ): void {
        Pengguna::query()
            ->whereIn('role', (array) $roles)
            ->chunkById(100, function (EloquentCollection $users) use ($jenis, $judul, $pesan, $url, $meta, $category, $severity, $sendMail) {
                $users->each(fn (Pengguna $user) => $this->kirimKePengguna(
                    $user,
                    $jenis,
                    $judul,
                    $pesan,
                    $url,
                    $meta,
                    $category,
                    $severity,
                    $sendMail
                ));
            });
    }

    public function kirimKeSemuaPengguna(
        string $jenis,
        string $judul,
        string $pesan,
        ?string $url = null,
        array $meta = [],
    ): void {
        Pengguna::query()
            ->where('role', 'user')
            ->chunkById(100, function (EloquentCollection $users) use ($jenis, $judul, $pesan, $url, $meta) {
                $users->each(fn (Pengguna $user) => $this->kirimKePengguna($user, $jenis, $judul, $pesan, $url, $meta));
            });
    }

    public function kirimKePenggunaYangBisaAksesModul(
        Modul $module,
        string $jenis,
        string $judul,
        string $pesan,
        ?string $url = null,
        array $meta = [],
    ): void {
        Pengguna::query()
            ->where('role', 'user')
            ->chunkById(100, function (EloquentCollection $users) use ($module, $jenis, $judul, $pesan, $url, $meta) {
                $this->filterBisaAksesModule($users, $module)
                    ->each(fn (Pengguna $user) => $this->kirimKePengguna($user, $jenis, $judul, $pesan, $url, $meta));
            });
    }

    private function filterBisaAksesModule(EloquentCollection $users, Modul $module): Collection
    {
        return $users->filter(fn (Pengguna $user) => $this->aksesPremium->bolehAksesModul($user, $module));
    }

    private function hasSimilarUnreadNotification(Pengguna $pengguna, string $jenis, array $meta): bool
    {
        $targetKey = $meta['dedupe_key']
            ?? $this->targetKeyFromMeta($meta)
            ?? null;

        if (! $targetKey) {
            return false;
        }

        return $pengguna->unreadNotifications()
            ->where('data->type', $jenis)
            ->where('data->meta->dedupe_key', $targetKey)
            ->exists();
    }

    private function targetKeyFromMeta(array $meta): ?string
    {
        foreach (['transaction_id', 'module_id', 'quiz_id', 'flashcard_set_id', 'presentation_deck_id', 'vocabulary_id', 'achievement_id', 'kloter_id'] as $key) {
            if (isset($meta[$key])) {
                return "{$key}:{$meta[$key]}";
            }
        }

        return null;
    }

    private function categoryFor(string $jenis): string
    {
        return match (true) {
            str_starts_with($jenis, 'payment') => 'payment',
            str_contains($jenis, 'kloter'), str_contains($jenis, 'access_key') => 'access',
            str_starts_with($jenis, 'new_') => 'content',
            str_contains($jenis, 'achievement'), str_contains($jenis, 'week') => 'progress',
            default => 'system',
        };
    }

    private function severityFor(string $jenis): string
    {
        return match (true) {
            str_contains($jenis, 'failed'), str_contains($jenis, 'expired'), str_contains($jenis, 'full') => 'danger',
            str_contains($jenis, 'pending') => 'warning',
            str_contains($jenis, 'success'), str_contains($jenis, 'unlocked'), str_contains($jenis, 'assigned') => 'success',
            default => 'info',
        };
    }

    private function shouldSendMail(string $jenis, string $severity): bool
    {
        if ($severity === 'danger') {
            return true;
        }

        return in_array($jenis, [
            'payment_success',
            'payment_failed',
            'payment_expired',
            'access_key_redeemed',
            'kloter_assigned',
            'kloter_full',
            'manual_action_required',
        ], true);
    }
}
