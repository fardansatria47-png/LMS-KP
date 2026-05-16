import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { updatePengumuman } from "../services/authService";
import GuruLayout from "../components/GuruLayout";



export default function EditPengumuman() {
  const { id, pengumumanId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const existing = location.state?.pengumuman || null;
  const actualMapelId = location.state?.actualMapelId || id;
  const anggotaKelasId = location.state?.anggotaKelasId || null;

  const [form, setForm] = useState({
    judul: existing?.judul || "",
    deskripsi: existing?.deskripsi || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.judul.trim()) { setError("Judul pengumuman wajib diisi."); return; }
    if (!form.deskripsi.trim()) { setError("Isi pengumuman wajib diisi."); return; }

    setLoading(true);
    setError("");
    try {
      await updatePengumuman(pengumumanId, {
        judul: form.judul,
        deskripsi: form.deskripsi,
        mapel_id: actualMapelId,
        ...(anggotaKelasId ? { anggota_kelas_id: anggotaKelasId } : {}),
      });
      navigate(`/kelas/${id}`, { state: { successMsg: "Pengumuman berhasil diperbarui!", activeTab: "Pengumuman" } });
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memperbarui pengumuman.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuruLayout title="Edit Pengumuman">
      <div className="px-4 sm:px-6 lg:px-12 py-6 lg:py-12 max-w-3xl">

          {/* Back Button */}
          <button
            onClick={() => navigate(`/kelas/${id}`, { state: { activeTab: "Pengumuman" } })}
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
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Edit Pengumuman</h1>
                <p className="mt-0.5 text-slate-500 text-[14px]">
                  Perbarui informasi pengumuman yang sudah dipublikasikan.
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
                  onClick={() => navigate(`/kelas/${id}`, { state: { activeTab: "Pengumuman" } })}
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
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
      </div>
    </GuruLayout>
  );
}
