import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { createTugas, generateDeskripsiAI } from "../services/authService";
import GuruLayout from "../components/GuruLayout";


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

  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const handleGenerateDeskripsi = async () => {
    if (!aiPrompt.trim()) { setAiError("Topik wajib diisi."); return; }
    
    setAiLoading(true);
    setAiError("");
    try {
      const res = await generateDeskripsiAI({ prompt: aiPrompt });
      const deskripsiAI = res.data?.data?.deskripsi;
      
      if (!deskripsiAI) throw new Error("Gagal mendapatkan teks dari respons AI");
      
      const newDesc = form.deskripsi ? form.deskripsi + "\n\n" + deskripsiAI : deskripsiAI;
      setForm({ ...form, deskripsi: newDesc });
      
      setShowAIModal(false);
      setAiPrompt("");
    } catch (err) {
      setAiError(err?.response?.data?.message || err.message || "Gagal generate deskripsi.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleCloseAIModal = () => {
    setShowAIModal(false);
    setAiPrompt("");
    setAiError("");
  };

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
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Instruksi / Deskripsi
                </label>
                <button
                  type="button"
                  onClick={() => setShowAIModal(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:from-indigo-600 hover:to-purple-600 transition"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                  Generate AI ✨
                </button>
              </div>
              <textarea
                value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                placeholder="Tuliskan instruksi detail untuk siswa di sini..."
                rows={6}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-700 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none"
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

      {/* Modal Generate AI */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-slate-800">Generate Tugas AI</h3>
                  <p className="text-[12px] font-medium text-slate-500">Otomatis buat instruksi tugas</p>
                </div>
              </div>
              <button
                onClick={handleCloseAIModal}
                disabled={aiLoading}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition disabled:opacity-50"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto">
              {aiError && (
                <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 font-medium">
                  {aiError}
                </div>
              )}

              {!aiLoading ? (
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Topik / Instruksi AI</label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Contoh: Buatkan instruksi tugas untuk membuat video dokumenter lingkungan dengan durasi 3-5 menit..."
                      rows={5}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-1 focus:ring-indigo-400 resize-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 animate-ping rounded-full bg-indigo-200 opacity-75"></div>
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg">
                      <svg className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-slate-800">AI Sedang Merangkai Teks...</h4>
                  <p className="mt-2 max-w-xs text-sm text-slate-500">Harap tunggu beberapa detik.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 p-6 bg-slate-50 flex gap-3 justify-end">
              <button onClick={handleCloseAIModal} disabled={aiLoading} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition disabled:opacity-50">Batal</button>
              <button onClick={handleGenerateDeskripsi} disabled={aiLoading} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50 transition">
                {aiLoading ? "Sedang Generate..." : "Generate & Gunakan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </GuruLayout>
  );
}
