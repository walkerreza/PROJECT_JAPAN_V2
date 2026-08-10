<?php

namespace App\Events;

use App\Models\SesiKelasLive;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StatusKelasLiveDiperbarui implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public SesiKelasLive $session,
        public array $state,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('live-class.'.$this->session->id)];
    }

    public function broadcastAs(): string
    {
        return 'state.updated';
    }

    public function broadcastWith(): array
    {
        return $this->state;
    }
}
