import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { createPengumuman } from "../services/authService";

const GURU_NAV = [
  { label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", path: "/dashboard" },
  { label: "Kelas", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", path: "/kelas" },
];

export default function BuatPengumuman() {
  const { id } = useParams(); // URL kelas id (pivot id)
  const navigate = useNavigate();
  const location = useLocation();
  // actualMapelId is the real mata_pelajaran.id passed from KelasDetail via state
  const actualMapelId = location.state?.actualMapelId || id;
  const anggotaKelasId = location.state?.anggotaKelasId || null;
  const rombelId = location.state?.rombelId || null;

  const [form, setForm] = useState({ judul: "", deskripsi: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.judul.trim()) { setError("Judul pengumuman wajib diisi."); return; }
    if (!form.deskripsi.trim()) { setError("Isi pengumuman wajib diisi."); return; }

    setLoading(true);
    setError("");
    try {
      const payload = {
        judul: form.judul,
        deskripsi: form.deskripsi,
        mapel_id: actualMapelId,
        mata_pelajaran_id: actualMapelId, // Send both just in case
      };

      if (rombelId) {
        payload.rombel_id = rombelId;
      }
      
      // Only send anggota_kelas_id if it's explicitly different from mapelId/id
      if (anggotaKelasId && anggotaKelasId !== id && anggotaKelasId !== actualMapelId) {
        payload.anggota_kelas_id = anggotaKelasId;
      }

      await createPengumuman(payload);
      navigate(`/kelas/${id}`, { state: { successMsg: "Pengumuman berhasil dipublikasikan!", activeTab: "Pengumuman" } });
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal membuat pengumuman.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4FF] flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 flex h-full w-44 flex-col bg-white border-r border-slate-100 shadow-sm z-20">
        <div className="px-5 pt-6 pb-4 border-b border-slate-100">
          <p className="text-xs font-bold text-blue-700 tracking-widest">LMS</p>
          <p className="text-[10px] font-semibold text-slate-500 mt-0.5">SMK - YAPSIPA TASIKMALAYA</p>
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1">
          {GURU_NAV.map((item) => {
            const isActive = item.path === "/kelas"
              ? window.location.pathname.startsWith("/kelas")
              : window.location.pathname === item.path;
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
          <a href="/profile" className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profil
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-44 flex-1 flex flex-col min-h-screen">
        <div className="flex-1 px-12 py-12 max-w-3xl">

          {/* Back Button */}
          <button
            onClick={() => navigate(`/kelas/${id}`)}
            className="mb-8 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Kelas
          </button>

          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Tulis Pengumuman Baru</h1>
                <p className="mt-0.5 text-slate-500 text-[14px]">
                  Informasi ini akan disiarkan ke seluruh siswa di kelas yang Anda pilih.
                </p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSubmit}>
            <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100 space-y-7">

              {/* Judul */}
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Judul Pengumuman
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                    <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={form.judul}
                    onChange={(e) => setForm({ ...form, judul: e.target.value })}
                    placeholder="Contoh: Perubahan Jadwal Ujian Tengah Semester"
                    className="w-full rounded-xl border-0 bg-[#E8F0FE] pl-11 pr-4 py-3.5 text-[15px] text-slate-700 placeholder-slate-400 outline-none transition focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>

              {/* Isi */}
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Isi Pengumuman
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute top-4 left-4 flex items-start">
                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h8" />
                    </svg>
                  </div>
                  <textarea
                    value={form.deskripsi}
                    onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                    placeholder="Tuliskan detail pengumuman Anda di sini..."
                    rows={8}
                    className="w-full rounded-xl border-0 bg-[#E8F0FE] pl-11 pr-4 py-3.5 text-[15px] text-slate-700 placeholder-slate-400 outline-none transition focus:ring-2 focus:ring-blue-300 resize-none"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 border border-rose-200">
                  <svg className="h-5 w-5 text-rose-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <p className="text-sm font-medium text-rose-600">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => navigate(`/kelas/${id}`)}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-[14px] font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-[#0B57D0] px-7 py-3 text-[14px] font-bold text-white hover:bg-blue-800 disabled:opacity-60 transition shadow-sm"
                >
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Mempublikasikan...
                    </>
                  ) : (
                    <>  
                      Kirim
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
