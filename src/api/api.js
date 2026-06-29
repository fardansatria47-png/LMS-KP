import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://enchanting-intuition-production-d080.up.railway.app";
export const API_BASE_URL = `${BASE_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
  // 🍪 Kirim cookie HttpOnly secara otomatis di setiap request (termasuk cross-origin)
  withCredentials: true,
});

export const fixFileUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) {
    // Jika mengandung ngrok, ganti ke local IP
    if (url.includes("ngrok-free.app")) {
      return url.replace(/https?:\/\/[^\/]+/, BASE_URL);
    }
    return url;
  }
  // Jika path relatif (biasanya dari storage Laravel)
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${BASE_URL}${path}`;
};

// ✅ REQUEST INTERCEPTOR
// Token tidak perlu ditambahkan secara manual — browser otomatis menyisipkan
// cookie HttpOnly ke setiap request berkat withCredentials: true di atas.
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// ✅ RESPONSE INTERCEPTOR (ERROR HANDLING)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      console.error("⏰ Request timeout:", error.message);
    }

    if (error.message === "Network Error") {
      console.error("🌐 Network Error - cek backend / ngrok");
    }

    if (error.response) {
      console.error("📛 API Error:", {
        status: error.response.status,
        data: error.response.data,
      });

      // 🔐 Sesi tidak valid / cookie expired — skip broadcasting/auth endpoint
      const isAuthEndpoint = error.config?.url?.includes('/broadcasting/auth') || error.config?.url?.endsWith('/login');
      if (error.response.status === 401 && !isAuthEndpoint) {
        console.warn("[Auth] Sesi tidak valid atau cookie expired. Redirect ke login.");
        // Bersihkan state lokal yang masih tersisa (user_role, dll.)
        localStorage.removeItem("user_role");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
