import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginUser } from "../services/authService";

export default function Login({ onLogin }) {
  const [username, setUsername]       = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage]         = useState("");
  const [loading, setLoading]         = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

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
      onLogin?.(token);
      navigate("/dashboard");
    } catch (err) {
      let displayMessage = "Login gagal";
      if (err.response) {
        const status = err.response?.status;
        const data   = err.response?.data;
        displayMessage = data?.message || data?.error || `Error ${status || "unknown"}`;
        if (status === 502) displayMessage = "502 Bad Gateway: Backend tidak responsif.";
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

      {/* ── Left Panel (desktop only) ─────────────────────── */}
      <section className="hidden lg:flex flex-col justify-center px-16 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-10 h-48 w-48 rounded-full bg-blue-500/20" />

        <div className="relative z-10 max-w-md">
          {/* Logo / Badge */}
          <div className="mb-8 inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-blue-700">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
              </svg>
            </div>
            <span className="text-sm font-bold tracking-widest text-white/90 uppercase">LMS</span>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight text-white">
            Selamat Datang di<br />
            <span className="text-blue-200">Learning Management<br />System</span>
          </h1>
          <p className="mt-5 text-base text-blue-100/80 leading-relaxed">
            SMK YAPSIPA Tasikmalaya Platform Pembelajaran Digital Untuk Guru dan Siswa.
          </p>
        </div>
      </section>

      {/* ── Right Panel — Form ─────────────────────────────── */}
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 bg-slate-50">
        <div className="w-full max-w-sm">

          {/* Mobile-only logo */}
          <div className="mb-7 flex flex-col items-center lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-200">
              <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
              </svg>
            </div>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-blue-600">LMS</p>
            <p className="text-[10px] text-slate-400 font-medium">SMK YAPSIPA Tasikmalaya</p>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-8">

            {/* Heading */}
            <div className="mb-7">
              <h2 className="text-xl font-extrabold text-slate-900 text-center">Selamat Datang</h2>
              <p className="mt-1 text-xs text-slate-500 text-center">
                Selamat Datang di Learning Management System Yapsipa Tasikmalaya
              </p>
            </div>

            {/* Success banner */}
            {successMessage && (
              <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-medium text-emerald-700">
                {successMessage}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleLogin}>
              {/* Username */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Nama Pengguna
                </label>
                <input
                  type="text"
                  placeholder="Masukkan nama pengguna"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition"
                    aria-label="Toggle password"
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {message && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-700">
                  {message}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Memproses...
                  </span>
                ) : "Masuk"}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-[11px] text-slate-400">
            © {new Date().getFullYear()} SMK YAPSIPA Tasikmalaya
          </p>
        </div>
      </section>
    </main>
  );
}