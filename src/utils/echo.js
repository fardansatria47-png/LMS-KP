import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;
Pusher.logToConsole = true;

const REVERB_KEY    = import.meta.env.VITE_REVERB_APP_KEY;
const REVERB_HOST   = import.meta.env.VITE_REVERB_HOST;
const REVERB_PORT   = parseInt(import.meta.env.VITE_REVERB_PORT || "443", 10);
const REVERB_SCHEME = import.meta.env.VITE_REVERB_SCHEME || "https";
const API_BASE_URL  = import.meta.env.VITE_API_BASE_URL || "https://enchanting-intuition-production-d080.up.railway.app";

console.log("[Echo] Config →", { key: REVERB_KEY, host: REVERB_HOST, port: REVERB_PORT });

// Fungsi untuk membuat instance Echo dengan token terbaru
// Dipanggil sekali saat import, tapi token dibaca fresh setiap request auth
const createEcho = () => new Echo({
    broadcaster: "reverb",
    key: REVERB_KEY,
    wsHost: REVERB_HOST,
    wsPort: REVERB_PORT,
    wssPort: REVERB_PORT,
    forceTLS: REVERB_SCHEME === "https",
    enabledTransports: ["ws", "wss"],

    // ✅ KONFIGURASI PRIVATE CHANNEL - kirim JWT Bearer Token ke /api/broadcasting/auth
    authEndpoint: `${API_BASE_URL}/api/broadcasting/auth`,
    auth: {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            Accept: "application/json",
        },
    },
});

const echo = createEcho();

// Interceptor: refresh token di header auth sebelum setiap request broadcasting/auth
// (Penting jika token diperbarui setelah echo dibuat)
if (echo.connector?.pusher) {
    echo.connector.pusher.config.auth = {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            Accept: "application/json",
        },
    };
}

// Pasang ke window agar bisa diakses dari console browser untuk debugging
window.Echo = echo;

// Log status koneksi
echo.connector?.pusher?.connection?.bind("connected", () => {
    console.log("[Echo] ✅ Reverb terhubung! Socket ID:", echo.socketId());
    // Refresh token di auth header saat terhubung (pastikan token terbaru)
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
echo.connector?.pusher?.connection?.bind("state_change", (states) => {
    console.log("[Echo] State:", states.previous, "→", states.current);
});

export default echo;
