import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { createTugas } from "../services/authService";

const GURU_NAV = [
  { label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", path: "/dashboard" },
  { label: "Kelas", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", path: "/kelas" },
  { label: "Penilaian", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", path: "/penilaian" },
  { label: "Profil", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", path: "/profile" },
];

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function BuatTugas() {
  const { id } = useParams(); // mapel id
  const navigate = useNavigate();
  const location = useLocation();
  const actualMapelId = location.state?.actualMapelId || id;
  const rombelId = location.state?.rombelId || null;

  const [form, setForm] = useState({ judul: "", deskripsi: "", deadline: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.judul.trim()) { setError("Judul tugas wajib diisi."); return; }
    if (!form.deadline) { setError("Batas waktu (deadline) wajib diisi."); return; }

    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("judul", form.judul);
      fd.append("deskripsi", form.deskripsi);
      fd.append("deadline", form.deadline);
      fd.append("mapel_id", actualMapelId);

      await createTugas(fd);
      navigate(`/kelas/${id}`, { state: { successMsg: "Tugas berhasil dibuat!" } });
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal membuat tugas.");
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
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"
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
        <div className="flex-1 px-12 py-12 max-w-4xl">
          {/* Page Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-slate-900">Buat Tugas Baru</h1>
            <p className="mt-2 text-slate-500 text-[15px] leading-relaxed">
              Buat penugasan untuk siswa. Anda dapat melampirkan file pendukung dan menentukan batas waktu pengumpulan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8">
            {/* Kolom Kiri: Form Utama */}
            <div className="flex-1 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100 space-y-8">
              {/* Judul */}
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Judul Tugas
                </label>
                <input
                  type="text"
                  value={form.judul}
                  onChange={(e) => setForm({ ...form, judul: e.target.value })}
                  placeholder="Contoh: Esai Sejarah Kemerdekaan"
                  className="w-full rounded-xl border-0 bg-[#E8F0FE] px-4 py-3.5 text-[15px] text-slate-700 placeholder-slate-400 outline-none transition focus:ring-2 focus:ring-blue-300"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Instruksi / Deskripsi
                </label>
                <textarea
                  value={form.deskripsi}
                  onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                  placeholder="Tuliskan instruksi detail untuk siswa di sini..."
                  rows={6}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] text-slate-700 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none"
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Tenggat Waktu (Deadline)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                    <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                  <input
                    type="datetime-local"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="w-full rounded-xl border-0 bg-[#E8F0FE] py-3.5 pl-12 pr-4 text-[15px] text-slate-700 outline-none transition focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>


              {error && (
                <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                  {error}
                </p>
              )}
            </div>

            {/* Kolom Kanan: Aksi */}
            <div className="w-full lg:w-[260px] shrink-0 space-y-6">

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/kelas/${id}`)}
                  className="flex-1 rounded-xl border-2 border-blue-100 bg-white py-3.5 text-[14px] font-bold text-blue-600 hover:bg-blue-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[1.5] flex items-center justify-center gap-2 rounded-xl bg-[#0B57D0] py-3.5 text-[14px] font-bold text-white hover:bg-blue-800 disabled:opacity-60 transition"
                >
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Menyimpan...
                    </>
                  ) : (
                    <>

                      Simpan
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
