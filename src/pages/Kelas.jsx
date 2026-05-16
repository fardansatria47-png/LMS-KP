import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getKelasGuru } from "../services/authService";

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

export default function Kelas() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [kelasList, setKelasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedKelas, setSelectedKelas] = useState(searchParams.get("filter") || "Semua");

  useEffect(() => {
    const fetchKelas = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getKelasGuru();
        // Backend mengembalikan array mapel
        const data = res.data?.data || res.data || [];
        setKelasList(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err?.response?.status === 403) {
          setError("Akses Ditolak: Role Anda tidak sesuai untuk halaman ini (403 Forbidden).");
        } else {
          setError(err?.response?.data?.message || "Gagal memuat data kelas.");
        }
        console.error("Fetch kelas guru error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchKelas();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Guru */}
      <aside className="fixed left-0 top-0 flex h-full w-44 flex-col bg-white border-r border-slate-100 shadow-sm z-20">
        <div className="px-5 pt-6 pb-4 border-b border-slate-100">
          <p className="text-xs font-bold text-blue-700 tracking-widest">LMS</p>
          <p className="text-[10px] font-semibold text-slate-500 mt-0.5">SMK - YAPSIPA TASIKMALAYA</p>
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1">
          {GURU_NAV.map((item) => {
            const isActive = window.location.pathname === item.path;
            return (
              <a
                key={item.label}
                href={item.path}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </a>
            );
          })}
        </nav>

      </aside>

      {/* Main Content */}
      <main className="ml-44 flex-1 px-10 py-12 bg-slate-50">
        <div className="mb-6 max-w-4xl">
          <h1 className="text-[32px] font-bold text-slate-900 tracking-tight">Mata Pelajaran</h1>
          <p className="mt-2 text-slate-500 text-[15px] leading-relaxed">
            Pilih mata pelajaran untuk mengelola aktivitas pembelajaran, melihat progres siswa, dan memberikan penilaian.
          </p>
        </div>

        {(() => {
          const uniqueKelas = Array.from(new Set(kelasList.map(kelas => {
            const kelasName = kelas.nama_kelas || kelas.tingkat || "";
            const jurusanName = kelas.jurusan?.nama_jurusan || kelas.nama_jurusan || "";
            return `${kelasName} ${jurusanName}`.trim();
          }))).filter(Boolean).sort();

          const filteredList = selectedKelas === "Semua"
            ? kelasList
            : kelasList.filter(kelas => {
                const kelasName = kelas.nama_kelas || kelas.tingkat || "";
                const jurusanName = kelas.jurusan?.nama_jurusan || kelas.nama_jurusan || "";
                return `${kelasName} ${jurusanName}`.trim() === selectedKelas;
              });

          return (
            <>
              {!loading && !error && uniqueKelas.length > 0 && (
                <div className="mb-8 flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedKelas("Semua")}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition ${selectedKelas === "Semua" ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
                  >
                    Semua Kelas
                  </button>
                  {uniqueKelas.map(k => (
                    <button
                      key={k}
                      onClick={() => setSelectedKelas(k)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition ${selectedKelas === k ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              )}

              {loading ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-16">
            <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm font-semibold text-slate-500">Memuat data kelas...</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700 max-w-lg">
            <p className="font-semibold">{error}</p>
          </div>
        ) : filteredList.length > 0 ? (
          <div className="flex flex-col space-y-6 max-w-5xl">
            {filteredList.map((kelas, idx) => {
              const mapelName = kelas.nama_mapel || kelas.mata_pelajaran || "Mata Pelajaran";
              const kelasName = kelas.nama_kelas || kelas.tingkat || `Kelas ${idx + 1}`;
              const jurusanName = kelas.jurusan?.nama_jurusan || kelas.nama_jurusan || "";
              const fullKelasName = jurusanName ? `${kelasName} ${jurusanName}` : kelasName;
              const jumlah_siswa = kelas.jumlah_siswa || 0;
              // Simulasi warna gradient tipis di sebelah kanan
              const gradientColor = idx % 2 === 0 ? "from-blue-50/40" : "from-emerald-50/40";

              return (
                <div key={kelas.id || idx} className="relative flex flex-col sm:flex-row items-start sm:items-center p-6 rounded-[24px] bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden transition-all hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)]">
                  {/* Subtle right gradient */}
                  <div className={`absolute top-0 right-0 bottom-0 w-1/3 bg-gradient-to-l ${gradientColor} to-transparent pointer-events-none`}></div>
                  
                  {/* Icon Box */}
                  <div className="flex items-center justify-center w-16 h-16 rounded-[18px] bg-[#EEF2FF] text-[#3B82F6] shrink-0">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
                    </svg>
                  </div>
                  
                  {/* Content */}
                  <div className="mt-4 sm:mt-0 sm:ml-6 flex-1 z-10">
                    {kelas.tahun_ajaran && (
                      <span className="inline-block px-3 py-1 bg-[#F59E0B] text-white text-[10px] font-bold tracking-wider uppercase rounded-full mb-2">
                        TAHUN AJARAN {kelas.tahun_ajaran}
                      </span>
                    )}
                    <h2 className="text-xl font-bold text-[#1E293B]">{mapelName}</h2>
                    
                    <div className="flex items-center gap-3 mt-1.5 text-sm">
                      <div className="flex items-center text-[#64748B] font-medium">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        {jumlah_siswa} Siswa
                      </div>
                      <span className="text-slate-300">•</span>
                      <div className="font-semibold text-[#059669]">
                        {fullKelasName}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="mt-6 sm:mt-0 sm:ml-6 z-10 w-full sm:w-auto">
                    <button
                      onClick={() => navigate(`/kelas/${kelas.id || ''}`)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-semibold rounded-[14px] transition-colors shadow-sm"
                    >
                      Masuk
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center max-w-4xl">
            <svg className="mx-auto h-16 w-16 text-slate-300 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <h3 className="text-lg font-bold text-slate-700">Tidak ada kelas</h3>
            <p className="mt-1 text-sm text-slate-500">
              {selectedKelas === "Semua" ? "Anda belum ditugaskan untuk mengajar mata pelajaran apa pun." : `Tidak ada mata pelajaran untuk kelas ${selectedKelas}.`}
            </p>
          </div>
        )}
            </>
          );
        })()}
      </main>
    </div>
  );
}
