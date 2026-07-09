import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getKelasGuru, getMateri, deleteMateri, getTugas, deleteTugas, getPengumuman, deletePengumuman, getSiswaGuru, downloadRecapNilai, getRpp } from "../services/authService";
import { fixFileUrl } from "../api/api";
import { getErrorMessage } from "../utils/translateError";
import DiskusiMapel from "../components/DiskusiMapel";
import GuruLayout from "../components/GuruLayout";
import echo from "../utils/echo";
import { toast } from "../utils/notify";

const GURU_NAV = [
  { label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", path: "/dashboard" },
  { label: "Kelas", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", path: "/kelas" },
  { label: "Profil", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", path: "/profile" },
];

const TABS = ["Materi", "Tugas", "Siswa", "Diskusi", "Pengumuman"];

function MateriIcon({ tipe }) {
  if (tipe === "Video") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
      </div>
    );
  }
  if (tipe === "Presentasi") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white">
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 3h16v12H4V3zm8 14l4 4H8l4-4z" /></svg>
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white">
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
      </svg>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "Tidak ada tenggat";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatDeadline(dateStr) {
  if (!dateStr) return "Tidak ada tenggat";
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function KelasDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [kelasInfo, setKelasInfo] = useState(null);
  const [materiList, setMateriList] = useState([]);
  const [rppList, setRppList] = useState([]);
  const [tugasList, setTugasList] = useState([]);
  const [pengumumanList, setPengumumanList] = useState([]);
  const [siswaList, setSiswaList] = useState([]);
  const [searchSiswa, setSearchSiswa] = useState("");
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || "Materi");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteTugasConfirm, setDeleteTugasConfirm] = useState(null);
  const [deletePengumumanConfirm, setDeletePengumumanConfirm] = useState(null);
  const [successMsg, setSuccessMsg] = useState(location.state?.successMsg || "");
  const [expandedRppId, setExpandedRppId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // Step 1: Get kelas info first to resolve the actual mapel_id
      const resKelas = await getKelasGuru();
      const kelasList = resKelas.data?.data || resKelas.data || [];
      const found = Array.isArray(kelasList)
        ? kelasList.find((k) => String(k.id) === String(id))
        : null;
      setKelasInfo(found || null);
      console.log("DEBUG: DATA KELAS DARI BACKEND:", found);

      // Actual mata_pelajaran ID (may differ from URL id if URL uses pivot id)
      const actualMapelId = found?.mapel_id || found?.mata_pelajaran_id || id;
      const rombelId = found?.rombel_id || found?.kelas_id || found?.rombel?.id || null;

      // Step 2: Fetch all data in parallel using correct IDs
      const [resMateri, resTugas, resPengumuman] = await Promise.all([
        getMateri({ mapel_id: actualMapelId, rombel_id: rombelId }),
        getTugas({ mapel_id: actualMapelId, rombel_id: rombelId }),
        getPengumuman({ mapel_id: actualMapelId }).catch((err) => {
          console.error("Gagal fetch pengumuman:", err);
          return { data: [] };
        }),
      ]);

      const materiData = resMateri.data?.data || resMateri.data || [];
      const materiArr = Array.isArray(materiData) ? materiData : [];
      // Client-side filter sebagai safety net: pastikan hanya materi milik mapel ini
      const filteredMateri = materiArr.filter(m =>
        !m.mapel_id || String(m.mapel_id) === String(actualMapelId)
      );
      setMateriList(filteredMateri);

      const tugasData = resTugas.data?.data || resTugas.data || [];
      const tugasArr = Array.isArray(tugasData) ? tugasData : [];
      // Client-side filter: pastikan hanya tugas milik mapel ini
      const filteredTugas = tugasArr.filter(t =>
        !t.mapel_id || String(t.mapel_id) === String(actualMapelId)
      );
      setTugasList(filteredTugas);

      try {
        // Fetch RPP (asynchronous but safe to fail separately)
        const rppRes = await getRpp({ mapel_id: actualMapelId });
        const rawRpp = rppRes.data?.data || rppRes.data || [];
        setRppList(Array.isArray(rawRpp) ? rawRpp : []);
      } catch (e) {
        console.error("Gagal memuat RPP di kelas detail:", e);
      }

      const pDataRaw = resPengumuman.data;
      const pengumumanData =
        Array.isArray(pDataRaw?.data?.data) ? pDataRaw.data.data :
        Array.isArray(pDataRaw?.data) ? pDataRaw.data :
        Array.isArray(pDataRaw) ? pDataRaw : [];
      setPengumumanList(pengumumanData);

      // Step 3: Fetch siswa via /guru/siswa filtered by rombel_id from kelasInfo
      if (rombelId) {
        const resSiswa = await getSiswaGuru({ rombel_id: rombelId }).catch((err) => {
          console.error("Gagal fetch siswa:", err);
          return { data: [] };
        });
        const siswaData = resSiswa.data?.data || resSiswa.data || [];
        setSiswaList(Array.isArray(siswaData) ? siswaData : []);
      } else {
        const resSiswa = await getSiswaGuru({ mapel_id: actualMapelId }).catch((err) => {
          console.error("Gagal fetch siswa (fallback):", err);
          return { data: [] };
        });
        const siswaData = resSiswa.data?.data || resSiswa.data || [];
        setSiswaList(Array.isArray(siswaData) ? siswaData : []);
      }
    } catch (err) {
      if (err?.response?.status === 403) {
        navigate("/dashboard");
        return;
      }
      setError(getErrorMessage(err, "Gagal memuat data."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-clear success message after 3s
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(""), 3000);
      
      // Hapus successMsg dari history state agar tidak muncul lagi saat di-refresh
      if (location.state && location.state.successMsg) {
        const newState = { ...location.state };
        delete newState.successMsg;
        navigate(location.pathname, { replace: true, state: newState });
      }

      return () => clearTimeout(t);
    }
  }, [id]);

  // 🔔 Real-time: listen to new pengumuman via Laravel Echo
  useEffect(() => {
    const actualMapelId = kelasInfo?.mapel_id || kelasInfo?.mata_pelajaran_id || id;
    if (!actualMapelId) return;

    const channelName = `pengumuman.mapel.${actualMapelId}`;
    console.log(`[Echo] Mencoba subscribe ke channel: ${channelName}`);
    const channel = echo.private(channelName);

    // Catch successful subscription (same pattern as DiskusiMapel)
    channel.subscribed(() => {
      console.log(`[Echo] ✅ Berhasil subscribe ke channel: ${channelName}`);
      // Bind global untuk debug: tangkap semua event raw dari Pusher
      try {
        const pusherCh = echo.connector?.pusher?.channel(`private-${channelName}`);
        if (pusherCh) {
          pusherCh.bind_global((evtName, evtData) => {
            if (!evtName.startsWith('pusher:')) {
              console.log(`[Echo Debug] Raw event on ${channelName}:`, evtName, evtData);
            }
          });
        }
      } catch (e) { /* ignore */ }
    });

    // Catch subscription error
    channel.error((error) => {
      console.error(`[Echo] ❌ Gagal subscribe ke channel: ${channelName}`, error);
    });

    // Handler pengumuman baru
    const handleNewPengumuman = (e) => {
      console.log("[Echo] Pengumuman baru diterima (guru):", e);
      const newPengumuman = e.pengumuman || e;
      if (newPengumuman?.id) {
        setPengumumanList((prev) => {
          const exists = prev.find((p) => p.id === newPengumuman.id);
          if (exists) return prev;
          return [newPengumuman, ...prev];
        });
      }
    };

    // Coba berbagai format nama event (sesuai broadcastAs() backend)
    channel.listen(".App\\Events\\PengumumanCreated", handleNewPengumuman);
    channel.listen(".PengumumanCreated", handleNewPengumuman);
    channel.listen("PengumumanCreated", handleNewPengumuman);
    channel.listen(".pengumuman.created", handleNewPengumuman);

    return () => {
      console.log(`[Echo] Unsubscribe dari channel: ${channelName}`);
      channel.stopListening(".App\\Events\\PengumumanCreated");
      channel.stopListening(".PengumumanCreated");
      channel.stopListening("PengumumanCreated");
      channel.stopListening(".pengumuman.created");
      echo.leaveChannel(channelName);
    };
  }, [kelasInfo, id]);

  const handleDelete = async (materiId) => {
    try {
      await deleteMateri(materiId);
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      toast(err?.response?.data?.message || "Gagal menghapus materi.", "error");
    }
  };

  const handleDeleteTugas = async (tugasId) => {
    try {
      await deleteTugas(tugasId);
      setDeleteTugasConfirm(null);
      fetchData();
    } catch (err) {
      toast(err?.response?.data?.message || "Gagal menghapus tugas.", "error");
    }
  };

  const handleDeletePengumuman = async (pengumumanId) => {
    try {
      await deletePengumuman(pengumumanId);
      setDeletePengumumanConfirm(null);
      fetchData();
    } catch (err) {
      toast(err?.response?.data?.message || "Gagal menghapus pengumuman.", "error");
    }
  };

  const [isDownloadingRecap, setIsDownloadingRecap] = useState(false);

  const handleDownloadRecap = async () => {
    try {
      const rombelId = kelasInfo?.rombel_id || kelasInfo?.kelas_id || kelasInfo?.rombel?.id;
      const actualMapelId = kelasInfo?.mapel_id || kelasInfo?.mata_pelajaran_id || id;
      
      if (!rombelId) {
        toast("ID Rombel tidak ditemukan.", "error");
        return;
      }
      
      setIsDownloadingRecap(true);
      const res = await downloadRecapNilai({ rombel_id: rombelId, mapel_id: actualMapelId });
      
      let filename = `Rekap_Nilai_${kelasInfo?.nama_kelas || kelasInfo?.tingkat || 'Kelas'}_${kelasInfo?.nama_mapel || kelasInfo?.mata_pelajaran || 'Mapel'}.xlsx`;
      const disposition = res.headers && res.headers['content-disposition'];
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) filename = matches[1].replace(/['"]/g, '');
      }

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast("Berhasil mengunduh rekap nilai", "success");
    } catch (err) {
      toast(err?.response?.data?.message || "Gagal mengunduh rekap nilai.", "error");
    } finally {
      setIsDownloadingRecap(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  const mapelName = kelasInfo?.nama_mapel || kelasInfo?.mata_pelajaran || "Mata Pelajaran";
  const kelasName = kelasInfo?.nama_kelas || kelasInfo?.tingkat || "";
  const jurusanName = kelasInfo?.jurusan?.nama_jurusan || kelasInfo?.nama_jurusan || "";
  const fullKelasName = [kelasName, jurusanName].filter(Boolean).join(" ");
  const jumlahSiswa = kelasInfo?.jumlah_siswa || 0;
  const tahunAjaran = kelasInfo?.tahun_ajaran || "";

  return (
    <GuruLayout title={mapelName}>
      <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
        {/* Back */}
        <button
          onClick={() => navigate("/kelas")}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Halaman Utama
        </button>

        {/* Success toast */}
        {successMsg && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3">
            <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-semibold text-emerald-700">{successMsg}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <svg className="animate-spin h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-rose-700 max-w-lg">
            <p className="font-semibold">{error}</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{mapelName}</h1>
                <div className="mt-2 flex items-center gap-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                    </svg>
                    {jumlahSiswa} Siswa
                  </span>
                  {fullKelasName && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="font-medium text-slate-600">{fullKelasName}</span>
                    </>
                  )}
                </div>
              </div>
              {tahunAjaran && (
                <span className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                  TAHUN AJARAN {tahunAjaran}
                </span>
              )}
            </div>

            {/* Tabs bar */}
            <div className="mt-6 border-b border-slate-200">
              {/* Tabs row */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-shrink-0 px-4 py-3 text-sm font-semibold transition border-b-2 -mb-px ${activeTab === tab
                      ? "border-blue-600 text-blue-600 bg-blue-50 rounded-t-lg"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {/* Action button — below tabs on mobile, right-aligned on desktop */}
              <div className="flex justify-end py-2 gap-2">
                {activeTab === "Materi" && (
                  <button
                    onClick={() => navigate(`/kelas/${id}/upload-materi`, {
                      state: {
                        actualMapelId: kelasInfo?.mapel_id || kelasInfo?.mata_pelajaran_id || id,
                        rombelId: kelasInfo?.rombel_id || kelasInfo?.kelas_id || kelasInfo?.rombel?.id || null,
                      }
                    })}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    Upload Materi
                  </button>
                )}
                {activeTab === "Tugas" && (
                  <>
                    <button
                      onClick={handleDownloadRecap}
                      disabled={isDownloadingRecap}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      {isDownloadingRecap ? (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                      )}
                      Rekap Nilai
                    </button>
                    <button
                      onClick={() => navigate(`/kelas/${id}/buat-tugas`, {
                        state: {
                          actualMapelId: kelasInfo?.mapel_id || kelasInfo?.mata_pelajaran_id || id,
                          rombelId: kelasInfo?.rombel_id || kelasInfo?.kelas_id || kelasInfo?.rombel?.id || null,
                        }
                      })}
                      className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Buat Tugas
                    </button>
                  </>
                )}
                {activeTab === "Pengumuman" && (
                  <button
                    onClick={() => navigate(`/kelas/${id}/buat-pengumuman`, {
                      state: {
                        actualMapelId: kelasInfo?.mapel_id || kelasInfo?.mata_pelajaran_id || id,
                        rombelId: kelasInfo?.rombel_id || kelasInfo?.kelas_id || kelasInfo?.rombel?.id || null,
                        anggotaKelasId: kelasInfo?.anggota_kelas_id || kelasInfo?.anggota_id || (String(kelasInfo?.id) === String(id) ? id : null),
                      }
                    })}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                    Buat Pengumuman
                  </button>
                )}
              </div>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === "Materi" && (
                <div>
                  <h2 className="mb-4 text-lg font-bold text-slate-800">RPP (Rencana Pelaksanaan Pembelajaran)</h2>
                  {rppList.length > 0 ? (
                    <div className="mb-8 flex flex-col gap-4">
                      {[...rppList].sort((a, b) => b.id - a.id).map((rpp) => {
                        const isExpanded = expandedRppId === rpp.id;
                        return (
                        <div
                          key={rpp.id}
                          onClick={() => setExpandedRppId(isExpanded ? null : rpp.id)}
                          className="group flex flex-col rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md cursor-pointer"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-base font-bold text-slate-800">{rpp.judul}</h3>
                                  {(rpp.is_published || rpp.status === "approved") ? (
                                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">Publik</span>
                                  ) : (
                                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md">Draf</span>
                                  )}
                                </div>
                                <svg className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                              {rpp.deskripsi && (
                                <p className="text-sm text-slate-500 mb-3">{rpp.deskripsi}</p>
                              )}
                              
                              {isExpanded && rpp.files && rpp.files.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-indigo-100 flex flex-col items-start gap-2">
                                  {[...(rpp.files || [])].sort((a, b) => b.id - a.id).map((file) => (
                                    <a
                                      key={file.id}
                                      href={fixFileUrl(file.url || file.path)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {file.nama_file}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mb-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-8 text-center">
                      <p className="text-sm text-slate-500">Belum ada RPP untuk mata pelajaran ini.</p>
                      <button onClick={() => navigate("/rpp")} className="mt-2 text-sm font-bold text-blue-600 hover:underline">Kelola RPP</button>
                    </div>
                  )}

                  <h2 className="mb-4 text-lg font-bold text-slate-800">Materi Pembelajaran</h2>

                  {materiList.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
                      <svg className="mx-auto h-12 w-12 text-slate-300 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <p className="font-semibold text-slate-500">Belum ada materi</p>
                      <p className="mt-1 text-sm text-slate-400">Klik "+ Upload Materi" untuk menambahkan materi baru.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {materiList.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => navigate(`/kelas/${id}/materi/${m.id}`, { state: { materi: m, mapelName: kelasInfo?.mapel?.nama_pelajaran, className: kelasInfo?.tingkat ? `${kelasInfo.tingkat} ${kelasInfo.jurusan}` : '' } })}
                          className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                        >
                          <div className="flex items-center gap-5">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition">{m.judul}</h3>
                              {m.deskripsi && (
                                <p className="mt-1 text-xs text-slate-500 truncate max-w-sm">{m.deskripsi}</p>
                              )}
                              <p className="mt-1 text-xs text-slate-400">{formatDate(m.created_at || m.tanggal)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm(m);
                              }}
                              className="flex h-9 w-9 items-center justify-center rounded-full text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                              title="Hapus"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "Tugas" && (() => {
                // Group tasks by rpp_id
                const grouped = {};
                const noRpp = [];
                tugasList.forEach((tugas) => {
                  if (tugas.rpp_id) {
                    if (!grouped[tugas.rpp_id]) grouped[tugas.rpp_id] = { tugas: [] };
                    grouped[tugas.rpp_id].tugas.push(tugas);
                  } else {
                    noRpp.push(tugas);
                  }
                });

                // Render a single task card
                const renderTugasCard = (tugas) => (
                  <div
                    key={tugas.id}
                    onClick={() => navigate(`/kelas/${id}/edit-tugas/${tugas.id}`, { state: { tugas } })}
                    className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                  >
                    {/* Row 1: icon + title + action buttons */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                          </svg>
                        </div>
                        <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition leading-tight">{tugas.judul}</span>
                      </div>
                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/kelas/${id}/tugas/${tugas.id}/pengumpulan`); }}
                          className="rounded-lg bg-blue-100 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-200 transition whitespace-nowrap"
                        >
                          Nilai
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/kelas/${id}/edit-tugas/${tugas.id}`, { state: { tugas } }); }}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-blue-500 transition hover:bg-blue-50 hover:text-blue-700"
                          title="Edit"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTugasConfirm(tugas); }}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                          title="Hapus"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Row 2: desc + deadline */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 pl-12">
                      {tugas.deskripsi && (
                        <p className="text-xs text-slate-500 line-clamp-1 flex-1 min-w-0">{tugas.deskripsi}</p>
                      )}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <svg className="h-3.5 w-3.5 text-amber-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-semibold text-amber-600">{formatDeadline(tugas.deadline)}</span>
                      </div>
                    </div>
                  </div>
                );

                return (
                  <div>
                    <h2 className="mb-4 text-lg font-bold text-slate-800">Daftar Tugas</h2>

                    {tugasList.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
                        <svg className="mx-auto h-12 w-12 text-slate-300 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        <p className="font-semibold text-slate-500">Belum ada tugas</p>
                        <p className="mt-1 text-sm text-slate-400">Klik "Buat Tugas" untuk memberikan penugasan baru.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-6">
                        {/* Tugas yang terkait dengan RPP */}
                        {Object.keys(grouped).map((rppId) => {
                          const rppData = rppList.find((r) => String(r.id) === String(rppId));
                          const rppJudul = rppData?.judul || grouped[rppId].tugas[0]?.rpp?.judul || `RPP #${rppId}`;
                          return (
                            <div key={rppId}>
                              {/* RPP Group Header */}
                              <div className="mb-3 flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-700 leading-tight">{rppJudul}</p>
                                </div>
                                <span className="ml-auto rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-600">{grouped[rppId].tugas.length} tugas</span>
                              </div>
                              <div className="flex flex-col gap-3 pl-2 border-l-2 border-indigo-100">
                                {grouped[rppId].tugas.map(renderTugasCard)}
                              </div>
                            </div>
                          );
                        })}

                        {/* Tugas tanpa RPP */}
                        {noRpp.length > 0 && (
                          <div>
                            <div className="mb-3 flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tugas</p>
                                <p className="text-sm font-bold text-slate-600 leading-tight">Tanpa RPP</p>
                              </div>
                              <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">{noRpp.length} tugas</span>
                            </div>
                            <div className="flex flex-col gap-3 pl-2 border-l-2 border-slate-200">
                              {noRpp.map(renderTugasCard)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}


              {activeTab === "Pengumuman" && (
                <div>
                  {pengumumanList.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
                      <svg className="mx-auto h-12 w-12 text-slate-300 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                      <p className="font-semibold text-slate-500">Belum ada pengumuman</p>
                      <p className="mt-1 text-sm text-slate-400">Klik "Buat Pengumuman" untuk membuat pengumuman baru.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {pengumumanList.map((p) => {
                        const initials = (p.guru?.nama || p.nama_guru || "G").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                        const guruName = p.guru?.nama || p.nama_guru || "Guru";
                        return (
                          <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-slate-800 leading-snug">{p.judul}</h3>
                                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{p.deskripsi}</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => navigate(`/kelas/${id}/edit-pengumuman/${p.id}`, {
                                    state: {
                                      pengumuman: p,
                                      actualMapelId: kelasInfo?.mapel_id || kelasInfo?.mata_pelajaran_id || id,
                                      anggotaKelasId: kelasInfo?.anggota_kelas_id || kelasInfo?.anggota_id || id,
                                      rombelId: kelasInfo?.rombel_id || kelasInfo?.kelas_id || kelasInfo?.rombel?.id || null,
                                    }
                                  })}
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-blue-500 transition hover:bg-blue-50 hover:text-blue-700"
                                  title="Edit"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setDeletePengumumanConfirm(p)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                                  title="Hapus"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                                <span className="ml-2 text-xs text-slate-400 font-medium whitespace-nowrap">
                                  {formatDate(p.created_at || p.tanggal)}
                                </span>
                              </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white text-[10px] font-bold">
                                {initials}
                              </div>
                              <span className="text-xs font-semibold text-slate-500">{guruName}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "Siswa" && (() => {
                const filtered = siswaList.filter((s) => {
                  const nama = (s.siswa?.nama || s.nama || "").toLowerCase();
                  const nis  = String(s.siswa?.nis || s.nis || "");
                  return nama.includes(searchSiswa.toLowerCase()) || nis.includes(searchSiswa);
                });


                return (
                  <div className="relative">
                    {/* Header row */}
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-bold text-slate-800">Daftar Siswa</h2>
                      {/* Search */}
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                          <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Cari nama atau NIS..."
                          value={searchSiswa}
                          onChange={(e) => setSearchSiswa(e.target.value)}
                          className="rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
                        />
                      </div>
                    </div>


                    {/* Table */}
                    {filtered.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
                        <svg className="mx-auto h-12 w-12 text-slate-300 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                        </svg>
                        <p className="font-semibold text-slate-500">
                          {siswaList.length === 0 ? "Belum ada siswa terdaftar" : "Tidak ada hasil yang cocok"}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {siswaList.length === 0 ? "Siswa akan muncul setelah didaftarkan ke kelas ini." : "Coba ubah kata kunci atau filter."}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <table className="w-full border-collapse">
                          <colgroup>
                            <col className="w-1/2" />
                            <col className="w-1/4" />
                            <col className="w-1/4" />
                          </colgroup>
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Nama Siswa</th>
                              <th className="px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-slate-500">NIS</th>
                              <th className="px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-slate-500">Jenis Kelamin</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((s, idx) => {
                              const nama   = s.siswa?.nama   || s.nama   || "-";
                              const nis    = s.siswa?.nis    || s.nis    || "-";
                              const gender = s.siswa?.jenis_kelamin || s.jenis_kelamin || "-";
                              const status = s.status || "Aktif";
                              const initials = nama.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                              return (
                                <tr
                                  key={s.id || idx}
                                  className={`transition hover:bg-blue-50 ${idx !== filtered.length - 1 ? "border-b border-slate-100" : ""}`}
                                >
                                  <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold">
                                        {initials}
                                      </div>
                                      <span className="text-sm font-semibold text-slate-800">{nama}</span>
                                    </div>
                                  </td>
                                  <td className="px-5 py-3.5 text-center">
                                    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{nis}</span>
                                  </td>
                                  <td className="px-5 py-3.5 text-center text-sm text-slate-600 font-medium">{gender}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <div className="border-t border-slate-100 bg-slate-50 px-5 py-2.5 text-xs text-slate-500">
                          Menampilkan <span className="font-bold text-slate-700">{filtered.length}</span> dari{" "}
                          <span className="font-bold text-slate-700">{siswaList.length}</span> siswa terdaftar
                        </div>
                      </div>
                    )}


                  </div>
                );
              })()}

              {activeTab === "Diskusi" && (
                <div className="mt-2">
                  <DiskusiMapel mapelId={kelasInfo?.mapel_id || kelasInfo?.mata_pelajaran_id || id} />
                </div>
              )}

              {activeTab !== "Materi" && activeTab !== "Tugas" && activeTab !== "Pengumuman" && activeTab !== "Siswa" && activeTab !== "Diskusi" && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-24 text-center">
                  <svg className="mb-4 h-12 w-12 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-semibold text-slate-500">Fitur {activeTab} Segera Hadir</p>
                  <p className="mt-1 text-sm text-slate-400">Halaman ini masih dalam pengembangan.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
              <svg className="h-7 w-7 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Hapus Materi?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Materi <span className="font-semibold text-slate-700">"{deleteConfirm.judul}"</span> akan dihapus secara permanen.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Batal
              </button>
              <button onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-bold text-white hover:bg-rose-600">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Tugas Confirm */}
      {deleteTugasConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
              <svg className="h-7 w-7 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Hapus Tugas?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Tugas <span className="font-semibold text-slate-700">"{deleteTugasConfirm.judul}"</span> akan dihapus secara permanen beserta semua pengumpulan siswa terkait.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setDeleteTugasConfirm(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Batal
              </button>
              <button onClick={() => handleDeleteTugas(deleteTugasConfirm.id)}
                className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-bold text-white hover:bg-rose-600">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Pengumuman Confirm */}
      {deletePengumumanConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
              <svg className="h-7 w-7 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Hapus Pengumuman?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Pengumuman <span className="font-semibold text-slate-700">"{deletePengumumanConfirm.judul}"</span> akan dihapus secara permanen.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setDeletePengumumanConfirm(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Batal
              </button>
              <button onClick={() => handleDeletePengumuman(deletePengumumanConfirm.id)}
                className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-bold text-white hover:bg-rose-600">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      </GuruLayout>
  );
}
