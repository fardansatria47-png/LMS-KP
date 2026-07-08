import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://enchanting-intuition-production-d080.up.railway.app";
export const API_BASE_URL = `${BASE_URL}/api`;

// 🔑 Helper untuk menyimpan & mengambil token (aman di semua browser termasuk Safari iOS)
export const getToken = () => localStorage.getItem("auth_token");
export const setToken = (token) => localStorage.setItem("auth_token", token);
export const removeToken = () => localStorage.removeItem("auth_token");

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
  // ⚠️ withCredentials dinonaktifkan — Safari iOS memblokir cookie cross-origin (ITP).
  // Autentikasi kini menggunakan Bearer token via Authorization header.
  withCredentials: false,
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
  // Pastikan path mengarah ke /storage/ jika tidak diawali dengan /storage atau storage
  let cleanPath = url;
  if (!cleanPath.startsWith("storage/") && !cleanPath.startsWith("/storage/")) {
    cleanPath = `storage/${cleanPath.startsWith("/") ? cleanPath.substring(1) : cleanPath}`;
  }
  const path = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return `${BASE_URL}${path}`;
};

// ✅ REQUEST INTERCEPTOR — Sisipkan Bearer token di setiap request
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
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

      // 🔐 Token tidak valid / expired — skip broadcasting/auth endpoint
      const isAuthEndpoint = error.config?.url?.includes('/broadcasting/auth') || error.config?.url?.endsWith('/login');
      if (error.response.status === 401 && !isAuthEndpoint) {
        console.warn("[Auth] Token tidak valid atau expired. Redirect ke login.");
        // Bersihkan semua data lokal
        removeToken();
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
