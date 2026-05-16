import { useNavigate } from "react-router-dom";
import CalendarWidget from "../components/CalendarWidget";
import GuruLayout from "../components/GuruLayout";

const GURU_NAV = [
  { label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", path: "/dashboard" },
  { label: "Kelas", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", path: "/kelas" },
  { label: "Profil", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", path: "/profile" },
];

const CLASS_COLORS = [
  { bg: "bg-blue-500", hover: "hover:bg-blue-600" },
  { bg: "bg-yellow-400", hover: "hover:bg-yellow-500" },
  { bg: "bg-green-400", hover: "hover:bg-green-500" },
  { bg: "bg-rose-400", hover: "hover:bg-rose-500" },
  { bg: "bg-purple-400", hover: "hover:bg-purple-500" },
];

export default function GuruDashboard({ user, summary }) {
  const navigate = useNavigate();

  // Sesuai struktur JSON backend: { guru_name, summary: {...}, kelas_preview: [] }
  const nama = summary?.guru_name || user?.nama || user?.name || "Guru";
  const stats = summary?.summary || {};
  const kelasList = summary?.kelas_preview || [];

  const statItems = [
    {
      label: "TOTAL KELAS",
      value: stats.total_kelas ?? 0,
      icon: (
        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      ),
      color: "text-blue-600",
    },
    {
      label: "TOTAL MATERI",
      value: stats.total_materi ?? 0,
      icon: (
        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      ),
      color: "text-blue-600",
    },
    {
      label: "TOTAL TUGAS",
      value: stats.total_tugas ?? 0,
      icon: (
        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
      color: "text-blue-600",
    },
    {
      label: "TUGAS BELUM DINILAI",
      value: stats.tugas_belum_dinilai ?? 0,
      icon: (
        <svg className="h-6 w-6 text-amber-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      ),
      color: "text-amber-500",
      highlight: true,
    },
  ];

  return (
    <GuruLayout title="Dashboard">
      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-10 bg-white min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Halo, {nama}</h1>
          <p className="mt-1 text-sm text-slate-500">Ringkasan aktivitas pembelajaran Anda</p>
        </div>

        {/* Stat Cards */}
        <div className="mb-8 grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {statItems.map((s, i) => (
            <div
              key={i}
              className={`rounded-2xl border p-5 shadow-sm ${s.highlight ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}
            >
              <div className="mb-3">{s.icon}</div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${s.highlight ? "text-amber-600" : "text-slate-500"}`}>{s.label}</p>
              <p className={`mt-1 text-3xl font-bold ${s.highlight ? "text-amber-500" : "text-slate-900"}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Calendar + Kelas Grid */}
        <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
          {/* Kalender */}
          <CalendarWidget />

          {/* Kelas Saya */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Kelas Saya (Preview)</h2>
            </div>

            {kelasList.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {kelasList.slice(0, 6).map((kelas, idx) => {
                  const color = CLASS_COLORS[idx % CLASS_COLORS.length];
                  return (
                    <div key={kelas.id || idx} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <div className={`${color.bg} flex h-20 items-center justify-center`}>
                        <svg className="h-9 w-9 text-white opacity-90" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                        </svg>
                      </div>
                      <div className="p-3.5">
                        <p className="text-sm font-bold text-slate-800 truncate">{kelas.nama || kelas.nama_kelas || `Kelas ${idx + 1}`}</p>
                        <p className="mt-0.5 text-xs text-slate-500 truncate">{kelas.jurusan?.nama_jurusan || kelas.nama_jurusan || ""}</p>
                        <button
                          onClick={() => {
                            const kelasName = kelas.nama_kelas || kelas.tingkat || "";
                            const jurusanName = kelas.jurusan?.nama_jurusan || kelas.nama_jurusan || "";
                            const fullKelas = `${kelasName} ${jurusanName}`.trim();
                            navigate(`/kelas?filter=${encodeURIComponent(fullKelas)}`);
                          }}
                          className={`mt-3 w-full rounded-lg ${color.bg} ${color.hover} py-2 text-xs font-bold text-white transition`}
                        >
                          Masuk Kelas
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-slate-300 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                </svg>
                <p className="text-slate-400 text-sm font-medium">Belum ada kelas yang diajarkan.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </GuruLayout>
  );
}
