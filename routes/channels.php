<?php

use App\Models\AnggotaKloter;
use App\Models\SesiKelasLive;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('live-class.{sessionId}', function ($user, int $sessionId) {
    $session = SesiKelasLive::find($sessionId);

    if (! $session || $session->status !== 'live') {
        return false;
    }

    if ((int) $session->mentor_id === (int) $user->id) {
        return ['id' => $user->id, 'name' => $user->username, 'role' => 'mentor'];
    }

    $isMember = AnggotaKloter::query()
        ->where('kloter_belajar_id', $session->kloter_belajar_id)
        ->where('user_id', $user->id)
        ->where('status', 'active')
        ->exists();

    return $isMember
        ? ['id' => $user->id, 'name' => $user->username, 'role' => 'student']
        : false;
});
