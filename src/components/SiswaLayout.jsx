import { Link, useLocation } from "react-router-dom";
import { confirmDialog } from "../utils/notify";

const SISWA_NAV = [
  { label: "Dashboard",     path: "/dashboard",           icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { label: "Kelas Saya",    path: "/mata-pelajaran",      icon: "M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" },
  { label: "Pengumaman",    path: "/siswa-pengumuman",    icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
  { label: "Profil",        path: "/profile",             icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
];

const LOGOUT_ICON = "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1";

export default function SiswaLayout({ children, title }) {
  const location = useLocation();

  const handleLogout = async () => {
    const ok = await confirmDialog("Yakin ingin logout?", { isDanger: true, title: "Logout" });
    if (!ok) return;
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    window.location.href = "/login";
  };

  const isActive = (item) => {
    if (item.path === "/mata-pelajaran") {
      return location.pathname.startsWith("/mata-pelajaran") || location.pathname.startsWith("/ruang-belajar");
    }
    if (item.path === "/siswa-pengumuman") {
      return location.pathname === "/siswa-pengumuman";
    }
    return location.pathname === item.path;
  };

  return (
    <div className="min-h-screen bg-slate-50">

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
          {SISWA_NAV.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-xs font-bold transition ${
                isActive(item) ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-100 px-5 py-4">
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-semibold text-red-500 hover:text-red-700 transition">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={LOGOUT_ICON} />
            </svg>
            Logout
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
      <main className="lg:ml-56 pt-12 lg:pt-0 pb-20 lg:pb-0 min-h-screen bg-slate-50">
        {children}
      </main>

      {/* ── Mobile Bottom Navigation ──────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t border-slate-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.07)] lg:hidden">
        {SISWA_NAV.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.label}
              to={item.path}
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
            </Link>
          );
        })}
        {/* Logout */}
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
