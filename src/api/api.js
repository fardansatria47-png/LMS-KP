import axios from "axios";

export const BASE_URL = "http://192.168.1.8:8000";
export const API_BASE_URL = `${BASE_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
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

// ✅ REQUEST INTERCEPTOR (TOKEN)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
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

      // 🔐 Token invalid / expired — skip broadcasting/auth endpoint
      const isAuthEndpoint = error.config?.url?.includes('/broadcasting/auth') || error.config?.url?.endsWith('/login');
      if (error.response.status === 401 && !isAuthEndpoint) {
        console.warn("Token expired / unauthorized");
        localStorage.removeItem("token");
        // optional redirect ke login
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
