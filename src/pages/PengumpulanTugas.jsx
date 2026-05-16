import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPengumpulanGuru, simpanNilaiGuru } from "../services/authService";
import { fixFileUrl } from "../api/api";
import { toast, confirmDialog } from "../utils/notify";

const GURU_NAV = [
  { label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", path: "/dashboard" },
  { label: "Kelas", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", path: "/kelas" },
  { label: "Penilaian", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", path: "/penilaian" },
  { label: "Profil", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", path: "/profile" },
];

export default function PengumpulanTugas() {
  const { id, tugasId } = useParams();
  const navigate = useNavigate();

  const [tugas, setTugas] = useState(null);
  const [summary, setSummary] = useState({ total_siswa: 0, mengumpulkan: 0 });
  const [pengumpulanList, setPengumpulanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalNilai, setModalNilai] = useState({ isOpen: false, data: null, nilaiInput: "", catatanInput: "" });
  const [savingNilai, setSavingNilai] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch detail tugas + pengumpulan sekaligus dari satu endpoint
        const resPengumpulan = await getPengumpulanGuru(tugasId);

        // Tangani berbagai format response backend
        const rawData = resPengumpulan.data;
        const resData = rawData?.data?.data || rawData?.data || rawData;

        console.log("[PengumpulanTugas] Raw response:", rawData);

        // Ambil detail tugas dari response
        setTugas(resData?.tugas || rawData?.tugas || null);

        // Ambil summary
        setSummary(
          resData?.summary ||
          rawData?.summary ||
          { total_siswa: 0, mengumpulkan: 0 }
        );

        // Ambil daftar pengumpulan — coba semua kemungkinan field
        const daftar =
          resData?.daftar_pengumpulan ||
          rawData?.daftar_pengumpulan ||
          resData?.pengumpulan ||
          rawData?.pengumpulan ||
          resData?.data ||
          (Array.isArray(resData) ? resData : []);

        setPengumpulanList(Array.isArray(daftar) ? daftar : []);
      } catch (err) {
        console.error("Gagal memuat data pengumpulan:", err);
        const msg = err?.response?.data?.message || err?.message || "Endpoint tidak tersedia";
        setError(`Gagal memuat data pengumpulan: ${msg}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tugasId]);

  const handleLogout = async () => {
    const ok = await confirmDialog("Yakin ingin logout?", { isDanger: true, title: "Logout" });
    if (ok) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  };

  const openModalNilai = (item) => {
    setModalNilai({
      isOpen: true,
      data: item,
      nilaiInput: item.nilai && item.nilai !== "--" ? item.nilai : "",
      catatanInput: item.catatan || ""
    });
  };

  const closeModalNilai = () => {
    setModalNilai({ isOpen: false, data: null, nilaiInput: "", catatanInput: "" });
  };

  const handleSimpanNilaiModal = async () => {
    const { data, nilaiInput, catatanInput } = modalNilai;
    if (!data || !nilaiInput || nilaiInput.toString().trim() === "") return;

    try {
      setSavingNilai(true);
      await simpanNilaiGuru(data.pengumpulan_id, nilaiInput, catatanInput);

      // Update pengumpulanList agar nilai tampil langsung
      setPengumpulanList((prev) =>
        prev.map((item) =>
          item.pengumpulan_id === data.pengumpulan_id ? { ...item, nilai: nilaiInput.toString(), catatan: catatanInput } : item
        )
      );

      closeModalNilai();
    } catch (err) {
      console.error("Gagal menyimpan nilai:", err);
      toast("Gagal menyimpan nilai. Silakan coba lagi.", "error");
    } finally {
      setSavingNilai(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    const dateObj = new Date(dateString);
    return dateObj.toLocaleString("id-ID", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    }).replace(/\./g, ":");
  };

  // Menghitung statistik dari summary backend
  const listData = Array.isArray(pengumpulanList) ? pengumpulanList : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-10">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 max-w-lg text-center font-semibold">
          {error}
        </div>
        <button
          onClick={() => navigate(`/kelas/${id}`)}
          className="mt-6 text-blue-600 font-bold hover:underline"
        >
          Kembali ke Kelas
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 flex h-full w-44 flex-col bg-white border-r border-slate-100 shadow-sm z-20">
        <div className="px-5 pt-6 pb-4 border-b border-slate-100">
          <p className="text-xs font-bold text-blue-700 tracking-widest">LMS</p>
          <p className="text-[10px] font-semibold text-slate-500 mt-0.5">SMK - YAPSIPA TASIKMALAYA</p>
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1">
          {GURU_NAV.map((item) => {
            const isActive = item.path === "/kelas";
            return (
              <a
                key={item.label}
                href={item.path}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </a>
            );
          })}
        </nav>
        <div className="px-4 pb-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-semibold text-rose-500 hover:text-rose-700 transition"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            LOGOUT
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-44 flex-1 px-10 py-10 max-w-7xl">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/kelas/${id}`)}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Kembali
        </button>

        {/* Header */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {tugas?.judul || "Detail Tugas"}
            </h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 font-medium">
              Tenggat: {formatDateTime(tugas?.deadline)}
            </div>
          </div>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="flex items-center gap-5 rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500">
              <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">TOTAL SISWA</p>
              <h2 className="text-3xl font-extrabold text-slate-800 mt-0.5">{summary.total_siswa}</h2>
            </div>
          </div>
          <div className="flex items-center gap-5 rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">MENGUMPULKAN</p>
              <h2 className="text-3xl font-extrabold text-slate-800 mt-0.5">{summary.mengumpulkan}</h2>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">Daftar Pengumpulan</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-bold">SISWA</th>
                  <th className="px-6 py-4 font-bold">WAKTU</th>
                  <th className="px-6 py-4 font-bold">LAMPIRAN</th>
                  <th className="px-6 py-4 font-bold">STATUS</th>
                  <th className="px-6 py-4 font-bold">NILAI</th>
                  <th className="px-6 py-4 font-bold text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-slate-500 font-medium">
                      Belum ada data pengumpulan untuk tugas ini.
                    </td>
                  </tr>
                ) : (
                  listData.map((item, idx) => {
                    const isSubmitted = item.status === "HADIR";

                    return (
                      <tr key={item.siswa_id || idx} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-5">
                          <div className="font-bold text-slate-800">{item.nama_siswa || "—"}</div>
                          <div className="text-xs text-slate-400 mt-0.5">NISN: {item.nisn || "-"}</div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="font-medium text-slate-800">{item.waktu || "—"}</div>
                          {(() => {
                            // Status waktu dihitung dari waktu kumpul vs deadline
                            // Bukan dari waktu sekarang vs deadline
                            const deadline = tugas?.deadline ? new Date(tugas.deadline) : null;
                            const waktuKumpul = item.waktu_raw || item.created_at
                              ? new Date(item.waktu_raw || item.created_at) : null;

                            // Gunakan status_waktu dari backend jika ada, 
                            // tapi pastikan berbasis waktu kumpul bukan waktu sekarang
                            if (!item.waktu && !item.waktu_raw) return null; // Belum kumpul

                            // Jika backend sudah kirim status, pakai itu
                            // tapi override jika siswa kumpul SEBELUM deadline
                            const isTepatWaktu = waktuKumpul && deadline
                              ? waktuKumpul <= deadline
                              : item.status_waktu === "TEPAT WAKTU";

                            return isTepatWaktu ? (
                              <div className="text-[10px] font-bold text-emerald-600 mt-0.5 tracking-wide">TEPAT WAKTU</div>
                            ) : item.status_waktu === "TERLAMBAT" ? (
                              <div className="text-[10px] font-bold text-amber-600 mt-0.5 tracking-wide">TERLAMBAT</div>
                            ) : null;
                          })()
                          }
                        </td>
                        <td className="px-6 py-5">
                          {item.lampiran ? (
                            <a href={fixFileUrl(item.lampiran)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 hover:underline transition max-w-[200px] truncate">
                              <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              <span className="truncate">{item.nama_file || "Lihat File"}</span>
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-md">{item.nama_file || "Belum ada file"}</span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          {isSubmitted ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black tracking-wider text-emerald-700 uppercase">
                              HADIR
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-black tracking-wider text-rose-700 uppercase">
                              ALFA
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <div className="font-extrabold text-slate-800 text-base">
                            {item.nilai && item.nilai !== "--" ? (
                              <div>
                                <span>{item.nilai}</span>
                                {item.catatan && (
                                  <p className="text-[10px] text-slate-500 font-medium mt-1 italic line-clamp-2 max-w-[150px]" title={item.catatan}>
                                    "{item.catatan}"
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300 font-bold text-sm">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          {isSubmitted && (
                            <button
                              onClick={() => openModalNilai(item)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-600 hover:text-white transition"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Nilai
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Beri Nilai */}
      {modalNilai.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-lg">Beri Nilai</h3>
              <button onClick={closeModalNilai} className="text-slate-400 hover:text-slate-600 transition p-1 rounded-full hover:bg-slate-100">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-5 bg-blue-50 rounded-2xl p-4">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Nama Siswa</p>
                <p className="font-extrabold text-blue-900 text-lg">{modalNilai.data?.nama_siswa}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nilai (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  autoFocus
                  value={modalNilai.nilaiInput}
                  onChange={(e) => setModalNilai({ ...modalNilai, nilaiInput: e.target.value })}
                  className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-5 py-3.5 text-xl font-black text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={closeModalNilai}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSimpanNilaiModal}
                disabled={savingNilai || !modalNilai.nilaiInput}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                {savingNilai ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Nilai"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
