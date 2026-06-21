import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;
Pusher.logToConsole = true;

// Ambil token dari localStorage
const token = localStorage.getItem('token') || '';

// Mengikuti instruksi persis dari backend developer (Solusi authEndpoint dengan header Accept)
const echo = new Echo({
    broadcaster: 'reverb',
    key: 'lms-key', 
    wsHost: 'learning-management-system-production-8008.up.railway.app', 
    wsPort: 443,
    wssPort: 443,
    forceTLS: true,
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
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
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
