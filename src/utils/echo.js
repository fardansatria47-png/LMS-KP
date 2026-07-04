import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;
Pusher.logToConsole = true;

// Token tidak lagi dibaca dari localStorage — autentikasi menggunakan cookie HttpOnly
// yang akan dikirim browser secara otomatis berkat credentials: 'include'

// Mengikuti instruksi persis dari backend developer (Solusi authEndpoint dengan header Accept)
const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT || 443,
    wssPort: import.meta.env.VITE_REVERB_PORT || 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
    
    // Konfigurasi endpoint sesuai instruksi backend
    authEndpoint: 'https://enchanting-intuition-production-d080.up.railway.app/api/broadcasting/auth',
    authorizer: (channel, options) => {
        return {
            authorize: (socketId, callback) => {
                fetch(options.authEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        // 🍪 Tidak perlu header Authorization manual —
                        // cookie HttpOnly dikirim otomatis oleh browser
                    },
                    credentials: 'include', // Wajib agar cookie dikirim pada request cross-origin
                    body: JSON.stringify({
                        socket_id: socketId,
                        channel_name: channel.name
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    callback(false, data);
                })
                .catch(error => {
                    console.error("[Echo Auth] Error:", error);
                    callback(true, error);
                });
            }
        };
    },
});

window.Echo = echo;

echo.connector?.pusher?.connection?.bind("connected", () => {
    console.log("[Echo] ✅ Reverb terhubung! Socket ID:", echo.socketId());
});

echo.connector?.pusher?.connection?.bind("error", (err) => {
    console.error("[Echo] ❌ Reverb connection error:", err);
});

export default echo;
