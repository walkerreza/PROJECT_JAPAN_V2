<?php

namespace App\Notifications\Channels;

use App\Models\Pengguna;
use App\Services\MailtrapTemplateService;
use Illuminate\Http\Client\RequestException;
use Illuminate\Notifications\Channels\MailChannel;
use Illuminate\Support\Facades\Log;

class MailtrapTemplateChannel
{
    public function __construct(
        private readonly MailtrapTemplateService $mailtrap,
        private readonly MailChannel $fallbackMail,
    )
    {
    }

    public function send(Pengguna $notifiable, object $notification): void
    {
        $message = $notification->toMailtrapTemplate($notifiable);

        try {
            $this->mailtrap->send($notifiable, $message['template'], $message['variables']);
        } catch (RequestException $exception) {
            Log::warning('Template Mailtrap gagal; email dikirim melalui SMTP fallback.', [
                'template' => $message['template'],
                'user_id' => $notifiable->id,
                'status' => $exception->response?->status(),
            ]);

            $this->fallbackMail->send($notifiable, $notification);
        }
    }
}
