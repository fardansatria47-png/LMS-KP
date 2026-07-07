import { useState, useEffect } from "react";
import { getRpp, createRpp, updateRpp, deleteRpp, deleteRppFile, getKelasGuru } from "../services/authService";
import { fixFileUrl } from "../api/api";
import GuruLayout from "../components/GuruLayout";
import { toast } from "../utils/notify";

export default function GuruRPP() {
  const [rppList, setRppList] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deleteRppConfirm, setDeleteRppConfirm] = useState(null);
  const [rppDetailModal, setRppDetailModal] = useState(null);
  
  // Modal buat/edit RPP
  const [rppFormModal, setRppFormModal] = useState(null);
  const [rppFormLoading, setRppFormLoading] = useState(false);
  const [rppFormError, setRppFormError] = useState("");
  const [rppForm, setRppForm] = useState({
    judul: "",
    deskripsi: "",
    kelas: "",
    mapel_id: "",
    rombel_id: "",
    is_published: false,
    pertemuans: [],
  });
  const [rppNewFiles, setRppNewFiles] = useState([]);
  const [rppExistingFiles, setRppExistingFiles] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [resRpp, resMapel] = await Promise.allSettled([
        getRpp(),
        getKelasGuru()
      ]);

      if (resRpp.status === "fulfilled") {
        setRppList(resRpp.value.data?.data || resRpp.value.data || []);
      } else {
        console.error("Gagal getRpp:", resRpp.reason);
        setError("Gagal memuat daftar RPP.");
      }

      if (resMapel.status === "fulfilled") {
        const rawMapel = resMapel.value.data?.data || resMapel.value.data || [];
        const mapelArr = Array.isArray(rawMapel) ? rawMapel : [];
        console.log("Data Kelas Guru:", mapelArr); // Debugging
        
        setMapelList(mapelArr.map(m => {
          const kelasName = m.nama_kelas || m.tingkat || "";
          const jurusanName = m.jurusan?.nama_jurusan || m.nama_jurusan || "";
          const rombel = `${kelasName} ${jurusanName}`.trim();
          // Fallback to mapel_id if m.id is pivot id
          const id = m.mapel_id || m.mata_pelajaran_id || m.id;
          const rombelId = m.rombel_id || m.kelas_id || m.rombel?.id || null;
          return {
            id: id,
            rombel_id: rombelId,
            nama: `${m.nama_mapel || m.nama || m.mata_pelajaran?.nama_mapel || "Mata Pelajaran"}${rombel ? ` - Kelas ${rombel}` : ""}`,
            kelasAsli: rombel
          };
        }));
      } else {
        console.error("Gagal getKelasGuru:", resMapel.reason);
      }
    } catch (err) {
      setError("Gagal memuat data RPP.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRpp = async () => {
    if (!deleteRppConfirm) return;
    try {
      await deleteRpp(deleteRppConfirm.id);
      setRppList(prev => prev.filter(r => r.id !== deleteRppConfirm.id));
      setDeleteRppConfirm(null);
      toast("RPP berhasil dihapus", "success");
    } catch {
      toast("Gagal menghapus RPP", "error");
    }
  };

  return (
    <GuruLayout title="Rencana Pelaksanaan Pembelajaran (RPP)">
      <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Daftar RPP</h1>
            <p className="text-sm text-slate-500 mt-1">Kelola rencana pelaksanaan pembelajaran untuk kelas Anda.</p>
          </div>
          <button
            onClick={() => {
              setRppForm({
                judul: "",
                deskripsi: "",
                kelas: "",
                mapel_id: mapelList[0]?.id || "",
                is_published: false,
                pertemuans: [],
              });
              setRppNewFiles([]);
              setRppExistingFiles([]);
              setRppFormError("");
              setRppFormModal({ mode: "buat" });
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition self-start sm:self-auto"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Buat RPP Baru
          </button>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <svg className="h-8 w-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600 font-medium max-w-xl mx-auto shadow-sm">
            {error}
          </div>
        ) : rppList.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-white py-24 text-center max-w-xl mx-auto shadow-sm">
            <svg className="mx-auto h-16 w-16 text-slate-300 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <h3 className="text-lg font-bold text-slate-700">Belum ada RPP</h3>
            <p className="mt-1.5 text-sm text-slate-500">Mulai buat RPP dengan klik tombol di pojok kanan atas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {rppList.map((rpp) => {
              const files = rpp.files || [];
              return (
                <div key={rpp.id} className="group flex flex-col justify-between rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {rpp.is_published ? (
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full uppercase tracking-wider">Publik</span>
                        ) : (
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full uppercase tracking-wider">Draf</span>
                        )}
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition text-base leading-snug line-clamp-2 mb-2">{rpp.judul}</h3>
                    
                    <p className="text-xs font-semibold text-indigo-600 mb-4 uppercase tracking-wider">
                      {rpp.mata_pelajaran?.nama_mapel || "Mata Pelajaran"}
                    </p>

                    {rpp.deskripsi && (
                      <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed mb-4">{rpp.deskripsi}</p>
                    )}

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {rpp.kelas && <span className="text-[11px] font-medium bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg">{rpp.kelas}</span>}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">
                      {(rpp.pertemuans?.length > 0) ? `${rpp.pertemuans.length} pertemuan` : files.length > 0 ? `${files.length} lampiran` : "Tanpa lampiran"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setRppDetailModal(rpp)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                        title="Lihat Detail"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          setRppForm({
                            judul: rpp.judul || "",
                            deskripsi: rpp.deskripsi || "",
                            kelas: rpp.kelas || "",
                            mapel_id: rpp.mapel_id || "",
                            is_published: rpp.is_published ? true : false,
                            pertemuans: rpp.pertemuans || [],
                          });
                          setRppExistingFiles(rpp.files || []);
                          setRppNewFiles([]);
                          setRppFormError("");
                          setRppFormModal({ mode: "edit", id: rpp.id });
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-blue-600 hover:bg-blue-50 transition"
                        title="Edit"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteRppConfirm(rpp)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50 transition"
                        title="Hapus"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Modal Hapus RPP ──────────────────────────────────────────────── */}
        {deleteRppConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-[32px] bg-white p-8 shadow-2xl text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
                <svg className="h-7 w-7 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800">Hapus RPP?</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                RPP <span className="font-semibold text-slate-700">"{deleteRppConfirm.judul}"</span> beserta lampirannya akan dihapus permanen.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setDeleteRppConfirm(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteRpp}
                  className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-bold text-white hover:bg-rose-600 transition"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Detail RPP ─────────────────────────────────────────────── */}
        {rppDetailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-start justify-between rounded-t-2xl">
                <div>
                  <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Detail RPP</p>
                  <h2 className="font-bold text-slate-800 text-lg leading-snug pr-6">{rppDetailModal.judul}</h2>
                </div>
                <button onClick={() => setRppDetailModal(null)} className="text-slate-400 hover:text-slate-600 transition mt-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Kelas", value: rppDetailModal.kelas || "—" },
                    { label: "Mata Pelajaran", value: rppDetailModal.mata_pelajaran?.nama_mapel || "—" },
                    { label: "Status RPP", value: rppDetailModal.is_published ? "Publik" : "Draf" },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-700">{item.value}</p>
                    </div>
                  ))}
                </div>
                {rppDetailModal.deskripsi && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Deskripsi / Tujuan</p>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 rounded-xl p-4">{rppDetailModal.deskripsi}</p>
                  </div>
                )}

                {/* ── Daftar Pertemuan ──────────────────────────────── */}
                {(rppDetailModal.pertemuans || []).length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Daftar Pertemuan ({rppDetailModal.pertemuans.length})</p>
                    <div className="space-y-3">
                      {rppDetailModal.pertemuans.map((pt, i) => (
                        <div key={i} className="flex gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                            {i + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 leading-snug">{pt.judul || `Pertemuan ${i + 1}`}</p>
                            {pt.deskripsi && (
                              <p className="mt-1 text-sm text-slate-600 leading-relaxed whitespace-pre-line">{pt.deskripsi}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── File Lampiran ─────────────────────────────────── */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">File Lampiran ({(rppDetailModal.files || []).length})</p>
                  {(rppDetailModal.files || []).length > 0 ? (
                    <div className="space-y-2">
                      {(rppDetailModal.files || []).map((f, i) => {
                        const ext = f.nama_file?.split(".").pop() || "";
                        const extColors = { pdf: "bg-red-50 text-red-500", docx: "bg-blue-50 text-blue-500", doc: "bg-blue-50 text-blue-500", pptx: "bg-orange-50 text-orange-500" };
                        const extColor = extColors[ext.toLowerCase()] || "bg-slate-100 text-slate-500";
                        return (
                          <a key={i} href={fixFileUrl(f.path)} target="_blank" rel="noreferrer"
                            className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition group">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-[10px] font-bold uppercase ${extColor}`}>{ext || "—"}</span>
                            <p className="flex-1 text-sm font-semibold text-slate-700 group-hover:text-indigo-700 truncate">{f.nama_file}</p>
                            <svg className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-5 rounded-xl bg-slate-50 text-slate-400 text-sm">Tidak ada file lampiran.</div>
                  )}
                </div>
              </div>
              <div className="border-t border-slate-100 px-6 py-4">
                <button onClick={() => setRppDetailModal(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-700 transition">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Buat / Edit RPP ────────────────────────────────────────── */}
        {rppFormModal && (() => {
          const isBuat = rppFormModal.mode === "buat";
          const handleRppSubmit = async (e) => {
            e.preventDefault();
            if (!rppForm.judul.trim()) { setRppFormError("Judul RPP wajib diisi."); return; }
            if (!rppForm.mapel_id) { setRppFormError("Mata pelajaran wajib dipilih."); return; }

            setRppFormLoading(true);
            setRppFormError("");

            try {
              const fd = new FormData();
              fd.append("judul", rppForm.judul);
              fd.append("deskripsi", rppForm.deskripsi);
              
              const selectedMapel = mapelList.find(m => String(m.id) === String(rppForm.mapel_id));
              fd.append("kelas", selectedMapel ? selectedMapel.kelasAsli : (rppForm.kelas || ""));
              fd.append("mapel_id", rppForm.mapel_id);
              if (rppForm.rombel_id) fd.append("rombel_id", rppForm.rombel_id);
              fd.append("is_published", rppForm.is_published ? 1 : 0);
              fd.append("pertemuans", JSON.stringify(rppForm.pertemuans || []));
              rppNewFiles.forEach(f => fd.append("files[]", f));

              if (isBuat) {
                await createRpp(fd);
                toast("RPP baru berhasil dibuat!", "success");
              } else {
                await updateRpp(rppFormModal.id, fd);
                toast("RPP berhasil diubah!", "success");
              }
              setRppFormModal(null);
              fetchData(); // Reload from server to get accurate data
            } catch (err) {
              setRppFormError(err?.response?.data?.message || "Gagal menyimpan RPP.");
            } finally {
              setRppFormLoading(false);
            }
          };

          const handleDeleteExistingFile = async (file) => {
            if (!confirm(`Hapus file "${file.nama_file}"?`)) return;
            try {
              await deleteRppFile(file.id);
              setRppExistingFiles(prev => prev.filter(f => f.id !== file.id));
              toast("File lampiran dihapus", "success");
            } catch {
              toast("Gagal menghapus file.", "error");
            }
          };

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                  <div>
                    <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">{isBuat ? "Buat RPP Baru" : "Edit RPP"}</p>
                  </div>
                  <button onClick={() => setRppFormModal(null)} className="text-slate-400 hover:text-slate-600 transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleRppSubmit}>
                  <div className="px-6 py-5 space-y-4">
                    
                    {/* Mata Pelajaran */}
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Mata Pelajaran <span className="text-red-400">*</span></label>
                      <select
                        value={rppForm.mapel_id}
                        onChange={e => {
                          const selected = mapelList.find(m => String(m.id) === String(e.target.value));
                          setRppForm({ 
                            ...rppForm, 
                            mapel_id: e.target.value,
                            rombel_id: selected?.rombel_id || "",
                            kelas: selected?.kelasAsli || ""
                          });
                        }}
                        className="w-full rounded-xl border-0 bg-[#E8F0FE] px-3 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-300 transition"
                      >
                        <option value="">-- Pilih Mata Pelajaran --</option>
                        {mapelList.map(m => (
                          <option key={m.id} value={m.id}>{m.nama}</option>
                        ))}
                      </select>
                    </div>

                    {/* Judul RPP */}
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Judul RPP <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        value={rppForm.judul}
                        onChange={e => setRppForm({ ...rppForm, judul: e.target.value })}
                        placeholder="Contoh: RPP Pemrograman Web Kelas XI"
                        className="w-full rounded-xl border-0 bg-[#E8F0FE] px-4 py-3 text-sm text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-300 transition"
                      />
                    </div>



                    {/* Status Publikasi */}
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Status RPP</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="is_published"
                            checked={!rppForm.is_published}
                            onChange={() => setRppForm({ ...rppForm, is_published: false })}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="text-sm font-medium text-slate-700">Simpan sebagai Draf</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="is_published"
                            checked={rppForm.is_published}
                            onChange={() => setRppForm({ ...rppForm, is_published: true })}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                          />
                          <span className="text-sm font-medium text-slate-700">Publikasikan ke Siswa</span>
                        </label>
                      </div>
                    </div>

                    {/* File existing (mode edit) */}
                    {!isBuat && rppExistingFiles.length > 0 && (
                      <div>
                        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">File yang sudah ada</label>
                        <div className="flex flex-wrap gap-2">
                          {rppExistingFiles.map(f => {
                            const ext = f.nama_file?.split(".").pop() || "";
                            return (
                              <div key={f.id} className="flex items-center gap-1.5 border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-1.5">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{ext}</span>
                                <a href={fixFileUrl(f.path)} target="_blank" rel="noreferrer" className="text-xs font-medium text-slate-600 hover:text-blue-600 truncate max-w-[120px]">{f.nama_file}</a>
                                <button type="button" onClick={() => handleDeleteExistingFile(f)} className="text-rose-400 hover:text-rose-600 ml-1">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Upload file baru */}
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {isBuat ? "Lampiran File" : "Tambah File Baru"}
                      </label>
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-xl p-5 cursor-pointer transition hover:bg-slate-50">
                        <svg className="h-8 w-8 text-slate-300 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        <span className="text-sm font-semibold text-slate-500">Klik untuk memilih file</span>
                        <span className="text-xs text-slate-400 mt-0.5">PDF, DOCX, PPTX, dll</span>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt"
                          onChange={e => {
                            const newF = Array.from(e.target.files);
                            setRppNewFiles(prev => {
                              const names = new Set(prev.map(f => f.name));
                              return [...prev, ...newF.filter(f => !names.has(f.name))];
                            });
                          }}
                        />
                      </label>
                      {rppNewFiles.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {rppNewFiles.map(f => (
                            <div key={f.name} className="flex items-center gap-1.5 border border-blue-200 bg-blue-50 rounded-lg px-2.5 py-1.5">
                              <span className="text-xs font-medium text-blue-600 truncate max-w-[130px]">{f.name}</span>
                              <button type="button" onClick={() => setRppNewFiles(prev => prev.filter(x => x.name !== f.name))} className="text-blue-400 hover:text-blue-700">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Error */}
                    {rppFormError && (
                      <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 border border-rose-200">{rppFormError}</p>
                    )}
                  </div>
                  {/* Footer */}
                  <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-3 rounded-b-2xl">
                    <button
                      type="button"
                      onClick={() => setRppFormModal(null)}
                      className="flex-1 rounded-xl border-2 border-blue-100 bg-white py-2.5 text-sm font-bold text-blue-600 hover:bg-blue-50 transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={rppFormLoading}
                      className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-[#0B57D0] py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60 transition"
                    >
                      {rppFormLoading ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Menyimpan...
                        </>
                      ) : isBuat ? "Simpan RPP" : "Simpan Perubahan"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}
      </div>
    </GuruLayout>
  );
}
