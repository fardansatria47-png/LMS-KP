import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { createPengumuman } from "../services/authService";
import GuruLayout from "../components/GuruLayout";
import { getErrorMessage } from "../utils/translateError";



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
      setError(getErrorMessage(err, "Gagal membuat pengumuman."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuruLayout title="Tulis Pengumuman">
      <div className="px-4 sm:px-6 lg:px-12 py-6 lg:py-12 max-w-3xl">

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
    </GuruLayout>
  );
}
