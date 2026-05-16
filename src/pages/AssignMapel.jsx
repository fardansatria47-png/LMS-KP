import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getRombel, getMapel, assignMapelToRombel } from "../services/authService";

const getRombelDisplayInfo = (item) => {
  if (!item) return { jurusanNama: "", kelasNama: "" };
  let jurusanNama = "";
  if (typeof item.nama_jurusan === 'string') jurusanNama = item.nama_jurusan;
  else if (typeof item.jurusan === 'string') jurusanNama = item.jurusan;
  else if (item.jurusan && typeof item.jurusan === 'object') jurusanNama = item.jurusan.nama_jurusan || item.jurusan.nama || "";

  let kelasNama = item.tingkat || "";
  if (item.kelas && typeof item.kelas === 'object') kelasNama = item.kelas.nama_kelas || item.kelas.tingkat || kelasNama;
  else if (typeof item.kelas === 'string') kelasNama = item.kelas;

  return { jurusanNama, kelasNama };
};

export default function AssignMapel() {
  const navigate = useNavigate();
  const location = useLocation();

  // ─── State ────────────────────────────────────────────────────────────
  const [rombelList, setRombelList] = useState([]);
  const [allMapel, setAllMapel] = useState([]);   // semua mapel dari BE
  const [mapelList, setMapelList] = useState([]);   // mapel setelah difilter per rombel
  const [rombelId, setRombelId] = useState(
    location.state?.rombelId ? String(location.state.rombelId) : ""
  );
  const [mapelIds, setMapelIds] = useState([]);
  const [mapelSearch, setMapelSearch] = useState("");

  const [loadingRombel, setLoadingRombel] = useState(true);
  const [loadingMapel, setLoadingMapel] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ─── 1. Load rombel & semua mapel sekaligus ───────────────────────────
  useEffect(() => {
    let rombelData = [];

    const init = async () => {
      try {
        // Load rombel
        const resRombel = await getRombel();
        rombelData = resRombel.data?.data || resRombel.data || [];
        setRombelList(rombelData);
      } catch {
        setErrorMsg("Gagal memuat daftar rombel.");
      } finally {
        setLoadingRombel(false);
      }

      try {
        // Load semua mapel
        const resMapel = await getMapel();
        const semua = resMapel.data?.data || resMapel.data || [];
        setAllMapel(semua);

        // Jika sudah ada rombel terpilih dari navigation state → langsung filter
        const initRombelId = location.state?.rombelId
          ? String(location.state.rombelId)
          : "";
        if (initRombelId) {
          const rombel = rombelData.find(
            (r) => String(r.rombel_id || r.id) === initRombelId
          );
          if (rombel) {
            setMapelList(filterMapelByRombel(semua, rombel));
          }
        }
      } catch {
        setErrorMsg("Gagal memuat daftar mata pelajaran.");
      } finally {
        setLoadingMapel(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── 2. Filter mapel berdasarkan kelas & jurusan rombel ───────────────
  //
  // Mapel cocok dengan rombel jika:
  //   - kelas_id sama (angka)  ATAU tingkat sama (string "X"/"XI"/dst)
  //   - DAN jurusan_id sama    ATAU nama_jurusan match nama jurusan rombel
  //
  const filterMapelByRombel = (semua, rombel) => {
    const { jurusanNama, kelasNama } = getRombelDisplayInfo(rombel);

    return semua.filter((m) => {
      // ── Match kelas ──────────────────────────────────────────────
      const rKelas = (kelasNama || "").toString().toLowerCase();
      const mKelas = (m.tingkat || String(m.kelas_id || "")).toString().toLowerCase();
      const rKelasId = rombel.kelas_id ? String(rombel.kelas_id) : "";
      const mKelasId = m.kelas_id ? String(m.kelas_id) : "";

      const kelasMatch =
        (rKelasId && mKelasId && rKelasId === mKelasId) ||
        (rKelas && mKelas && mKelas === rKelas);

      // ── Match jurusan ────────────────────────────────────────────
      const rJurusan = (jurusanNama || "").toString().toLowerCase();
      const mJurusan = (m.nama_jurusan || "").toString().toLowerCase();
      const rJurusanId = rombel.jurusan_id ? String(rombel.jurusan_id) : "";
      const mJurusanId = m.jurusan_id ? String(m.jurusan_id) : "";

      const jurusanMatch =
        (rJurusanId && mJurusanId && rJurusanId === mJurusanId) ||
        (rJurusan && mJurusan && mJurusan === rJurusan);

      return kelasMatch && jurusanMatch;
    });
  };

  // ─── 3. Handler pilih rombel ──────────────────────────────────────────
  const handleSelectRombel = (e) => {
    const val = e.target.value;
    setRombelId(val);
    setMapelIds([]);
    setMapelSearch("");
    setSuccessMsg("");
    setErrorMsg("");

    if (!val) {
      setMapelList([]);
      return;
    }

    const rombel = rombelList.find(
      (r) => String(r.rombel_id || r.id) === String(val)
    );

    if (rombel) {
      const hasil = filterMapelByRombel(allMapel, rombel);
      setMapelList(hasil);
      // Debug — bisa dihapus setelah production
      console.log("[AssignMapel] rombel →", rombel);
      console.log("[AssignMapel] mapel hasil filter →", hasil.length, hasil);
    }
  };

  // ─── Checkbox helpers ─────────────────────────────────────────────────
  const filteredMapel = mapelList.filter((m) => {
    const q = mapelSearch.toLowerCase();
    return (
      (m.nama_mapel || "").toLowerCase().includes(q) ||
      (m.kode_mapel || "").toLowerCase().includes(q) ||
      (m.nama_jurusan || "").toLowerCase().includes(q)
    );
  });

  const isAllVisible = () => {
    const ids = filteredMapel.map((m) => m.id);
    return ids.length > 0 && ids.every((id) => mapelIds.includes(id));
  };

  const toggleAll = () => {
    const ids = filteredMapel.map((m) => m.id);
    if (isAllVisible()) {
      setMapelIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setMapelIds((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const toggleMapel = (id) =>
    setMapelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // ─── Submit ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSuccessMsg("");
    setErrorMsg("");

    if (!rombelId) { setErrorMsg("Pilih rombel terlebih dahulu."); return; }
    if (mapelIds.length === 0) { setErrorMsg("Pilih minimal 1 mata pelajaran."); return; }

    setSubmitting(true);
    try {
      const res = await assignMapelToRombel(rombelId, mapelIds);
      setSuccessMsg(res.data?.message || "Mata pelajaran berhasil ditambahkan ke kelas!");
      setMapelIds([]);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || "Gagal menyimpan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Derived ─────────────────────────────────────────────────────────
  const selectedRombel = rombelList.find(
    (r) => String(r.rombel_id || r.id) === String(rombelId)
  );

  let rombelLabel = "";
  if (selectedRombel) {
    const { jurusanNama, kelasNama } = getRombelDisplayInfo(selectedRombel);
    rombelLabel = selectedRombel.nama_rombel || `${kelasNama} ${jurusanNama}`.trim();
  }

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <div className="ml-64 px-10 py-12">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Kembali
            </button>
            <h1 className="text-[28px] font-bold text-blue-600 uppercase tracking-wide">
              Tambah Mata Pelajaran ke Kelas
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-400">
              Pilih kelas — mapel otomatis difilter sesuai jurusan &amp; tingkat kelas.
            </p>
          </div>
        </div>

        {/* ── Alert messages ───────────────────────────────────────────── */}
        {successMsg && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-semibold text-emerald-700">{successMsg}</p>
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-semibold text-rose-700">{errorMsg}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ── LEFT: Pilih Kelas ────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</span>
                Pilih Kelas
              </h2>

              {loadingRombel ? (
                <div className="flex items-center gap-3 py-6 text-sm text-slate-400">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                  Memuat daftar kelas…
                </div>
              ) : (
                <select
                  id="select-rombel"
                  value={rombelId}
                  onChange={handleSelectRombel}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">— Pilih Kelas —</option>
                  {rombelList.map((r) => {
                    const id = r.rombel_id || r.id;
                    const { jurusanNama, kelasNama } = getRombelDisplayInfo(r);
                    const label = r.nama_rombel || `${kelasNama} ${jurusanNama}`.trim();
                    return (
                      <option key={id} value={id}>
                        {label || `Kelas #${id}`}
                      </option>
                    );
                  })}
                </select>
              )}

              {/* Kelas badge */}
              {selectedRombel && (
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Kelas dipilih</p>
                  <p className="mt-1 text-sm font-bold text-blue-700">{rombelLabel}</p>
                  <p className="mt-0.5 text-xs text-blue-400">
                    {mapelList.length} mapel tersedia
                  </p>
                </div>
              )}

              {/* Summary mapel dipilih */}
              {mapelIds.length > 0 && (
                <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-violet-400">Mapel dipilih</p>
                  <p className="mt-1 text-2xl font-bold text-violet-700">{mapelIds.length}</p>
                  <p className="text-xs text-violet-400">dari {mapelList.length} mapel tersedia</p>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Daftar Mapel ──────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">2</span>
                  Pilih Mata Pelajaran
                  {rombelLabel && (
                    <span className="ml-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                      {rombelLabel}
                    </span>
                  )}
                </h2>
              </div>

              {/* Search */}
              {rombelId && (
                <div className="relative mb-4">
                  <svg className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={mapelSearch}
                    onChange={(e) => setMapelSearch(e.target.value)}
                    placeholder="Cari nama / kode mapel…"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              )}

              {/* Select all */}
              {!loadingMapel && rombelId && filteredMapel.length > 0 && (
                <label className="mb-3 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 transition hover:bg-slate-100">
                  <input
                    id="chk-all"
                    type="checkbox"
                    checked={isAllVisible()}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded accent-blue-600"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Pilih Semua ({filteredMapel.length})
                  </span>
                </label>
              )}

              {/* Content */}
              {!rombelId ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-16 text-center">
                  <svg className="mb-3 h-10 w-10 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                  </svg>
                  <p className="text-sm font-semibold text-slate-400">Belum ada kelas dipilih</p>
                  <p className="mt-1 text-xs text-slate-300">Pilih kelas di panel kiri untuk menampilkan mata pelajaran</p>
                </div>
              ) : loadingMapel ? (
                <div className="flex items-center justify-center gap-3 py-14 text-sm text-slate-400">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                  Memuat mata pelajaran…
                </div>
              ) : mapelList.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-amber-200 bg-amber-50 py-14 text-center">
                  <svg className="mb-3 h-8 w-8 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <p className="text-sm font-semibold text-amber-700">Tidak ada mapel untuk kelas ini</p>
                  <p className="mt-1 text-xs text-amber-500">
                    Pastikan mata pelajaran sudah ditambahkan dengan jurusan &amp; kelas yang sesuai
                  </p>
                </div>
              ) : filteredMapel.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  Tidak ada mapel cocok dengan pencarian.
                </p>
              ) : (
                <div className="max-h-[420px] overflow-y-auto rounded-xl border border-slate-100 divide-y divide-slate-50">
                  {filteredMapel.map((m) => {
                    const checked = mapelIds.includes(m.id);
                    return (
                      <label
                        key={m.id}
                        htmlFor={`chk-mapel-${m.id}`}
                        className={`flex cursor-pointer items-center gap-4 px-4 py-3 transition ${checked ? "bg-blue-50/60" : "hover:bg-slate-50"
                          }`}
                      >
                        <input
                          id={`chk-mapel-${m.id}`}
                          type="checkbox"
                          value={m.id}
                          checked={checked}
                          onChange={() => toggleMapel(m.id)}
                          className="h-4 w-4 flex-shrink-0 rounded accent-blue-600"
                        />
                        <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{m.nama_mapel}</p>
                            <p className="text-xs text-slate-400">
                              {m.nama_jurusan || ""}
                              {m.tingkat ? ` · Kelas ${m.tingkat}` : ""}
                            </p>
                          </div>
                          {m.kode_mapel && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">
                              {m.kode_mapel}
                            </span>
                          )}
                        </div>
                        {checked && (
                          <svg className="h-4 w-4 flex-shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Tombol SIMPAN ────────────────────────────────────────────────── */}
        <div className="mt-8 flex items-center justify-end gap-4">
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            id="btn-simpan-assign"
            onClick={handleSubmit}
            disabled={submitting || !rombelId || mapelIds.length === 0}
            className="flex min-w-[180px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Menyimpan…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                SIMPAN {mapelIds.length > 0 ? `(${mapelIds.length}) ` : ""}MAPEL
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
