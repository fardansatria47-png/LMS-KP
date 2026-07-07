import { useLocation } from "react-router-dom";
import { confirmDialog } from "../utils/notify";
import { logoutUser } from "../services/authService";

const GURU_NAV = [
  { label: "Dashboard", path: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { label: "Mata Pelajaran", path: "/kelas",     icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { label: "Profil",    path: "/profile",   icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
];

const LOGOUT_ICON = "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1";

export default function GuruLayout({ children, title }) {
  const location = useLocation();

  const handleLogout = async () => {
    const ok = await confirmDialog("Yakin ingin keluar?", { isDanger: true, title: "Keluar" });
    if (!ok) return;
    try {
      await logoutUser(); // Minta backend hapus cookie HttpOnly
    } catch (e) {
      console.warn("[Logout] API logout gagal:", e);
    }
    localStorage.removeItem("user_role");
    window.location.href = "/login";
  };

  const isActive = (item) => {
    if (item.path === "/kelas") {
      return location.pathname.startsWith("/kelas");
    }
    if (item.path === "/pengumuman") {
      return location.pathname === "/pengumuman";
    }
    return location.pathname === item.path;
  };

  return (
    <div className="min-h-screen bg-[#F0F4FF]">

      {/* ── Desktop Sidebar ──────────────────────────────── */}
      <aside className="fixed left-0 top-0 hidden h-full w-56 flex-col bg-white border-r border-slate-100 shadow-sm z-20 lg:flex">
        <div className="px-6 pt-8 pb-6 border-b border-slate-100 flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-[42px] w-[42px] object-contain" 
            style={{ imageRendering: "-webkit-optimize-contrast" }}
          />
          <p className="text-sm font-black uppercase tracking-widest text-blue-700 leading-tight">LMS SMK - Yapsipa Tasikmalaya</p>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1.5">
          {GURU_NAV.map((item) => (
            <a
              key={item.label}
              href={item.path}
              className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-xs font-bold transition ${
                isActive(item) ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="border-t border-slate-100 px-5 py-4">
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-semibold text-red-500 hover:text-red-700 transition">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={LOGOUT_ICON} />
            </svg>
            Keluar
          </button>
        </div>
      </aside>
 
      {/* ── Mobile Top Bar (title only) ───────────────────── */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-slate-100 bg-white/90 backdrop-blur-md px-4 shadow-sm lg:hidden">
        <img 
          src="/logo.png" 
          alt="Logo" 
          className="h-[42px] w-[42px] object-contain" 
          style={{ imageRendering: "-webkit-optimize-contrast" }}
        />
        <div className="py-1">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700 leading-tight">LMS SMK - Yapsipa Tasikmalaya</p>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────── */}
      <main className="lg:ml-56 pt-16 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
        {children}
      </main>

      {/* ── Mobile Bottom Navigation ──────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t border-slate-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.07)] lg:hidden">
        {GURU_NAV.map((item) => {
          const active = isActive(item);
          return (
            <a
              key={item.label}
              href={item.path}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-all ${
                active ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                active ? "bg-blue-50" : ""
              }`}>
                <svg className={`h-5 w-5 transition-all ${active ? "stroke-[2.2]" : "stroke-[1.8]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
              </span>
              <span className={`text-[10px] font-semibold leading-none ${active ? "text-blue-600" : "text-slate-400"}`}>
                {item.label}
              </span>
            </a>
          );
        })}
        {/* Logout di bottom nav */}
        <button
          onClick={handleLogout}
          className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-red-400 hover:text-red-600 transition-all"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={LOGOUT_ICON} />
            </svg>
          </span>
          <span className="text-[10px] font-semibold leading-none">Keluar</span>
        </button>
      </nav>
    </div>
  );
}
