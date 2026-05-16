import { useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { createMateri } from "../services/authService";
import GuruLayout from "../components/GuruLayout";



// Detect tipe from file mime / extension
function detectTipe(file) {
  if (!file) return "";
  const mime = file.type || "";
  const name = file.name || "";
  const ext = name.split(".").pop()?.toLowerCase();

  if (mime.startsWith("video/") || ["mp4", "mkv", "avi", "mov", "webm"].includes(ext)) return "Video";
  if (mime === "application/pdf" || ext === "pdf") return "PDF";
  if (
    mime.includes("presentation") ||
    mime.includes("powerpoint") ||
    ["ppt", "pptx"].includes(ext)
  ) return "Presentasi";
  if (
    mime.includes("word") ||
    mime.includes("document") ||
    ["doc", "docx"].includes(ext)
  ) return "Dokumen";
  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "Gambar";
  return "Lainnya";
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function FileTypeIcon({ tipe }) {
  if (tipe === "Video") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white">
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
      </div>
    );
  }
  if (tipe === "Presentasi") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white">
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 3h16v12H4V3zm8 14l4 4H8l4-4z" /></svg>
      </div>
    );
  }
  if (tipe === "Gambar") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500 text-white">
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" /></svg>
      </div>
    );
  }
  // PDF / Dokumen / default
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-white">
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" /></svg>
    </div>
  );
}

export default function UploadMateri() {
  const { id } = useParams(); // URL assignment id
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const actualMapelId = location.state?.actualMapelId || id;
  const rombelId = location.state?.rombelId || null;

  const [form, setForm] = useState({ judul: "", deskripsi: "", youtube_url: "" });
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tipe = detectTipe(file);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setError("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.judul.trim()) { setError("Judul materi wajib diisi."); return; }
    if (!file) { setError("Pilih file materi terlebih dahulu."); return; }

    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("judul", form.judul);
      fd.append("deskripsi", form.deskripsi);
      fd.append("mapel_id", actualMapelId);
      fd.append("tipe", tipe);
      fd.append("files[]", file); // backend: $request->hasFile('files')
      if (form.youtube_url?.trim()) {
        fd.append("youtube_url", form.youtube_url.trim());
        fd.append("link_youtube", form.youtube_url.trim()); // Tambahan agar 100% cocok dengan backend
      }

      await createMateri(fd);
      navigate(`/kelas/${id}`, { state: { successMsg: "Materi berhasil diupload!" } });
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal mengupload materi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuruLayout title="Upload Materi">
      <div className="px-4 sm:px-6 lg:px-12 py-6 lg:py-12 max-w-4xl">
          {/* Page Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-slate-900">Unggah Materi</h1>
            <p className="mt-2 text-slate-500 text-[15px] leading-relaxed">
              Bagikan materi pembelajaran ke siswa di kelas pilihan Anda. Format yang didukung: PDF, Video, presentasi, dan dokumen teks.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Form Card */}
            <div className="rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-100 space-y-8">
              {/* Judul */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Judul Materi
                </label>
                <input
                  type="text"
                  value={form.judul}
                  onChange={(e) => setForm({ ...form, judul: e.target.value })}
                  placeholder="Contoh: Pengantar Aljabar Linear"
                  className="w-full rounded-2xl border-0 bg-blue-50/60 px-5 py-4 text-[15px] text-slate-700 placeholder-slate-400 outline-none transition focus:bg-blue-50 focus:ring-2 focus:ring-blue-300"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Deskripsi
                </label>
                <textarea
                  value={form.deskripsi}
                  onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                  placeholder="Berikan instruksi atau ringkasan singkat mengenai materi ini..."
                  rows={4}
                  className="w-full rounded-2xl border-0 bg-blue-50/60 px-5 py-4 text-[15px] text-slate-700 placeholder-slate-400 outline-none transition focus:bg-blue-50 focus:ring-2 focus:ring-blue-300 resize-none"
                />
              </div>

              {/* Link YouTube (opsional) */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Link Video YouTube
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-slate-400">Opsional</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </div>
                  <input
                    type="url"
                    value={form.youtube_url || ""}
                    onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full rounded-2xl border-0 bg-red-50/50 py-4 pl-12 pr-5 text-[15px] text-slate-700 placeholder-slate-400 outline-none transition focus:bg-red-50 focus:ring-2 focus:ring-red-200"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  File Materi
                </label>

                {/* Drop Zone */}
                {!file ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-16 text-center transition ${dragging
                      ? "border-blue-400 bg-blue-50"
                      : "border-slate-300 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                      }`}
                  >
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-500">
                      <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <p className="text-base font-semibold text-slate-700">Tarik &amp; Letakkan file di sini</p>
                    <p className="mt-1 text-sm text-slate-400">atau klik untuk menelusuri komputer Anda</p>
                    <div className="mt-5 flex gap-2">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">PDF (Max 50MB)</span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">MP4 (Max 500MB)</span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.mp4,.mkv,.avi,.mov,.webm,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files?.[0])}
                    />
                  </div>
                ) : (
                  /* File Preview */
                  <div className="flex items-center gap-5 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5">
                    <FileTypeIcon tipe={tipe} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{file.name}</p>
                      <p className="mt-0.5 text-sm text-slate-400">
                        {tipe} · {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.mp4,.mkv,.avi,.mov,.webm,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files?.[0])}
                    />
                  </div>
                )}
              </div>

              {error && (
                <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                  {error}
                </p>
              )}
            </div>

            {/* Footer Actions */}
            <div className="mt-6 flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate(`/kelas/${id}`)}
                className="rounded-2xl border border-slate-200 bg-white px-8 py-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-60 transition"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Mengunggah...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    Unggah Materi
                  </>
                )}
              </button>
            </div>
          </form>
      </div>
    </GuruLayout>
  );
}
