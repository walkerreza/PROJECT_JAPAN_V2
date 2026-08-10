import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

let echoInstance = null;

export function getEcho() {
    if (echoInstance) return echoInstance;

    window.Pusher = Pusher;
    echoInstance = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
        wsPort: Number(import.meta.env.VITE_REVERB_PORT || 8080),
        wssPort: Number(import.meta.env.VITE_REVERB_PORT || 443),
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
    });

    return echoInstance;
}

export function leaveLiveClassChannel(sessionId) {
    echoInstance?.leave(`live-class.${sessionId}`);
}
