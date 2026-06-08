import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import api from '../api/api';

window.Pusher = Pusher;
Pusher.logToConsole = true;

// Gunakan hardcode sementara untuk memastikan bukan masalah cache Vercel ENV
const echo = new Echo({
    broadcaster: "reverb",
    key: "lms-key",
    wsHost: "learning-management-system-production-8008.up.railway.app",
    wsPort: 443,
    wssPort: 443,
    forceTLS: true,
    enabledTransports: ["ws", "wss"],
    // Mengikuti instruksi persis dari backend developer menggunakan fetch
    authorizer: (channel, options) => {
        return {
            authorize: (socketId, callback) => {
                fetch('https://enchanting-intuition-production-d080.up.railway.app/api/broadcasting/auth', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        socket_id: socketId,
                        channel_name: channel.name,
                    }),
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log(`[Echo Auth] RAW Response dari Backend untuk ${channel.name}:`, JSON.stringify(data));
                    
                    // Pusher butuh { auth: "..." }. Jika backend membungkus di dalam 'data', kita keluarkan
                    let authObject = data;
                    if (!data.auth && data.data && data.data.auth) {
                        authObject = data.data;
                    }

                    if (!authObject.auth) {
                        console.error(`[Echo Auth] FATAL: Key 'auth' benar-benar tidak ada di response backend!`, data);
                    }
                    
                    callback(false, authObject);
                })
                .catch(error => {
                    console.error(`[Echo Auth] Fetch error:`, error);
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
