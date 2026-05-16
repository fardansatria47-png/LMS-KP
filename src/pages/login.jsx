import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { loginUser } from "../services/authService";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const successMessage = location.state?.successMessage || "";

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const payload = username.includes("@")
      ? { email: username, password }
      : { username, password };

    try {
      const res = await loginUser(payload);
      const token =
        res.data?.token ||
        res.data?.access_token ||
        res.data?.data?.token ||
        res.data?.data?.access_token;

      if (!token) {
        setMessage("Login berhasil, tetapi token tidak ditemukan.");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", token);
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }

      onLogin?.(token);
      navigate("/dashboard");
    } catch (err) {
      let displayMessage = "Login gagal";
      
      if (err.response) {
        // Server response dengan error
        const status = err.response?.status;
        const data = err.response?.data;
        displayMessage = data?.message || data?.error || `Error ${status || 'unknown'}`;
        if (status === 502) {
          displayMessage = `502 Bad Gateway: Backend tidak responsif. Periksa apakah 192.168.0.130:8000 aktif.`;
        }
      } else if (err.message === "Network Error") {
        displayMessage = "Network error: Periksa koneksi atau backend server.";
      } else {
        displayMessage = err.message || displayMessage;
      }
      
      setMessage(displayMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2 overflow-hidden">
      {/* Left Section */}
      <section className="hidden bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-950 px-6 py-12 text-white sm:flex sm:flex-col sm:justify-center sm:px-8 md:px-12 lg:px-16 lg:py-24">

        {/* Main Heading */}
        <div>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
            Selamat Datang di Learning Management System SMK - Yapsipa Tasikmalaya
          </h1>
        </div>
      </section>

      {/* Right Section */}
      <section className="flex items-center justify-center px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-24">
        <div className="w-full max-w-sm">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Selamat Datang</h2>
            <p className="text-xs text-slate-600 sm:text-sm">
              Silakan Masukkan Username dan Password Untuk Masuk ke Learning Manajement System  (LMS)
            </p>
          </div>

          <form className="mt-6 space-y-5 sm:mt-8 sm:space-y-6" onSubmit={handleLogin}>
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-slate-700">
                Nama Pengguna
              </label>
              <input
                type="text"
                placeholder="Masukkan nama pengguna"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Password with Eye Toggle */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-slate-700">
                Sandi
              </label>
              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan kata Sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-3">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="remember" className="text-sm text-slate-600">
                Ingat saya
              </label>
            </div>

            {/* Submit Button */}
            <button
              className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 sm:py-3"
              type="submit"
              disabled={loading}
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>

            {/* Error/Success Message */}
            {(successMessage || message) && (
              <p className={`text-center text-sm ${successMessage ? "text-emerald-600" : "text-rose-600"}`}>
                {successMessage || message}
              </p>
            )}
          </form>

          {/* Footer Links */}
          <div className="mt-5 space-y-4 text-center sm:mt-6">
          </div>
        </div>
      </section>
    </main>
  );
}