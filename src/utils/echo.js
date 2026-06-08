import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

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
    authEndpoint: "https://enchanting-intuition-production-d080.up.railway.app/api/broadcasting/auth",
    auth: {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            Accept: "application/json",
        },
    },
});

window.Echo = echo;

echo.connector?.pusher?.connection?.bind("connected", () => {
    console.log("[Echo] ✅ Reverb terhubung! Socket ID:", echo.socketId());
    
    // Refresh token secara dinamis jika authEndpoint dipanggil lagi
    if (echo.connector?.pusher) {
        echo.connector.pusher.config.auth = {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                Accept: "application/json",
            },
        };
    }
});

echo.connector?.pusher?.connection?.bind("error", (err) => {
    console.error("[Echo] ❌ Reverb connection error:", err);
});

export default echo;
