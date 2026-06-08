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
    
    // Kembali menggunakan custom authorizer karena backend tidak memproses request form-data dari pusher-js dengan baik
    // api.post menjamin request dikirim sebagai JSON dan token Bearer disematkan dengan benar
    authorizer: (channel, options) => {
        return {
            authorize: (socketId, callback) => {
                api.post('/broadcasting/auth', {
                    socket_id: socketId,
                    channel_name: channel.name
                })
                .then(response => {
                    console.log(`[Echo Auth] Berhasil authorize channel: ${channel.name}`);
                    callback(false, response.data);
                })
                .catch(error => {
                    console.error(`[Echo Auth] Gagal authorize channel: ${channel.name}`, error);
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
