import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import GuruLayout from "../components/GuruLayout";
import { createRpp, getMapel } from "../services/authService";
import { getErrorMessage } from "../utils/translateError";

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileChip({ file, onRemove }) {
  const ext = file.name?.split(".").pop() || "";
  const colorMap = {
    pdf: "bg-red-50 text-red-500 border-red-200",
    docx: "bg-blue-50 text-blue-500 border-blue-200",
    doc: "bg-blue-50 text-blue-500 border-blue-200",
    pptx: "bg-orange-50 text-orange-500 border-orange-200",
    ppt: "bg-orange-50 text-orange-500 border-orange-200",
    xlsx: "bg-green-50 text-green-500 border-green-200",
    xls: "bg-green-50 text-green-500 border-green-200",
  };
  const color = colorMap[ext.toLowerCase()] || "bg-slate-50 text-slate-500 border-slate-200";
  return (
    <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 ${color}`}>
      <span className="text-[10px] font-bold uppercase">{ext || "file"}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate max-w-[150px]">{file.name}</p>
        <p className="text-[10px] opacity-60">{formatFileSize(file.size)}</p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(file.name)}
        className="opacity-60 hover:opacity-100 transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function BuatRPP() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    judul: "",
    deskripsi: "",
    semester: "",
    tahun_ajaran: "",
    kelas: "",
    mapel_id: "",
  });
  const [files, setFiles] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMapel, setLoadingMapel] = useState(true);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // Ambil daftar mapel yang diampu guru
  useEffect(() => {
    const fetchMapel = async () => {
      try {
        const res = await getMapel();
        setMapelList(res.data?.data || res.data || []);
      } catch {
        // abaikan, form tetap bisa diisi manual
      } finally {
        setLoadingMapel(false);
      }
    };
    fetchMapel();
  }, []);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const addFiles = (newFiles) => {
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...newFiles.filter((f) => !names.has(f.name))];
    });
  };

  const removeFile = (name) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.judul.trim()) { setError("Judul RPP wajib diisi."); return; }
    if (!form.mapel_id) { setError("Mata pelajaran wajib dipilih."); return; }
    if (!form.semester) { setError("Semester wajib diisi."); return; }

    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("judul", form.judul);
      fd.append("deskripsi", form.deskripsi);
      fd.append("semester", form.semester);
      fd.append("tahun_ajaran", form.tahun_ajaran);
      fd.append("kelas", form.kelas);
      fd.append("mapel_id", form.mapel_id);
      files.forEach((f) => fd.append("files[]", f));

      await createRpp(fd);
      navigate("/rpp", { state: { successMsg: "RPP berhasil dibuat!" } });
    } catch (err) {
      setError(getErrorMessage(err, "Gagal membuat RPP."));
    } finally {
      setLoading(false);
    }
  };

  const SEMESTER_OPTIONS = ["1", "2"];
  const currentYear = new Date().getFullYear();
  const TAHUN_OPTIONS = [
    `${currentYear - 1}/${currentYear}`,
    `${currentYear}/${currentYear + 1}`,
    `${currentYear + 1}/${currentYear + 2}`,
  ];

  return (
    <GuruLayout title="Buat RPP">
      <div className="px-4 sm:px-6 lg:px-12 py-6 lg:py-10 max-w-3xl">

        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate("/rpp")}
          className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Daftar RPP
        </button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Buat RPP Baru</h1>
          <p className="mt-2 text-slate-500 text-sm leading-relaxed">
            Isi form di bawah dan lampirkan file RPP (PDF, DOCX, dll).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Card Informasi Utama ──────────────────────────── */}
          <div className="rounded-2xl bg-white p-5 sm:p-8 shadow-sm ring-1 ring-slate-100 space-y-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-500">Informasi RPP</p>

            {/* Judul */}
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Judul RPP <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.judul}
                onChange={(e) => setForm({ ...form, judul: e.target.value })}
                placeholder="Contoh: RPP Sistem Komputer Kelas X Semester 1"
                className="w-full rounded-xl border-0 bg-[#E8F0FE] px-4 py-3 text-[15px] text-slate-700 placeholder-slate-400 outline-none transition focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* Mata Pelajaran */}
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Mata Pelajaran <span className="text-red-400">*</span>
              </label>
              {loadingMapel ? (
                <div className="h-12 rounded-xl bg-slate-100 animate-pulse" />
              ) : (
                <select
                  value={form.mapel_id}
                  onChange={(e) => setForm({ ...form, mapel_id: e.target.value })}
                  className="w-full rounded-xl border-0 bg-[#E8F0FE] px-4 py-3 text-[15px] text-slate-700 outline-none transition focus:ring-2 focus:ring-blue-300"
                >
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  {mapelList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama_mapel || m.nama}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Semester + Tahun Ajaran */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Semester <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                  className="w-full rounded-xl border-0 bg-[#E8F0FE] px-4 py-3 text-[15px] text-slate-700 outline-none transition focus:ring-2 focus:ring-blue-300"
                >
                  <option value="">-- Pilih Semester --</option>
                  {SEMESTER_OPTIONS.map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Tahun Ajaran
                </label>
                <select
                  value={form.tahun_ajaran}
                  onChange={(e) => setForm({ ...form, tahun_ajaran: e.target.value })}
                  className="w-full rounded-xl border-0 bg-[#E8F0FE] px-4 py-3 text-[15px] text-slate-700 outline-none transition focus:ring-2 focus:ring-blue-300"
                >
                  <option value="">-- Pilih Tahun --</option>
                  {TAHUN_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Kelas */}
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Kelas (Opsional)
              </label>
              <input
                type="text"
                value={form.kelas}
                onChange={(e) => setForm({ ...form, kelas: e.target.value })}
                placeholder="Contoh: X TKJ 1, XI RPL 2"
                className="w-full rounded-xl border-0 bg-[#E8F0FE] px-4 py-3 text-[15px] text-slate-700 placeholder-slate-400 outline-none transition focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* Deskripsi */}
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Deskripsi / Tujuan Pembelajaran
              </label>
              <textarea
                value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                placeholder="Tuliskan tujuan pembelajaran, kompetensi dasar, dll..."
                rows={5}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-700 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none"
              />
            </div>
          </div>

          {/* ── Card Upload File ────────────────────────────────── */}
          <div className="rounded-2xl bg-white p-5 sm:p-8 shadow-sm ring-1 ring-slate-100 space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-500">Lampiran File</p>
            <p className="text-xs text-slate-400">Upload satu atau lebih file RPP (PDF, DOCX, PPTX, XLSX, dll). Maks. 10MB per file.</p>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragOver ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
              }`}
            >
              <svg className={`mx-auto h-12 w-12 mb-3 transition ${dragOver ? "text-blue-400" : "text-slate-300"}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm font-semibold text-slate-500">
                {dragOver ? "Lepaskan file di sini" : "Seret & lepas file, atau klik untuk memilih"}
              </p>
              <p className="text-xs text-slate-400 mt-1">PDF, DOCX, PPTX, XLSX, dll</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.odp,.ods"
                onChange={(e) => addFiles(Array.from(e.target.files))}
              />
            </div>

            {/* File chips */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((f) => (
                  <FileChip key={f.name} file={f} onRemove={removeFile} />
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 border border-rose-200">
              {error}
            </p>
          )}

          {/* ── Action Buttons ──────────────────────────────────── */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/rpp")}
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
              ) : "Simpan RPP"}
            </button>
          </div>
        </form>
      </div>
    </GuruLayout>
  );
}
