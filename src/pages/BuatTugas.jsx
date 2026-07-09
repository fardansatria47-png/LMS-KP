import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { createTugas, getRpp } from "../services/authService";
import GuruLayout from "../components/GuruLayout";
import { getErrorMessage } from "../utils/translateError";


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

  const [form, setForm] = useState({ judul: "", deskripsi: "", deadline: "", rpp_id: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rppList, setRppList] = useState([]);


  useEffect(() => {
    const fetchRpp = async () => {
      try {
        const rppRes = await getRpp({ mapel_id: actualMapelId });
        const rawRpp = rppRes.data?.data || rppRes.data || [];
        setRppList(Array.isArray(rawRpp) ? rawRpp : []);
      } catch (err) {
        console.error("Gagal memuat RPP:", err);
      }
    };
    fetchRpp();
  }, [actualMapelId]);


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
      if (form.rpp_id) {
        fd.append("rpp_id", form.rpp_id);
      }
      if (rombelId) {
        fd.append("rombel_id", rombelId);
      }

      await createTugas(fd);
      navigate(`/kelas/${id}`, { state: { successMsg: "Tugas berhasil dibuat!" } });
    } catch (err) {
      setError(getErrorMessage(err, "Gagal membuat tugas."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuruLayout title="Buat Tugas">
      <div className="px-4 sm:px-6 lg:px-12 py-6 lg:py-10 max-w-4xl">

        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate(`/kelas/${id}`)}
          className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Kelas
        </button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">Buat Tugas Baru</h1>
          <p className="mt-2 text-slate-500 text-sm sm:text-[15px] leading-relaxed">
            Buat penugasan untuk siswa dan tentukan batas waktu pengumpulan.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Form Card */}
          <div className="rounded-2xl bg-white p-5 sm:p-8 shadow-sm ring-1 ring-slate-100 space-y-6">
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
                className="w-full rounded-xl border-0 bg-[#E8F0FE] px-4 py-3 text-[15px] text-slate-700 placeholder-slate-400 outline-none transition focus:ring-2 focus:ring-blue-300"
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
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-700 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none"
              />
            </div>

            {/* RPP (Opsional) */}
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Pilih RPP (Opsional)
              </label>
              <select
                value={form.rpp_id}
                onChange={(e) => setForm({ ...form, rpp_id: e.target.value })}
                className="w-full rounded-xl border-0 bg-[#E8F0FE] px-4 py-3 text-[15px] text-slate-700 outline-none transition focus:ring-2 focus:ring-blue-300"
              >
                <option value="">-- Tanpa RPP --</option>
                {rppList.map((rpp) => (
                  <option key={rpp.id} value={rpp.id}>
                    {rpp.judul}
                  </option>
                ))}
              </select>
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
                  className="w-full rounded-xl border-0 bg-[#E8F0FE] py-3 pl-12 pr-4 text-[15px] text-slate-700 outline-none transition focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</p>
            )}
          </div>

          {/* Action Buttons — sticky bottom on mobile, normal on desktop */}
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => navigate(`/kelas/${id}`)}
              className="flex-1 rounded-xl border-2 border-blue-100 bg-white py-3 text-[14px] font-bold text-blue-600 hover:bg-blue-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-[#0B57D0] py-3 text-[14px] font-bold text-white hover:bg-blue-800 disabled:opacity-60 transition"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Menyimpan...
                </>
              ) : "Simpan Tugas"}
            </button>
          </div>
        </form>
      </div>

    </GuruLayout>
  );
}
