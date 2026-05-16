import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getRombel, deleteRombel, kickSiswaFromRombel, getSiswa, getRombelById, getRombelMapel, getGuru, getGuruByMapelRoute } from "../services/authService";
import { toast } from "../utils/notify";

export default function AnggotaKelas() {
  const navigate = useNavigate();
  const [rombelList, setRombelList] = useState([]);
  const [search, setSearch] = useState("");
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
  const [kickModal, setKickModal] = useState({ open: false, rombelId: null, siswa: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Detail view state (Lihat Siswa)
  const [detailRombel, setDetailRombel] = useState(null);
  const [detailSiswa, setDetailSiswa] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Detail view state (Lihat Mapel)
  const [detailView, setDetailView] = useState("siswa"); // "siswa" | "mapel"
  const [detailMapel, setDetailMapel] = useState([]);
  const [mapelLoading, setMapelLoading] = useState(false);

  useEffect(() => {
    fetchRombel();
  }, []);

  const fetchRombel = async () => {
    setLoading(true);
    setError("");
    try {
      const resRombel = await getRombel();
      const dataRombel = resRombel.data?.data || resRombel.data || [];
      setRombelList(dataRombel);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat data rombel");
      console.error("Rombel error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return rombelList;
    const q = search.toLowerCase();
    return rombelList.filter((k) => {
      let jurusan = "";
      if (typeof k.nama_jurusan === 'string') jurusan = k.nama_jurusan;
      else if (typeof k.jurusan === 'string') jurusan = k.jurusan;
      else if (k.jurusan && typeof k.jurusan === 'object') jurusan = k.jurusan.nama_jurusan || k.jurusan.nama || "";

      let kelas = (k.tingkat || "").toString();
      if (k.kelas && typeof k.kelas === 'object') kelas = k.kelas.nama_kelas || k.kelas.tingkat || kelas;
      else if (typeof k.kelas === 'string') kelas = k.kelas;

      return jurusan.toLowerCase().includes(q) || kelas.toLowerCase().includes(q);
    });
  }, [rombelList, search]);

  // ── Delete Rombel ──────────────────────────────────────────────────
  const confirmDelete = (item) => setDeleteModal({ open: true, item });
  const cancelDelete = () => setDeleteModal({ open: false, item: null });

  const handleDelete = async () => {
    if (!deleteModal.item) return;
    setDeleting(true);
    try {
      const idToDelete = deleteModal.item.rombel_id || deleteModal.item.id;
      await deleteRombel(idToDelete);
      setRombelList((prev) => prev.filter((k) => (k.rombel_id || k.id) !== idToDelete));
      cancelDelete();
    } catch (err) {
      toast(err?.response?.data?.message || "Gagal menghapus rombel", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ── Kick Siswa ─────────────────────────────────────────────────────
  const confirmKick = (rombelId, siswa) => setKickModal({ open: true, rombelId, siswa });
  const cancelKick = () => setKickModal({ open: false, rombelId: null, siswa: null });

  const handleKick = async () => {
    if (!kickModal.rombelId || !kickModal.siswa) return;
    setDeleting(true);
    try {
      const siswaIdToKick = kickModal.siswa.id || kickModal.siswa.siswa_id;
      await kickSiswaFromRombel(kickModal.rombelId, siswaIdToKick);

      // Refresh detail view
      setDetailSiswa((prev) => {
        const newSiswaList = prev.filter((s) => (s.id || s.siswa_id) !== siswaIdToKick);

        // Sinkronkan juga ke list utama agar saat kembali, jumlahnya sesuai
        setRombelList((rombelPrev) =>
          rombelPrev.map((r) =>
            (r.rombel_id || r.id) === kickModal.rombelId
              ? { ...r, total_siswa: newSiswaList.length, siswa: newSiswaList }
              : r
          )
        );

        return newSiswaList;
      });

      cancelKick();
    } catch (err) {
      toast(err?.response?.data?.message || "Gagal menghapus siswa dari kelas", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ── Lihat Siswa ────────────────────────────────────────────────────
  const handleLihatSiswa = async (rombel) => {
    setDetailRombel(rombel);
    setDetailLoading(true);
    try {
      const rombelId = rombel.rombel_id || rombel.id;
      const res = await getRombelById(rombelId);

      // Mengambil data rombel yang berisi array siswa
      const data = res.data?.data || res.data || {};
      const listSiswa = data.siswa || [];

      setDetailSiswa(listSiswa);

      // Sinkronkan total_siswa di rombelList dengan data aslinya (berdasarkan panjang array)
      setRombelList((prev) =>
        prev.map((r) =>
          (r.rombel_id || r.id) === rombelId
            ? { ...r, total_siswa: listSiswa.length, siswa: listSiswa }
            : r
        )
      );

    } catch (err) {
      console.error("Lihat siswa error:", err);
      setDetailSiswa([]);
      toast("Gagal memuat detail siswa dari server", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailRombel(null);
    setDetailSiswa([]);
    setDetailMapel([]);
    setDetailView("siswa");
  };

  // ── Lihat Mapel ────────────────────────────────────────────────────
  const handleLihatMapel = async (rombel) => {
    setDetailView("mapel");
    if (detailMapel.length > 0) return;
    setMapelLoading(true);
    try {
      const rombelId = rombel.rombel_id || rombel.id;

      // Ambil HANYA mapel yang sudah di-assign ke rombel via GET /rombel/{id}/mapel
      let mapelList = [];
      try {
        const res = await getRombelMapel(rombelId);
        const raw = res.data?.data || res.data || [];
        mapelList = Array.isArray(raw) ? raw : [];
      } catch (fetchErr) {
        console.warn("getRombelMapel gagal:", fetchErr);
        mapelList = [];
      }

      // Enrich dengan data guru (dibungkus try/catch agar tidak crash)
      try {
        const resGuru = await getGuru();
        const allGurus = resGuru.data?.data || resGuru.data || [];

        const gurusWithMapels = await Promise.all(
          (Array.isArray(allGurus) ? allGurus : []).map(async (guru) => {
            try {
              const detailRes = await getGuruByMapelRoute(guru.id);
              const mapelOfGuru = detailRes.data?.data?.mapel || [];
              return { ...guru, mapel_ids: mapelOfGuru.map((gm) => gm.id) };
            } catch {
              return { ...guru, mapel_ids: [] };
            }
          })
        );

        mapelList = mapelList.map((m) => {
          const matchingGurus = gurusWithMapels.filter((g) => g.mapel_ids.includes(m.id));
          return { ...m, gurus: matchingGurus };
        });
      } catch (guruErr) {
        console.warn("Gagal enrich guru:", guruErr);
      }

      setDetailMapel(mapelList);
    } catch (err) {
      console.error("Lihat mapel error:", err);
      setDetailMapel([]);
    } finally {
      setMapelLoading(false);
    }
  };

  // Get display info
  const getDisplayInfo = (item) => {
    let jurusanNama = "-";
    if (typeof item.nama_jurusan === 'string') {
      jurusanNama = item.nama_jurusan;
    } else if (typeof item.jurusan === 'string') {
      jurusanNama = item.jurusan;
    } else if (item.jurusan && typeof item.jurusan === 'object') {
      jurusanNama = item.jurusan.nama_jurusan || item.jurusan.nama || "-";
    }

    let kelasNama = item.tingkat || "-";
    if (item.kelas && typeof item.kelas === 'object') {
      kelasNama = item.kelas.nama_kelas || item.kelas.tingkat || kelasNama;
    } else if (typeof item.kelas === 'string') {
      kelasNama = item.kelas;
    }

    return { jurusanNama, kelasNama };
  };

  // ── Detail View (Lihat Siswa) ──────────────────────────────────────
  if (detailRombel) {
    const { jurusanNama, kelasNama } = getDisplayInfo(detailRombel);
    const kelasLabel = `${kelasNama} ${jurusanNama}`;
    return (
      <main className="min-h-screen bg-[#F8FAFC]">
        <Sidebar />
        <div className="ml-64 px-10 py-12">
          <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
            <div>
              <button
                onClick={closeDetail}
                className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Kembali ke Kelas
              </button>
              <h1 className="text-[28px] font-bold text-blue-600 uppercase tracking-wide">Daftar Siswa — {kelasLabel}</h1>
              <p className="mt-1 text-sm font-medium text-slate-400">Anggota rombongan belajar kelas ini</p>
            </div>

            <div className="flex items-center gap-3">
            </div>
          </div>

          {/* Toggle Tab: Siswa / Mapel */}
          <div className="mb-6 flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setDetailView("siswa")}
              className={`pb-2 px-4 text-sm font-bold border-b-2 transition -mb-px ${detailView === "siswa"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
            >
              Daftar Siswa ({detailSiswa.length})
            </button>
            <button
              onClick={() => handleLihatMapel(detailRombel)}
              className={`pb-2 px-4 text-sm font-bold border-b-2 transition -mb-px ${detailView === "mapel"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
            >
              Mata Pelajaran
            </button>
          </div>

          {/* ── SISWA VIEW ── */}
          {detailView === "siswa" && (
            detailLoading ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-16">
                <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                <p className="text-sm font-medium text-slate-500">Memuat data siswa…</p>
              </div>
            ) : detailSiswa.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
                Belum ada siswa terdaftar di kelas ini.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="py-4 pl-8 pr-4 text-xs font-bold uppercase tracking-wider text-slate-400">Nama Siswa</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">NIS</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Jenis Kelamin</th>
                      <th className="px-4 py-4 pr-8 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {detailSiswa.map((item) => {
                      const nama = item.nama_lengkap || item.nama || item.name || "-";
                      const nis = item.nis || "-";
                      const jk = item.jenis_kelamin || "-";
                      const siswaId = item.id;
                      return (
                        <tr key={item.id} className="transition hover:bg-slate-50/50">
                          <td className="py-4 pl-8 pr-4 text-sm font-semibold text-slate-700">{nama}</td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                              {nis}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-slate-600">{jk}</td>
                          <td className="px-4 py-4 pr-8">
                            <div className="flex items-center justify-end">
                              <button
                                onClick={() => confirmKick(detailRombel.rombel_id || detailRombel.id, { ...item, id: siswaId })}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                                title="Keluarkan dari kelas"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* ── MAPEL VIEW ── */}
          {detailView === "mapel" && (
            mapelLoading ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-16">
                <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                <p className="text-sm font-medium text-slate-500">Memuat mata pelajaran…</p>
              </div>
            ) : detailMapel.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
                <svg className="mx-auto h-12 w-12 text-slate-300 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
                <p className="font-semibold">Belum ada mata pelajaran di kelas ini.</p>
                <p className="mt-1 text-sm">Klik "TAMBAH MAPEL" untuk menambahkan mata pelajaran.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="py-4 pl-8 pr-4 text-xs font-bold uppercase tracking-wider text-slate-400">Mata Pelajaran</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Kode Mapel</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Guru Pengajar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {detailMapel.map((mapel, idx) => {
                      const namaMapel = mapel.nama_mapel || mapel.nama || "-";
                      const kodeMapel = mapel.kode_mapel || mapel.kode || "-";
                      return (
                        <tr key={mapel.id || idx} className="transition hover:bg-slate-50/50">
                          <td className="py-4 pl-8 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                </svg>
                              </div>
                              <span className="text-sm font-semibold text-slate-700">{namaMapel}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                              {kodeMapel}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600 font-medium">
                            {mapel.gurus && mapel.gurus.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {mapel.gurus.map((g, gIdx) => (
                                  <span key={gIdx} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                                    {g.nama_lengkap || g.nama || g.name || "-"}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Kick confirmation modal */}
        {kickModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-sm animate-[fadeIn_0.2s_ease] rounded-2xl bg-white p-8 shadow-2xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                <svg className="h-6 w-6 text-rose-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Keluarkan Siswa?</h3>
              <p className="mt-2 text-sm text-slate-500">Yakin ingin mengeluarkan siswa ini dari kelas? Tindakan ini tidak bisa dibatalkan.</p>
              <div className="mt-6 flex gap-3">
                <button onClick={cancelKick} disabled={deleting} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Batal</button>
                <button onClick={handleKick} disabled={deleting} className="flex flex-1 items-center justify-center rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700">
                  {deleting ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Ya, Keluarkan"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  // ── Main Rombel List ───────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <div className="ml-64 px-10 py-12">
        {/* Header */}
        <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-blue-600 uppercase tracking-wide">Manajemen Kelas</h1>
            <p className="mt-1 text-sm font-medium text-slate-400">Kelola data kelas dan rombongan belajar institusi Anda.</p>
          </div>

          <button
            onClick={() => navigate("/tambah-kelas")}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 hover:shadow-lg"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            TAMBAH KELAS
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari Jurusan atau Kelas"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-16">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <p className="text-sm font-medium text-slate-500">Memuat data rombel…</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
            <p className="font-semibold text-rose-700">{error}</p>
            <button
              onClick={fetchRombel}
              className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="py-4 pl-8 pr-4 text-xs font-bold uppercase tracking-wider text-slate-400">Jurusan</th>
                  <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Kelas</th>
                  <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Tahun Ajaran</th>
                  <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Total Siswa</th>
                  <th className="px-4 py-4 pr-8 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length > 0 ? (
                  filtered.map((item) => {
                    const { jurusanNama, kelasNama } = getDisplayInfo(item);

                    return (
                      <tr key={item.rombel_id || item.id || Math.random()} className="transition hover:bg-slate-50/50">
                        <td className="py-4 pl-8 pr-4">
                          <div>
                            <p className="text-sm font-semibold font-gray-500">{jurusanNama}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center text-sm font-semibold text-slate-700">{kelasNama}</td>
                        <td className="px-4 py-4 text-center text-sm text-slate-500 font-medium">
                          {item.tahun_ajaran || "-"}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                            {item.siswa ? item.siswa.length : (item.total_siswa || 0)} Siswa
                          </span>
                        </td>
                        <td className="px-4 py-4 pr-8">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => handleLihatSiswa(item)}
                              className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition hover:bg-blue-600 hover:text-white"
                            >
                              Lihat Semua &rsaquo;
                            </button>
                            <button
                              onClick={() => navigate(`/edit-anggota-kelas/${item.rombel_id || item.id}`)}
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
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-sm font-medium text-slate-400">
                      Tidak ada rombel ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
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
            <h3 className="text-lg font-bold text-slate-900">Hapus Rombel?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Yakin ingin menghapus kelas ini? Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={cancelDelete}
                disabled={deleting}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex flex-1 items-center justify-center rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                {deleting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  "Ya, Hapus"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
