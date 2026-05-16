import { Link, useLocation, useNavigate } from "react-router-dom";
import { confirmDialog } from "../utils/notify";

const LOGOUT_ICON = "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1";

const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: "/data-pengguna",
    label: "Pengguna",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    to: "/mata-pelajaran",
    label: "Mapel",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    to: "/anggota-kelas",
    label: "Kelas",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const ok = await confirmDialog("Yakin ingin logout?", { isDanger: true, title: "Logout" });
    if (!ok) return;
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <div className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-slate-200 bg-white shadow-sm lg:flex">
        {/* Logo */}
        <div className="mb-6 px-6 pt-7 pb-5 border-b border-slate-100">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">LMS Admin</p>
          <p className="text-[10px] text-slate-400 mt-0.5">SMK - YAPSIPA TASIKMALAYA</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to ||
              (item.to !== "/dashboard" && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  isActive ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="mt-auto px-6 pb-6 pt-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 text-sm font-semibold text-red-600 transition hover:text-red-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={LOGOUT_ICON} />
            </svg>
            LOGOUT
          </button>
        </div>
      </div>

      {/* ── Mobile Top Bar (title only) ──────────────────── */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-12 items-center border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 shadow-sm lg:hidden">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 leading-none">LMS Admin</p>
          <p className="text-[10px] text-slate-400 mt-0.5">SMK - YAPSIPA TASIKMALAYA</p>
        </div>
      </header>

      {/* ── Mobile Bottom Navigation ─────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t border-slate-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.07)] lg:hidden">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to ||
            (item.to !== "/dashboard" && location.pathname.startsWith(item.to));
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-all ${
                isActive ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                isActive ? "bg-blue-50" : ""
              }`}>
                {/* Clone icon with adjusted stroke */}
                <svg
                  className={`h-5 w-5 ${isActive ? "stroke-2" : "stroke-[1.6]"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {item.icon.props.children}
                </svg>
              </span>
              <span className={`text-[10px] font-semibold leading-none ${isActive ? "text-blue-600" : "text-slate-400"}`}>
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
    </>
  );
}
