import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import api from '../api/api';

window.Pusher = Pusher;
Pusher.logToConsole = true;

// Hardcode fallback credentials if .env is not loaded (e.g., Vite server not restarted)
const REVERB_KEY    = import.meta.env.VITE_REVERB_APP_KEY || "lms-key";
const REVERB_HOST   = import.meta.env.VITE_REVERB_HOST || "learning-management-system-production-8008.up.railway.app";
const REVERB_PORT   = parseInt(import.meta.env.VITE_REVERB_PORT || "443", 10);
const REVERB_SCHEME = import.meta.env.VITE_REVERB_SCHEME || "https";

console.log("[Echo] Config →", { key: REVERB_KEY, host: REVERB_HOST, port: REVERB_PORT, scheme: REVERB_SCHEME });

const echo = new Echo({
    broadcaster: "reverb",
    key: REVERB_KEY,
    wsHost: REVERB_HOST,
    wsPort: REVERB_PORT,
    wssPort: REVERB_PORT,
    forceTLS: REVERB_SCHEME === "https",
    enabledTransports: ["ws", "wss"],

    // Menggunakan custom authorizer agar selalu menggunakan token terbaru via interceptor api.js
    // Ini lebih andal untuk SPA (Single Page Application) dibanding authEndpoint statis
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
                    console.error(`[Echo Auth] Gagal authorize channel: ${channel.name}`, error?.response?.data || error.message);
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
