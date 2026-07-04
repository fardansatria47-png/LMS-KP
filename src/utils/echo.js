import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { getToken } from '../api/api';

window.Pusher = Pusher;
Pusher.logToConsole = true;

const AUTH_ENDPOINT = `${import.meta.env.VITE_API_BASE_URL || 'https://enchanting-intuition-production-d080.up.railway.app'}/api/broadcasting/auth`;

const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT || 443,
    wssPort: import.meta.env.VITE_REVERB_PORT || 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],

    // Custom authorizer: kirim Bearer token dari localStorage
    authEndpoint: AUTH_ENDPOINT,
    authorizer: (channel, options) => {
        return {
            authorize: (socketId, callback) => {
                // Ambil token terbaru setiap kali authorize dipanggil
                const token = getToken();

                fetch(AUTH_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        // ✅ Sisipkan Bearer token agar backend mengenali user
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        socket_id: socketId,
                        channel_name: channel.name,
                    }),
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Broadcasting auth gagal: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    callback(false, data);
                })
                .catch(error => {
                    console.error('[Echo Auth] Error:', error);
                    callback(true, error);
                });
            },
        };
    },
});

window.Echo = echo;

echo.connector?.pusher?.connection?.bind('connected', () => {
    console.log('[Echo] ✅ Reverb terhubung! Socket ID:', echo.socketId());
});

echo.connector?.pusher?.connection?.bind('error', (err) => {
    console.error('[Echo] ❌ Reverb connection error:', err);
});

export default echo;
