import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getMataPelajaranSiswaDetail, getTugasSiswa, getTugasSusulanSiswa, getPengumuman } from "../services/authService";
import { getErrorMessage } from "../utils/translateError";
import DiskusiMapel from "../components/DiskusiMapel";
import SiswaLayout from "../components/SiswaLayout";
import { fixFileUrl } from "../api/api";
import echo from "../utils/echo";
import { toast, confirmDialog } from "../utils/notify";


const TABS = ["Materi", "Tugas", "Tugas Susulan", "Diskusi"];

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

  // ── Tugas Susulan (endpoint terpisah) ──────────────────────────────
  const [tugasSusulanList, setTugasSusulanList] = useState([]);
  const [loadingTugasSusulan, setLoadingTugasSusulan] = useState(false);
  const [hasFetchedTugasSusulan, setHasFetchedTugasSusulan] = useState(false);
  const [errorTugasSusulan, setErrorTugasSusulan] = useState("");
  const [rawTugasSusulanList, setRawTugasSusulanList] = useState([]);

  const [pengumumanList, setPengumumanList] = useState([]);
  const [loadingPengumuman, setLoadingPengumuman] = useState(false);
  const [errorPengumuman, setErrorPengumuman] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getMataPelajaranSiswaDetail(id);
        setData(res.data?.data || res.data);
      } catch (err) {
        setError(getErrorMessage(err, "Gagal memuat detail kelas."));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!data) return;

    const fetchTugas = async () => {
      try {
        setLoadingTugas(true);
        const mapelId = data?.mapel_id || data?.mata_pelajaran_id || id;
        const res = await getTugasSiswa(mapelId);
        
        let rawData = res.data;
        let list = [];
        
        if (rawData?.success && Array.isArray(rawData.data)) {
          list = rawData.data;
        } else if (rawData?.data?.tugas && Array.isArray(rawData.data.tugas)) {
          list = rawData.data.tugas;
        } else if (Array.isArray(rawData)) {
          list = rawData;
        } else if (rawData?.data?.data && Array.isArray(rawData.data.data)) {
          list = rawData.data.data;
        } else if (rawData?.tugas && Array.isArray(rawData.tugas)) {
          list = rawData.tugas;
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

    if (!hasFetchedTugas) {
      fetchTugas();
    }
  }, [data, id, hasFetchedTugas]);

  // ── Fetch Tugas Susulan (endpoint terpisah, filter by mapel) ─────────
  useEffect(() => {
    if (!data || hasFetchedTugasSusulan) return;

    const fetchTugasSusulan = async () => {
      try {
        setLoadingTugasSusulan(true);
        const mapelId = data?.mapel_id || data?.mata_pelajaran_id || id;
        const res = await getTugasSusulanSiswa();
        const raw = res.data;

        let list = [];
        if (Array.isArray(raw)) list = raw;
        else if (Array.isArray(raw?.data)) list = raw.data;
        else if (Array.isArray(raw?.data?.data)) list = raw.data.data;

        setRawTugasSusulanList(list);

        // Filter tugas susulan berdasarkan nama_mapel (karena backend tidak mengirim mapel_id)
        const mapelNameAPI = data?.nama_mapel?.toLowerCase();
        
        const filtered = list.filter((t) => {
          return t.nama_mapel?.toLowerCase() === mapelNameAPI;
        });

        setTugasSusulanList(filtered);
        setHasFetchedTugasSusulan(true);
      } catch (err) {
        console.error("Gagal memuat tugas susulan:", err);
        setErrorTugasSusulan("Gagal memuat daftar tugas susulan.");
      } finally {
        setLoadingTugasSusulan(false);
      }
    };

    fetchTugasSusulan();
  }, [data, id, hasFetchedTugasSusulan]);

  useEffect(() => {
    if (activeTab !== "Pengumuman" || !data) {
      return;
    }

    const fetchPengumuman = async () => {
      try {
        setLoadingPengumuman(true);
        const mapelId = data?.mapel_id || data?.mata_pelajaran_id || id;
        const res = await getPengumuman({ mapel_id: mapelId });
        const rawData = res.data;
        let list = [];

        if (rawData?.success && Array.isArray(rawData.data)) {
          list = rawData.data;
        } else if (Array.isArray(rawData)) {
          list = rawData;
        } else if (rawData?.data && Array.isArray(rawData.data)) {
          list = rawData.data;
        } else if (rawData?.pengumuman && Array.isArray(rawData.pengumuman)) {
          list = rawData.pengumuman;
        }

        setPengumumanList(list);
      } catch (err) {
        console.error("Gagal memuat pengumuman:", err);
        setErrorPengumuman("Gagal memuat pengumuman. Pastikan endpoint sudah benar.");
      } finally {
        setLoadingPengumuman(false);
      }
    };

    fetchPengumuman();
  }, [activeTab, data, id]);

  useEffect(() => {
    if (!data) return;

    const mapelId = data?.mapel_id || data?.mata_pelajaran_id || id;
    const channelName = `pengumuman.mapel.${mapelId}`;

    const channel = echo.channel(channelName);
    channel.listen("PengumumanCreated", (event) => {
      if (event?.pengumuman) {
        setPengumumanList((current) => [event.pengumuman, ...current]);
      }
    });

    return () => {
      channel.stopListening("PengumumanCreated");
      echo.leaveChannel(channelName);
    };
  }, [data, id]);

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
  const tugasTertunda = data?.tugas_tertunda ?? 0;
  
  let materiList = data?.materi || [];
  if (materiList && materiList.data && Array.isArray(materiList.data)) {
    materiList = materiList.data;
  }
  if (!Array.isArray(materiList)) materiList = [];

  return (
    <SiswaLayout title={mapelName}>
      <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-8 max-w-4xl">
        {/* Top bar — back button only */}
        <div className="mb-5">
          <button
            onClick={() => navigate("/mata-pelajaran")}
            className="flex items-center gap-2 text-[#1E293B] font-bold hover:text-blue-600 transition"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Ruang Belajar
          </button>
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
            {/* Tabs — di bawah header banner */}
            <div className="flex gap-1 border-b border-slate-200 overflow-x-auto scrollbar-hide -mx-1 px-1">
              {TABS.map((tab) => {
                let badgeCount = 0;
                if (tab === "Tugas") {
                  badgeCount = tugasTertunda;
                } else if (tab === "Tugas Susulan") {
                  badgeCount = tugasSusulanList.filter((t) => {
                    const s = (t.status || t.status_pengumpulan || "").toLowerCase();
                    return !s || s.includes("belum");
                  }).length;
                }

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold transition border-b-2 -mb-px whitespace-nowrap ${
                      activeTab === tab
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab}
                    {badgeCount > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white leading-none">
                        {badgeCount > 9 ? "9+" : badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
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
                        deadlineStr = dateObj.toLocaleString("id-ID", { 
                          day: "numeric", month: "short", year: "numeric", 
                          hour: "2-digit", minute: "2-digit" 
                        }).replace(/\./g, ":");
                      }

                      return (
                        <div key={tugas.id || idx} className="rounded-[20px] bg-white p-6 shadow-sm border border-slate-100 flex items-center justify-between transition hover:shadow-md">
                          <div className="flex-1 pr-6">
                            <h3 className="text-[17px] font-bold text-[#0F172A] leading-snug mb-1">
                              {tugas.judul_tugas || tugas.judul}
                            </h3>
                            <p className="text-[13px] text-[#64748B] leading-relaxed mb-3 line-clamp-2">
                              {tugas.deskripsi_tugas || tugas.deskripsi}
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

            {activeTab === "Tugas Susulan" && (
              <div>
                <h2 className="text-lg font-bold text-[#0F172A] mb-4">Daftar Tugas Susulan</h2>
                
                {loadingTugasSusulan ? (
                  <div className="flex justify-center p-10">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                  </div>
                ) : errorTugasSusulan ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
                    {errorTugasSusulan}
                  </div>
                ) : tugasSusulanList.length === 0 ? (
                  <div className="rounded-[20px] border border-slate-200 bg-white p-10 text-center">
                    <p className="text-slate-500 font-medium">Belum ada tugas susulan untuk mata pelajaran ini.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tugasSusulanList.map((tugas, idx) => {
                      const deadlineRaw = tugas.deadline_susulan || tugas.deadline;
                      let deadlineStr = "Tidak ada tenggat";
                      if (deadlineRaw) {
                        deadlineStr = new Date(deadlineRaw).toLocaleString("id-ID", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        }).replace(/\./g, ":");
                      }

                      return (
                        <div key={tugas.id || idx} className="rounded-[20px] bg-white p-6 shadow-sm border border-slate-100 flex items-center justify-between transition hover:shadow-md">
                          <div className="flex-1 pr-6">
                            <h3 className="text-[17px] font-bold text-[#0F172A] leading-snug mb-1">
                              {tugas.judul_tugas || tugas.judul}
                            </h3>
                            <p className="text-[13px] text-[#64748B] leading-relaxed mb-3 line-clamp-2">
                              {tugas.deskripsi_tugas || tugas.deskripsi}
                            </p>
                            <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#D97706]">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {deadlineStr}
                            </div>
                          </div>
                          <button
                            onClick={() => navigate(`/siswa/tugas-susulan/${tugas.id}`)}
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

            {activeTab === "Pengumuman" && (
              <div>
                <h2 className="text-lg font-bold text-[#0F172A] mb-4">Pengumuman {mapelName}</h2>

                {loadingPengumuman ? (
                  <div className="flex justify-center p-10">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                  </div>
                ) : errorPengumuman ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
                    {errorPengumuman}
                  </div>
                ) : pengumumanList.length === 0 ? (
                  <div className="rounded-[20px] border border-slate-200 bg-white p-10 text-center">
                    <p className="text-slate-500 font-medium">Belum ada pengumuman untuk mata pelajaran ini.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pengumumanList.map((pengumuman, idx) => {
                      const publishedAt = pengumuman.created_at
                        ? new Date(pengumuman.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Baru saja";

                      return (
                        <div key={pengumuman.id || idx} className="rounded-[20px] bg-white p-6 shadow-sm border border-slate-100">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <h3 className="text-[17px] font-bold text-[#0F172A] leading-snug">
                                  {pengumuman.judul || pengumuman.title || "Pengumuman"
                                  }
                                </h3>
                                <p className="text-[13px] text-[#64748B] mt-1">
                                  {pengumuman.penulis || pengumuman.user_name || guruName}
                                </p>
                              </div>
                              <span className="text-[12px] text-slate-400">{publishedAt}</span>
                            </div>
                            <p className="text-[14px] text-[#334155] leading-relaxed whitespace-pre-line">
                              {pengumuman.deskripsi || pengumuman.body || "Tidak ada keterangan."}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </SiswaLayout>
  );
}
