import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getMapel, deleteMapel, getCurrentUser, getMataPelajaranSiswa, importMapel } from "../services/authService";
import { toast, confirmDialog } from "../utils/notify";
import SiswaLayout from "../components/SiswaLayout";
import { getErrorMessage } from "../utils/translateError";

const PER_PAGE = 2; // Grouping pagination

export default function MataPelajaran() {
  const navigate = useNavigate();
  const [mapel, setMapel] = useState([]);
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [isSiswa, setIsSiswa] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  // ── Import Modal State ─────────────────────────────────────────────
  const [importModal, setImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const importFileRef = useRef(null);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const resUser = await getCurrentUser();
        const userData = resUser.data?.data || resUser.data;
        setCurrentUser(userData);
        const fetchedRole = userData?.role || (Array.isArray(userData?.roles) ? userData.roles[0] : null);
        const role = (fetchedRole || localStorage.getItem("user_role") || "guru").toLowerCase();
        if (role === "siswa" || role === "murid") {
          setIsSiswa(true);
        } else {
          fetchMapel();
        }
      } catch (err) {
        console.error("Gagal cek user", err);
        // Fallback ke fetchMapel kalau gagal
        fetchMapel();
      } finally {
        setCheckingRole(false);
      }
    };
    checkRole();
  }, []);

  const fetchMapel = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMapel();
      const data = res.data?.data || res.data || [];

      // Normalisasi field guru dari setiap mapel langsung dari respons API
      const mapelWithGurus = data.map((m) => {
        const guruRaw = m.guru || m.gurus;
        if (!guruRaw) return { ...m, gurus: [] };
        const gurusArr = Array.isArray(guruRaw) ? guruRaw : [guruRaw];
        return { ...m, gurus: gurusArr };
      });

      setMapel(mapelWithGurus);
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat data mata pelajaran"));
    } finally {
      setLoading(false);
    }
  };

  const grouped = useMemo(() => {
    const map = {};
    mapel.forEach((m) => {
      // Grouping berdasarkan jurusan
      const groupName = (m.nama_jurusan || "Tanpa Jurusan").toUpperCase();
      if (!map[groupName]) map[groupName] = [];
      map[groupName].push(m);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [mapel]);

  const totalPages = Math.max(1, Math.ceil(grouped.length / PER_PAGE));
  const pagedGroups = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return grouped.slice(start, start + PER_PAGE);
  }, [grouped, page]);

  const confirmDelete = (item) => setDeleteModal({ open: true, item });
  const cancelDelete = () => setDeleteModal({ open: false, item: null });

  const handleDelete = async () => {
    if (!deleteModal.item) return;
    setDeleting(true);
    try {
      await deleteMapel(deleteModal.item.id);
      setMapel((prev) => prev.filter((m) => m.id !== deleteModal.item.id));
      cancelDelete();
    } catch (err) {
      toast(err?.response?.data?.message || "Gagal menghapus mata pelajaran", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ── Import Handlers ────────────────────────────────────────────────
  const openImportModal = () => {
    setImportModal(true);
    setImportFile(null);
    setImportResult(null);
  };

  const closeImportModal = () => {
    setImportModal(false);
    setImportFile(null);
    setImportResult(null);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setImportFile(file);
  };

  const handleImport = async () => {
    if (!importFile) {
      toast("Pilih file Excel/CSV terlebih dahulu!", "warning");
      return;
    }
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    const ext = importFile.name.split(".").pop().toLowerCase();
    if (!allowedTypes.includes(importFile.type) && !["xlsx", "xls", "csv"].includes(ext)) {
      toast("Format file tidak valid. Gunakan Excel (.xlsx/.xls) atau CSV.", "error");
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const res = await importMapel(importFile);
      const result = res.data;
      setImportResult(result);
      if (result?.success_count > 0) {
        toast(`${result.success_count} mata pelajaran berhasil diimpor!`, "success");
        fetchMapel();
      } else {
        toast("Tidak ada data yang berhasil diimpor.", "warning");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Gagal mengimpor file.";
      toast(msg, "error");
      if (err?.response?.data) setImportResult(err.response.data);
    } finally {
      setImporting(false);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }

    return (
      <div className="mt-8 mb-8 flex items-center justify-center gap-1 rounded-2xl bg-white py-2 px-4 shadow-sm w-fit mx-auto border border-slate-100">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dot-${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition ${p === page
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  };

  if (checkingRole) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-slate-500">
          <svg className="animate-spin mx-auto h-8 w-8 text-blue-600 mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm font-medium">Memuat...</p>
        </div>
      </main>
    );
  }

  if (isSiswa) {
    return <SiswaMataPelajaran user={currentUser} />;
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <div className="lg:ml-64 px-4 sm:px-6 lg:px-10 pt-12 lg:pt-12 pb-24 lg:pb-12">
        {/* Header */}
        <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-blue-600 uppercase tracking-wide">Kelola Mata Pelajaran</h1>
            <p className="mt-1 text-sm font-medium text-slate-400">Manajemen mata pelajaran</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Import Button */}
            <button
              onClick={openImportModal}
              className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 hover:shadow-md"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              IMPORT EXCEL / CSV
            </button>

            {/* Tambah Button */}
            <button
              onClick={() => navigate("/tambah-mata-pelajaran")}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 hover:shadow-lg"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              TAMBAH MATA PELAJARAN
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-16">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <p className="text-sm font-medium text-slate-500">Memuat data mata pelajaran…</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
            <p className="font-semibold text-rose-700">{error}</p>
            <button
              onClick={fetchMapel}
              className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Coba Lagi
            </button>
          </div>
        ) : pagedGroups.map(([groupName, items]) => {
          // Choose color based on Jurusan for the left border indicator
          let indicatorColor = "bg-orange-400";
          if (groupName.includes("MANAJEMEN")) indicatorColor = "bg-blue-600";
          if (groupName.includes("PEMASARAN")) indicatorColor = "bg-emerald-500";
          if (groupName.includes("XII")) indicatorColor = "bg-emerald-600";

          return (
            <div key={groupName} className="mb-8">
              {/* Group Header */}
              {groupName !== "TANPA JURUSAN" && (
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-6 w-1.5 rounded-full ${indicatorColor}`} />
                    <h3 className="text-lg font-bold text-slate-800 uppercase">{groupName}</h3>
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-4 pl-8 pr-4 text-xs font-bold uppercase tracking-wider text-slate-400">Mata Pelajaran & Rombel</th>
                      <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Kode Mapel</th>
                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Guru</th>
                      <th className="px-4 py-4 pr-8 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map((item) => (
                      <tr key={item.id} className="transition hover:bg-slate-50/50">
                        <td className="py-4 pl-8 pr-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-sm font-semibold text-slate-700">{item.nama_mapel}</span>
                            {item.rombels && item.rombels.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.rombels.map((r, idx) => (
                                  <span key={idx} className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                                    {r.nama_rombel || r.nama}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                            {item.kode_mapel}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-left text-sm font-semibold text-slate-600">
                          {item.gurus && item.gurus.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.gurus.map((g, idx) => (
                                <span key={idx} className="text-sm font-medium text-slate-700">
                                  {typeof g === 'string' ? g : (g.nama_lengkap || g.nama || g.name || "")}
                                  {idx < item.gurus.length - 1 && <span className="text-slate-400">, </span>}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 pr-8">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => navigate(`/edit-mata-pelajaran/${item.id}`)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-500 transition hover:bg-blue-50 hover:text-blue-700"
                              title="Edit"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => confirmDelete(item)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                              title="Hapus"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {!loading && !error && grouped.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
            Tidak ada mata pelajaran ditemukan.
          </div>
        )}

        {renderPagination()}
      </div>

      {/* Delete confirmation modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm animate-[fadeIn_0.2s_ease] rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
              <svg className="h-6 w-6 text-rose-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Hapus Mata Pelajaran?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Yakin ingin menghapus <span className="font-semibold text-slate-700">{deleteModal.item?.nama}</span>? Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Import Modal ─────────────────────────────────────────────── */}
      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg animate-[fadeIn_0.2s_ease] rounded-3xl bg-white shadow-2xl overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                  <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Import Mata Pelajaran</h3>
                  <p className="text-xs text-slate-400">Format: Excel (.xlsx / .xls) atau CSV</p>
                </div>
              </div>
              <button onClick={closeImportModal} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-8 py-6 space-y-5">

              {/* Column Guide */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kolom yang Diperlukan</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { col: "A", name: "kode_mapel", req: true },
                    { col: "B", name: "nama_mapel", req: true },
                    { col: "C", name: "deskripsi", req: false },
                    { col: "D", name: "guru_ids", req: false },
                    { col: "E", name: "rombel_ids", req: false },
                  ].map(({ col, name, req }) => (
                    <div key={col} className="flex items-center gap-2 text-xs">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-200 font-bold text-slate-600">{col}</span>
                      <code className="text-slate-700 font-medium">{name}</code>
                      {req
                        ? <span className="ml-auto text-rose-500 font-semibold">wajib</span>
                        : <span className="ml-auto text-slate-400">opsional</span>}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-slate-400">Baris pertama adalah header. <code>guru_ids</code> &amp; <code>rombel_ids</code> diisi ID dipisah koma (contoh: <code>1,2,3</code>).</p>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => importFileRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition ${
                  dragOver ? "border-emerald-400 bg-emerald-50" : "border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50"
                }`}
              >
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                  className="hidden"
                  onChange={(e) => setImportFile(e.target.files[0] || null)}
                />
                {importFile ? (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                      <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-800">{importFile.name}</p>
                      <p className="text-xs text-slate-400">{(importFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setImportFile(null); }}
                      className="text-xs text-rose-500 hover:underline"
                    >
                      Ganti file
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200">
                      <svg className="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-700">Klik atau seret file ke sini</p>
                      <p className="text-xs text-slate-400">.xlsx, .xls, atau .csv</p>
                    </div>
                  </>
                )}
              </div>

              {/* Import Result */}
              {importResult && (
                <div className={`rounded-xl border p-4 text-sm ${
                  importResult.success_count > 0
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-rose-200 bg-rose-50"
                }`}>
                  <p className="font-bold text-slate-700 mb-2">Hasil Import</p>
                  {importResult.success_count !== undefined && (
                    <p className="text-emerald-700">
                      ✅ {importResult.success_count} baris berhasil diimpor
                    </p>
                  )}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-rose-600 font-semibold mb-1">❌ {importResult.errors.length} baris gagal:</p>
                      <ul className="max-h-28 overflow-y-auto space-y-1">
                        {importResult.errors.map((err, i) => (
                          <li key={i} className="text-xs text-rose-700 bg-rose-100 rounded-lg px-3 py-1.5">
                            {typeof err === "string" ? err : (err.message || err.error || JSON.stringify(err))}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {importResult.message && !importResult.errors && (
                    <p className="text-rose-700">{importResult.message}</p>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-slate-100 bg-slate-50">
              <button
                onClick={closeImportModal}
                disabled={importing}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 rounded-xl border border-slate-200 bg-white transition hover:bg-slate-100 disabled:opacity-50"
              >
                Tutup
              </button>
              <button
                onClick={handleImport}
                disabled={importing || !importFile}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Mengimpor...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    Import Sekarang
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SiswaMataPelajaran({ user }) {
  const navigate = useNavigate();
  const [mapelList, setMapelList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSiswaMapel = async () => {
      try {
        const res = await getMataPelajaranSiswa();
        const data = res.data?.data || res.data || [];
        setMapelList(data);
      } catch (err) {
        console.error("Gagal memuat mata pelajaran siswa:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSiswaMapel();
  }, []);

  return (
    <SiswaLayout title="Kelas Saya">
      <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">Mata Pelajaran</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">Daftar mata pelajaran yang Anda ikuti semester ini</p>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="flex justify-center p-12">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl">
            {mapelList.length > 0 ? (
              mapelList.map((m, idx) => {
                const mapelName = m.nama_mapel || "Mata Pelajaran";
                const guruName = typeof m.guru === "string" ? m.guru : (m.guru?.nama || "Guru Pengajar");
                const kelasName = typeof m.kelas === "string" ? m.kelas : (m.kelas?.nama_kelas || "Kelas");

                return (
                  <div key={m.id || idx} className="rounded-[20px] bg-white p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:shadow-md">
                    <div className="flex items-start gap-4">
                      <div>
                        <div className="text-[13px] font-semibold text-[#64748B] mb-0.5">{kelasName}</div>
                        <h2 className="text-[17px] font-bold text-[#0F172A] leading-snug">{mapelName}</h2>
                        <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#64748B] mt-1.5">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                          {guruName}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/ruang-belajar/${m.id || m.kelas_id}`)}
                      className="shrink-0 flex items-center gap-2 rounded-lg bg-[#0B57D0] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 self-end sm:self-auto"
                    >
                      Masuk ke Mapel
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
                <svg className="mx-auto h-12 w-12 text-slate-300 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                </svg>
                <p className="font-semibold text-slate-500">Belum ada mata pelajaran</p>
                <p className="mt-1 text-sm text-slate-400">Anda belum terdaftar di kelas manapun.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </SiswaLayout>
  );
}
