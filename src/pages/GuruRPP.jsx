import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import GuruLayout from "../components/GuruLayout";
import { getRpp, deleteRpp } from "../services/authService";
import { confirmDialog } from "../utils/notify";
import { getErrorMessage } from "../utils/translateError";
import { fixFileUrl } from "../api/api";

// ── Ikon Dokumen ──────────────────────────────────────────────────────────────
function DocIcon({ ext }) {
  const ext_ = (ext || "").toLowerCase();
  const colorMap = {
    pdf: "bg-red-50 text-red-500",
    docx: "bg-blue-50 text-blue-500",
    doc: "bg-blue-50 text-blue-500",
    pptx: "bg-orange-50 text-orange-500",
    ppt: "bg-orange-50 text-orange-500",
    xlsx: "bg-green-50 text-green-500",
    xls: "bg-green-50 text-green-500",
  };
  const color = colorMap[ext_] || "bg-slate-100 text-slate-500";
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-[10px] font-bold uppercase ${color}`}>
      {ext_ || "—"}
    </span>
  );
}

// ── Kartu RPP ─────────────────────────────────────────────────────────────────
function RppCard({ rpp, onEdit, onDelete, onView }) {
  const files = rpp.files || [];
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow overflow-hidden">
      {/* Header berwarna */}
      <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />

      <div className="p-5">
        {/* Badge mapel + semester */}
        <div className="flex flex-wrap gap-2 mb-3">
          {rpp.mata_pelajaran?.nama_mapel && (
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              {rpp.mata_pelajaran.nama_mapel}
            </span>
          )}
          {rpp.semester && (
            <span className="bg-slate-100 text-slate-600 text-[11px] font-semibold px-2.5 py-1 rounded-full">
              Semester {rpp.semester}
            </span>
          )}
          {rpp.tahun_ajaran && (
            <span className="bg-slate-100 text-slate-600 text-[11px] font-semibold px-2.5 py-1 rounded-full">
              {rpp.tahun_ajaran}
            </span>
          )}
        </div>

        {/* Judul */}
        <h3 className="font-bold text-slate-800 text-[15px] leading-snug line-clamp-2 mb-2">
          {rpp.judul}
        </h3>

        {/* Deskripsi */}
        {rpp.deskripsi && (
          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-4">
            {rpp.deskripsi}
          </p>
        )}

        {/* File attachments preview */}
        {files.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {files.slice(0, 3).map((f, i) => {
              const ext = f.nama_file?.split(".").pop() || "";
              return (
                <a
                  key={i}
                  href={fixFileUrl(f.path)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg px-2.5 py-1 transition"
                  title={f.nama_file}
                >
                  <DocIcon ext={ext} />
                  <span className="text-[11px] text-slate-600 font-medium max-w-[100px] truncate">
                    {f.nama_file}
                  </span>
                </a>
              );
            })}
            {files.length > 3 && (
              <span className="flex items-center bg-slate-100 rounded-lg px-2.5 py-1 text-[11px] text-slate-500 font-medium">
                +{files.length - 3} lainnya
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={() => onView(rpp)}
            className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-slate-600 hover:text-blue-600 py-2 rounded-xl hover:bg-blue-50 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Detail
          </button>
          <button
            onClick={() => onEdit(rpp.id)}
            className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-blue-600 hover:text-blue-800 py-2 rounded-xl hover:bg-blue-50 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
            </svg>
            Edit
          </button>
          <button
            onClick={() => onDelete(rpp)}
            className="flex items-center justify-center gap-1.5 text-[12px] font-semibold text-red-400 hover:text-red-600 py-2 px-3 rounded-xl hover:bg-red-50 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Detail RPP ──────────────────────────────────────────────────────────
function RppDetailModal({ rpp, onClose }) {
  if (!rpp) return null;
  const files = rpp.files || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-start justify-between rounded-t-2xl">
          <div>
            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">Detail RPP</p>
            <h2 className="font-bold text-slate-800 text-lg leading-snug pr-6">{rpp.judul}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition mt-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Mata Pelajaran", value: rpp.mata_pelajaran?.nama_mapel || "—" },
              { label: "Semester", value: rpp.semester || "—" },
              { label: "Tahun Ajaran", value: rpp.tahun_ajaran || "—" },
              { label: "Kelas", value: rpp.kelas || "—" },
            ].map((item) => (
              <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{item.label}</p>
                <p className="text-sm font-semibold text-slate-700">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Deskripsi / Tujuan */}
          {rpp.deskripsi && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Deskripsi / Tujuan Pembelajaran</p>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 rounded-xl p-4">
                {rpp.deskripsi}
              </p>
            </div>
          )}

          {/* File Lampiran */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              File Lampiran ({files.length})
            </p>
            {files.length > 0 ? (
              <div className="space-y-2">
                {files.map((f, i) => {
                  const ext = f.nama_file?.split(".").pop() || "";
                  return (
                    <a
                      key={i}
                      href={fixFileUrl(f.path)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition group"
                    >
                      <DocIcon ext={ext} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-700 truncate">{f.nama_file}</p>
                        {f.size && (
                          <p className="text-[11px] text-slate-400">{(f.size / 1024).toFixed(1)} KB</p>
                        )}
                      </div>
                      <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 rounded-xl bg-slate-50 text-slate-400 text-sm">
                Tidak ada file lampiran.
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-700 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Halaman Utama GuruRPP ─────────────────────────────────────────────────────
export default function GuruRPP() {
  const navigate = useNavigate();
  const [rppList, setRppList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedRpp, setSelectedRpp] = useState(null);

  const fetchRpp = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getRpp();
      setRppList(res.data?.data || res.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat daftar RPP."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRpp();
  }, [fetchRpp]);

  const handleDelete = async (rpp) => {
    const ok = await confirmDialog(
      `Hapus RPP "${rpp.judul}"? Semua file lampiran juga akan dihapus.`,
      { isDanger: true, title: "Hapus RPP" }
    );
    if (!ok) return;
    try {
      await deleteRpp(rpp.id);
      setRppList((prev) => prev.filter((r) => r.id !== rpp.id));
    } catch (err) {
      alert(getErrorMessage(err, "Gagal menghapus RPP."));
    }
  };

  const filtered = rppList.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.judul?.toLowerCase().includes(q) ||
      r.mata_pelajaran?.nama_mapel?.toLowerCase().includes(q) ||
      r.semester?.toString().includes(q) ||
      r.tahun_ajaran?.toLowerCase().includes(q)
    );
  });

  return (
    <GuruLayout title="RPP">
      <div className="px-4 sm:px-6 lg:px-12 py-6 lg:py-10 min-h-screen bg-[#F0F4FF]">

        {/* ── Page Header ────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Rencana Pelaksanaan Pembelajaran</h1>
            <p className="mt-1 text-slate-500 text-sm">Kelola dokumen RPP Anda dengan mudah</p>
          </div>
          <button
            onClick={() => navigate("/rpp/buat")}
            className="flex items-center gap-2 bg-[#0B57D0] hover:bg-blue-800 text-white font-bold px-5 py-3 rounded-xl shadow-sm transition text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Buat RPP Baru
          </button>
        </div>

        {/* ── Search Bar ────────────────────────────────────────── */}
        <div className="mb-6 relative">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul, mata pelajaran, semester..."
            className="w-full sm:max-w-md rounded-xl border-0 bg-white shadow-sm pl-12 pr-4 py-3 text-sm text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-300 transition"
          />
        </div>

        {/* ── Content ───────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-3">
              <svg className="h-8 w-8 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-slate-500 text-sm">Memuat data RPP...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center">
            <p className="text-red-600 font-semibold">{error}</p>
            <button
              onClick={fetchRpp}
              className="mt-3 text-sm font-bold text-red-600 underline"
            >
              Coba lagi
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white py-20 text-center">
            <svg className="mx-auto h-16 w-16 text-slate-200 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-slate-400 font-semibold text-base mb-1">
              {search ? "RPP tidak ditemukan" : "Belum ada RPP"}
            </p>
            <p className="text-slate-400 text-sm mb-5">
              {search ? "Coba ubah kata kunci pencarian." : "Mulai dengan membuat RPP pertama Anda."}
            </p>
            {!search && (
              <button
                onClick={() => navigate("/rpp/buat")}
                className="inline-flex items-center gap-2 bg-[#0B57D0] text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-800 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Buat RPP Sekarang
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400 font-semibold mb-4">{filtered.length} RPP ditemukan</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((rpp) => (
                <RppCard
                  key={rpp.id}
                  rpp={rpp}
                  onView={setSelectedRpp}
                  onEdit={(id) => navigate(`/rpp/edit/${id}`)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal Detail */}
      {selectedRpp && (
        <RppDetailModal rpp={selectedRpp} onClose={() => setSelectedRpp(null)} />
      )}
    </GuruLayout>
  );
}
