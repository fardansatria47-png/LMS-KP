import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GuruLayout from "../components/GuruLayout";
import { getRppById, updateRpp, deleteRppFile, getMapel } from "../services/authService";
import { getErrorMessage } from "../utils/translateError";
import { fixFileUrl } from "../api/api";
import { confirmDialog } from "../utils/notify";

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Chip file baru (akan diupload)
function NewFileChip({ file, onRemove }) {
  const ext = file.name?.split(".").pop() || "";
  return (
    <div className="flex items-center gap-2 border border-blue-200 bg-blue-50 text-blue-600 rounded-xl px-3 py-2">
      <span className="text-[10px] font-bold uppercase">{ext}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate max-w-[150px]">{file.name}</p>
        <p className="text-[10px] opacity-60">{formatFileSize(file.size)}</p>
      </div>
      <button type="button" onClick={() => onRemove(file.name)} className="opacity-60 hover:opacity-100 transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// Chip file yang sudah ada di server
function ExistingFileChip({ file, onDelete }) {
  const ext = file.nama_file?.split(".").pop() || "";
  const colorMap = {
    pdf: "bg-red-50 text-red-500 border-red-200",
    docx: "bg-blue-50 text-blue-600 border-blue-200",
    doc: "bg-blue-50 text-blue-600 border-blue-200",
    pptx: "bg-orange-50 text-orange-500 border-orange-200",
    ppt: "bg-orange-50 text-orange-500 border-orange-200",
    xlsx: "bg-green-50 text-green-600 border-green-200",
    xls: "bg-green-50 text-green-600 border-green-200",
  };
  const color = colorMap[ext.toLowerCase()] || "bg-slate-50 text-slate-500 border-slate-200";
  return (
    <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 ${color}`}>
      <span className="text-[10px] font-bold uppercase">{ext}</span>
      <a
        href={fixFileUrl(file.path)}
        target="_blank"
        rel="noreferrer"
        className="flex-1 min-w-0 hover:underline"
      >
        <p className="text-xs font-semibold truncate max-w-[150px]">{file.nama_file}</p>
      </a>
      <button type="button" onClick={() => onDelete(file)} className="opacity-60 hover:opacity-100 text-red-500 transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      </button>
    </div>
  );
}

export default function EditRPP() {
  const { id } = useParams();
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
  const [existingFiles, setExistingFiles] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rppRes, mapelRes] = await Promise.all([
          getRppById(id),
          getMapel(),
        ]);
        const rpp = rppRes.data?.data || rppRes.data;
        setForm({
          judul: rpp.judul || "",
          deskripsi: rpp.deskripsi || "",
          semester: rpp.semester?.toString() || "",
          tahun_ajaran: rpp.tahun_ajaran || "",
          kelas: rpp.kelas || "",
          mapel_id: rpp.mapel_id?.toString() || rpp.mata_pelajaran?.id?.toString() || "",
        });
        setExistingFiles(rpp.files || []);
        setMapelList(mapelRes.data?.data || mapelRes.data || []);
      } catch (err) {
        setError(getErrorMessage(err, "Gagal memuat data RPP."));
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [id]);

  const addFiles = (newF) => {
    setNewFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...newF.filter((f) => !names.has(f.name))];
    });
  };

  const removeNewFile = (name) => setNewFiles((prev) => prev.filter((f) => f.name !== name));

  const handleDeleteExisting = async (file) => {
    const ok = await confirmDialog(
      `Hapus file "${file.nama_file}" dari lampiran RPP ini?`,
      { isDanger: true, title: "Hapus File" }
    );
    if (!ok) return;
    try {
      await deleteRppFile(file.id);
      setExistingFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (err) {
      alert(getErrorMessage(err, "Gagal menghapus file."));
    }
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
      newFiles.forEach((f) => fd.append("files[]", f));

      await updateRpp(id, fd);
      navigate("/rpp", { state: { successMsg: "RPP berhasil diperbarui!" } });
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memperbarui RPP."));
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

  if (loadingData) {
    return (
      <GuruLayout title="Edit RPP">
        <div className="flex items-center justify-center min-h-screen">
          <svg className="h-8 w-8 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </GuruLayout>
    );
  }

  return (
    <GuruLayout title="Edit RPP">
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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Edit RPP</h1>
          <p className="mt-2 text-slate-500 text-sm leading-relaxed">
            Perbarui informasi RPP. Anda juga dapat menambah atau menghapus file lampiran.
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
              <select
                value={form.mapel_id}
                onChange={(e) => setForm({ ...form, mapel_id: e.target.value })}
                className="w-full rounded-xl border-0 bg-[#E8F0FE] px-4 py-3 text-[15px] text-slate-700 outline-none transition focus:ring-2 focus:ring-blue-300"
              >
                <option value="">-- Pilih Mata Pelajaran --</option>
                {mapelList.map((m) => (
                  <option key={m.id} value={m.id.toString()}>
                    {m.nama_mapel || m.nama}
                  </option>
                ))}
              </select>
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

          {/* ── Card File Lampiran ──────────────────────────────── */}
          <div className="rounded-2xl bg-white p-5 sm:p-8 shadow-sm ring-1 ring-slate-100 space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-500">Lampiran File</p>

            {/* Existing files */}
            {existingFiles.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-2">File yang sudah ada:</p>
                <div className="flex flex-wrap gap-2">
                  {existingFiles.map((f) => (
                    <ExistingFileChip key={f.id} file={f} onDelete={handleDeleteExisting} />
                  ))}
                </div>
              </div>
            )}

            {/* Upload drop zone */}
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-2">Tambah file baru:</p>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(Array.from(e.dataTransfer.files)); }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  dragOver ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                }`}
              >
                <svg className={`mx-auto h-10 w-10 mb-2 transition ${dragOver ? "text-blue-400" : "text-slate-300"}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-sm font-semibold text-slate-500">Seret & lepas atau klik untuk memilih file</p>
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

              {newFiles.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {newFiles.map((f) => (
                    <NewFileChip key={f.name} file={f} onRemove={removeNewFile} />
                  ))}
                </div>
              )}
            </div>
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
              ) : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </GuruLayout>
  );
}
