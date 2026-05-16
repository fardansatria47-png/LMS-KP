import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getMataPelajaranSiswaDetail, getTugasSiswa } from "../services/authService";
import DiskusiMapel from "../components/DiskusiMapel";
import { fixFileUrl } from "../api/api";
import echo from "../utils/echo";
import { toast, confirmDialog } from "../utils/notify";

const SISWA_NAV = [
  { label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", path: "/dashboard" },
  { label: "Kelas Saya", icon: "M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z", path: "/mata-pelajaran" },
  { label: "Profil", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", path: "/profile" },
];

const TABS = ["Materi", "Tugas", "Diskusi"];

export default function SiswaRuangBelajar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(location.state?.activeTab || "Materi");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [tugasList, setTugasList] = useState([]);
  const [loadingTugas, setLoadingTugas] = useState(false);
  const [hasFetchedTugas, setHasFetchedTugas] = useState(false);
  const [errorTugas, setErrorTugas] = useState("");


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getMataPelajaranSiswaDetail(id);
        setData(res.data?.data || res.data);
      } catch (err) {
        console.error("Gagal memuat ruang belajar:", err);
        setError(err?.response?.data?.message || "Gagal memuat detail kelas.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (activeTab === "Tugas" && !hasFetchedTugas) {
      const fetchTugas = async () => {
        try {
          setLoadingTugas(true);
          const mapelId = data?.mapel_id || data?.mata_pelajaran_id || id;
          const res = await getTugasSiswa(mapelId);
          
          // Debugging: ekstrak data dengan lebih aman
          let rawData = res.data;
          let list = [];
          
          if (rawData?.success && Array.isArray(rawData.data)) {
            list = rawData.data;
          } else if (rawData?.data?.tugas && Array.isArray(rawData.data.tugas)) {
            list = rawData.data.tugas; // Sesuai format API terbaru
          } else if (Array.isArray(rawData)) {
            list = rawData;
          } else if (rawData?.data?.data && Array.isArray(rawData.data.data)) {
            list = rawData.data.data; // Paginated
          } else if (rawData?.tugas && Array.isArray(rawData.tugas)) {
            list = rawData.tugas; // Jika dibungkus object "tugas" langsung
          }
          
          setTugasList(list);
          setHasFetchedTugas(true);
        } catch (err) {
          console.error("Gagal memuat tugas:", err);
          setErrorTugas("Gagal memuat daftar tugas. Pastikan endpoint sudah benar.");
        } finally {
          setLoadingTugas(false);
        }
      };
      fetchTugas();
    }
  }, [activeTab, data, id, hasFetchedTugas]);


  const handleLogout = async () => {
    const ok = await confirmDialog("Yakin ingin logout?", { isDanger: true, title: "Logout" });
    if (ok) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  };

  const mapelName = data?.nama_mapel || "Mata Pelajaran";
  const mapelDeskripsi = data?.deskripsi || "";
  const kelasName = data?.kelas || "Kelas";
  const guruName = data?.guru || "Guru Pengajar";
  
  let materiList = data?.materi || [];
  if (materiList && materiList.data && Array.isArray(materiList.data)) {
    materiList = materiList.data;
  }
  if (!Array.isArray(materiList)) materiList = [];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Siswa */}
      <aside className="fixed left-0 top-0 flex h-full w-56 flex-col bg-white border-r border-slate-100 shadow-sm z-20">
        <div className="px-6 pt-8 pb-6">
          <p className="text-sm font-black text-blue-700 tracking-widest">LMS</p>
          <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">SMK - YAPSIPA TASIKMALAYA</p>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1.5">
          {SISWA_NAV.map((item) => {
            const isActive = window.location.pathname.startsWith("/ruang-belajar") && item.path === "/mata-pelajaran"
              ? true
              : window.location.pathname === item.path;
            return (
              <a
                key={item.label}
                href={item.path}
                className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-xs font-bold transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </a>
            );
          })}
        </nav>

      </aside>

      {/* Main Content */}
      <main className="ml-56 flex-1 px-10 py-8">
        {/* Top Navbar */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/mata-pelajaran")}
            className="flex items-center gap-2 text-[#1E293B] font-bold hover:text-blue-600 transition"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Ruang Belajar
          </button>

          <div className="flex gap-6">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 text-sm font-bold transition border-b-2 ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-20">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
            {error}
          </div>
        ) : (
          <div className="max-w-4xl space-y-8">
            {/* Header Banner */}
            <div className="rounded-[24px] bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] p-8 shadow-sm">
              <span className="inline-block px-3 py-1 bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
                {kelasName}
              </span>
              <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight mb-2">
                {mapelName}
              </h1>
              {mapelDeskripsi && (
                <p className="text-sm text-slate-600 mb-4 max-w-3xl leading-relaxed">
                  {mapelDeskripsi}
                </p>
              )}
              <div className="flex items-center gap-2 text-sm font-medium text-[#64748B]">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                {guruName}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "Materi" && (
              <div>
                <h2 className="text-lg font-bold text-[#0F172A] mb-4">Materi Pembelajaran</h2>
                {materiList.length === 0 ? (
                  <div className="rounded-[20px] border border-slate-200 bg-white p-10 text-center">
                    <p className="text-slate-500 font-medium">Belum ada materi pembelajaran.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {materiList.map((materi, idx) => {
                      const dateStr = materi.created_at ? new Date(materi.created_at).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short", year: "numeric"
                      }).toUpperCase() : "BARU SAJA";

                      // Tentukan file utama (untuk menentukan ikon)
                      const hasVideo = materi.files?.some(f => f.tipe?.toLowerCase() === "youtube" || f.tipe?.toLowerCase() === "video");
                      const firstFileUrl = fixFileUrl(materi.files?.[0]?.url);

                      return (
                        <div 
                          key={materi.id || idx} 
                          onClick={() => navigate(`/ruang-belajar/${id}/materi/${materi.id}`, { state: { materi, mapelName, guruName } })}
                          className="rounded-[20px] bg-white p-6 shadow-sm border border-slate-100 flex items-start gap-5 transition hover:shadow-md cursor-pointer hover:border-blue-200"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h3 className="text-[17px] font-bold text-[#0F172A] leading-snug truncate pr-4">
                                {materi.judul}
                              </h3>
                              <span className="text-[10px] font-bold tracking-widest text-slate-400 shrink-0">
                                {dateStr}
                              </span>
                            </div>
                            <p className="text-[13px] text-[#64748B] leading-relaxed mb-4">
                              {materi.deskripsi}
                            </p>
                            <div className="flex justify-end">
                              <button className="rounded-lg bg-[#0B57D0] px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-blue-800">
                                Lihat Materi
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Tugas" && (
              <div>
                <h2 className="text-lg font-bold text-[#0F172A] mb-4">Daftar Tugas</h2>
                
                {loadingTugas ? (
                  <div className="flex justify-center p-10">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                  </div>
                ) : errorTugas ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
                    {errorTugas}
                  </div>
                ) : tugasList.length === 0 ? (
                  <div className="rounded-[20px] border border-slate-200 bg-white p-10 text-center">
                    <p className="text-slate-500 font-medium">Belum ada tugas untuk mata pelajaran ini.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tugasList.map((tugas, idx) => {
                      // Formatting deadline
                      let deadlineStr = "Tidak ada tenggat";
                      if (tugas.deadline) {
                        const dateObj = new Date(tugas.deadline);
                        // Using a simple format for now since "Besok, 23:59" requires complex relative time logic
                        deadlineStr = dateObj.toLocaleString("id-ID", { 
                          day: "numeric", month: "short", year: "numeric", 
                          hour: "2-digit", minute: "2-digit" 
                        }).replace(/\./g, ":"); // replace . with : for time in some locales
                      }

                      return (
                        <div key={tugas.id || idx} className="rounded-[20px] bg-white p-6 shadow-sm border border-slate-100 flex items-center justify-between transition hover:shadow-md">
                          <div className="flex-1 pr-6">
                            <h3 className="text-[17px] font-bold text-[#0F172A] leading-snug mb-1">
                              {tugas.judul}
                            </h3>
                            <p className="text-[13px] text-[#64748B] leading-relaxed mb-3 line-clamp-2">
                              {tugas.deskripsi}
                            </p>
                            <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#D97706]">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {deadlineStr}
                            </div>
                          </div>
                          <button 
                            onClick={() => navigate(`/ruang-belajar/${id}/tugas/${tugas.id}`, { state: { tugas, mapelName, guruName, kelasName } })}
                            className="shrink-0 flex items-center justify-center rounded-lg bg-[#0B57D0] px-6 py-2.5 text-[13px] font-bold text-white transition hover:bg-blue-800"
                          >
                            Lihat Tugas
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Diskusi" && (
              <div className="mt-2">
                <DiskusiMapel mapelId={data?.mapel_id || data?.mata_pelajaran_id || id} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
