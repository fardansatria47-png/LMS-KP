import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { createRombel, assignSiswaToRombel, getRombelFormData, getRombel, getSiswa } from "../services/authService";

export default function TambahAnggotaKelas() {
  const navigate = useNavigate();
  const location = useLocation();
  // Context rombel yang dikirim dari halaman detail kelas (AnggotaKelas)
  const rombelCtx = location.state || {};
  const ctxJurusan = rombelCtx.jurusan || null;   // nama jurusan
  const ctxTingkat = rombelCtx.tingkat || null;   // nama kelas/tingkat
  const ctxRombelId = rombelCtx.rombelId || null; // rombel_id yang sudah ada

  const [form, setForm] = useState({ kelas_id: "", jurusan_id: "" });
  const [selectedSiswa, setSelectedSiswa] = useState([]);
  const [searchSiswa, setSearchSiswa] = useState("");

  const [siswaList, setSiswaList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [jurusanList, setJurusanList] = useState([]);
  const [existingRombels, setExistingRombels] = useState([]);


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [errors, setErrors] = useState({});
  const [submitResult, setSubmitResult] = useState(null);

  useEffect(() => { fetchDropdownData(); }, []);

  const fetchDropdownData = async () => {
    setLoadingData(true);
    setFetchError("");
    try {
      const [resFormData, resRombel, resSiswa] = await Promise.all([
        getRombelFormData(),
        getRombel().catch(() => ({ data: [] })),
        getSiswa()
      ]);
      const formData = resFormData.data?.data || resFormData.data || {};
      setKelasList(formData.kelas || formData.tingkat || []);
      setJurusanList(formData.jurusan || []);

      // Ambil daftar ID siswa yang belum punya rombel dari backend
      const unassignedSiswa = formData.siswa || [];
      const unassignedIds = new Set(unassignedSiswa.map(s => s.id));

      // Ambil data lengkap siswa (termasuk jurusan) dari API siswa
      const allSiswa = resSiswa.data?.data || resSiswa.data || [];
      
      // Filter: Hanya ambil siswa yang belum punya rombel (berdasarkan ID dari unassignedIds)
      const filteredUnassigned = allSiswa.filter(s => unassignedIds.has(s.id));
      
      setSiswaList(filteredUnassigned);

      // Simpan daftar rombel yang sudah ada untuk mengecek duplikasi
      const rombelData = resRombel.data?.data || resRombel.data || [];
      setExistingRombels(Array.isArray(rombelData) ? rombelData : []);
    } catch (err) {
      setFetchError("Gagal memuat data referensi.");
    } finally {
      setLoadingData(false);
    }
  };

  // Filter siswa berdasarkan Jurusan yang dipilih di form atau dari context (Lihat Semua)
  const filteredSiswa = useMemo(() => {
    let list = siswaList;

    // Filter berdasarkan jurusan: prioritaskan ctxJurusan (Lihat Semua), lalu form.jurusan_id
    const targetJurusanId = form.jurusan_id;
    const targetJurusanNama = ctxJurusan;

    if (targetJurusanNama) {
      // Mode Lihat Semua: Filter berdasarkan Nama Jurusan
      list = list.filter((s) => {
        const studentJurusan = typeof s.jurusan === 'string'
          ? s.jurusan
          : (s.jurusan?.nama || s.jurusan?.nama_jurusan || s.nama_jurusan || "");
        return studentJurusan === targetJurusanNama;
      });
    } else if (targetJurusanId) {
      // Mode Langsung: Filter berdasarkan ID Jurusan
      list = list.filter((s) => {
        const studentJurusanId = s.jurusan_id || s.jurusan?.id || s.id_jurusan;
        return String(studentJurusanId) === String(targetJurusanId);
      });
    }

    // Filter berdasarkan pencarian
    if (searchSiswa) {
      const q = searchSiswa.toLowerCase();
      list = list.filter((s) => {
        const nama = (s.nama_lengkap || s.nama || s.name || "").toLowerCase();
        const nis = (s.nis || "").toString().toLowerCase();
        return nama.includes(q) || nis.includes(q);
      });
    }
    return list;
  }, [siswaList, searchSiswa, ctxJurusan, form.jurusan_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const toggleSiswa = (id) => {
    setSelectedSiswa((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
    setErrors((prev) => ({ ...prev, siswa: "" }));
  };

  const selectAll = () => {
    const ids = filteredSiswa.map((s) => s.id);
    setSelectedSiswa((prev) => { const s = new Set(prev); ids.forEach((i) => s.add(i)); return [...s]; });
  };

  const deselectAll = () => {
    const ids = new Set(filteredSiswa.map((s) => s.id));
    setSelectedSiswa((prev) => prev.filter((i) => !ids.has(i)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!ctxRombelId) {
      if (!form.jurusan_id) errs.jurusan_id = "Jurusan wajib dipilih.";
      if (!form.kelas_id) errs.kelas_id = "Kelas wajib dipilih.";
    }
    if (selectedSiswa.length === 0) errs.siswa = "Pilih minimal 1 siswa.";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setIsSubmitting(true);
    setSubmitResult(null);
    try {
      // Jika sudah ada rombelId dari context (navigasi dari Lihat Semua), pakai langsung
      let targetRombelId = ctxRombelId || null;

      if (!targetRombelId) {
        // Jika navigasi tanpa context (langsung buka form), cek existing rombel
        const selectedKelas = kelasList.find(k => String(k.id) === String(form.kelas_id));
        const kelasNama = selectedKelas?.nama_kelas || selectedKelas?.nama || selectedKelas?.tingkat;

        const existing = existingRombels.find(r =>
          (r.tingkat === kelasNama) ||
          (r.kelas_id && String(r.kelas_id) === String(form.kelas_id))
        );

        if (existing) {
          targetRombelId = existing.rombel_id || existing.id;
        } else {
          const res = await createRombel({ kelas_id: form.kelas_id, jurusan_id: form.jurusan_id });
          targetRombelId = res.data?.data?.id || res.data?.id;
        }
      }

      // 2. Assign each siswa
      const success = [];
      const failed = [];
      for (const siswaId of selectedSiswa) {
        try {
          await assignSiswaToRombel(targetRombelId, siswaId);
          success.push(siswaId);
        } catch (err) {
          const siswa = siswaList.find((s) => s.id === siswaId);
          const nama = siswa?.nama_lengkap || siswa?.nama || `ID ${siswaId}`;
          failed.push({ siswaId, nama, message: err?.response?.data?.message || "Gagal" });
        }
      }

      if (failed.length === 0) {
        navigate("/anggota-kelas");
      } else {
        setSubmitResult({ success, failed });
        setSelectedSiswa(failed.map((f) => f.siswaId));
      }
    } catch (err) {
      setErrors({ general: err?.response?.data?.message || "Gagal membuat rombel." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="ml-64 px-10 py-12">
        <div className="mb-10">
          <h1 className="text-[28px] font-bold text-blue-600 uppercase tracking-wide">TAMBAH ANGGOTA KELAS</h1>
          <p className="mt-1 text-sm font-medium text-slate-400">Buat rombel baru dan daftarkan siswa</p>
        </div>

        {loadingData ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-16">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <p className="text-sm font-medium text-slate-500">Memuat data…</p>
          </div>
        ) : fetchError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
            <p className="font-semibold text-rose-700">{fetchError}</p>
            <button onClick={fetchDropdownData} className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white">Coba Lagi</button>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-100">
            <div className="mb-8 flex items-center gap-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h2 className="text-xl font-bold text-slate-800">Data Rombel &amp; Anggota</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{errors.general}</div>
              )}

              {submitResult && (
                <div className="space-y-2">
                  {submitResult.success.length > 0 && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                      ✅ {submitResult.success.length} siswa berhasil ditambahkan.
                    </div>
                  )}
                  {submitResult.failed.length > 0 && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                      <p className="text-sm font-semibold text-rose-700 mb-2">⚠️ {submitResult.failed.length} siswa gagal:</p>
                      <ul className="space-y-1">
                        {submitResult.failed.map((f) => (
                          <li key={f.siswaId} className="text-xs text-rose-600"><span className="font-bold">{f.nama}</span> — {f.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {ctxJurusan ? (
                <div className="rounded-xl bg-blue-50 px-4 py-3 flex flex-col gap-1">
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Kelas Tujuan</p>
                  <p className="text-sm font-bold text-blue-700">{ctxTingkat} — {ctxJurusan}</p>
                </div>
              ) : (
                /* Jika tidak ada context, tampilkan dropdown Jurusan & Kelas */
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-600">Pilih Jurusan <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <select name="jurusan_id" value={form.jurusan_id} onChange={handleChange}
                        className={`w-full appearance-none rounded-xl bg-blue-50/50 px-4 py-3.5 pr-10 text-sm text-slate-700 outline-none transition focus:bg-white focus:ring-2 ${errors.jurusan_id ? "ring-2 ring-rose-400" : "focus:ring-blue-500"}`}>
                        <option value="">Silakan pilih jurusan</option>
                        {jurusanList.map((j) => <option key={j.id} value={j.id}>{j.nama_jurusan || j.nama}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                    {errors.jurusan_id && <p className="mt-1.5 text-xs font-semibold text-rose-600">{errors.jurusan_id}</p>}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-600">Pilih Kelas <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <select name="kelas_id" value={form.kelas_id} onChange={handleChange}
                        className={`w-full appearance-none rounded-xl bg-blue-50/50 px-4 py-3.5 pr-10 text-sm text-slate-700 outline-none transition focus:bg-white focus:ring-2 ${errors.kelas_id ? "ring-2 ring-rose-400" : "focus:ring-blue-500"}`}>
                        <option value="">Silakan pilih kelas</option>
                        {kelasList.map((k) => <option key={k.id} value={k.id}>{k.tingkat || k.nama_kelas || k.nama}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                    {errors.kelas_id && <p className="mt-1.5 text-xs font-semibold text-rose-600">{errors.kelas_id}</p>}
                  </div>
                </div>
              )}

              {/* Pilih Siswa */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600">
                  Pilih Siswa <span className="text-rose-500">*</span>
                  {selectedSiswa.length > 0 && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">{selectedSiswa.length} dipilih</span>
                  )}
                </label>
                <div className="mb-3 flex items-center gap-3">
                  <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input type="text" value={searchSiswa} onChange={(e) => setSearchSiswa(e.target.value)} placeholder="Cari nama atau NIS…"
                      className="w-full rounded-xl bg-blue-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <button type="button" onClick={selectAll} className="whitespace-nowrap rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-100">Pilih Semua</button>
                  <button type="button" onClick={deselectAll} className="whitespace-nowrap rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200">Hapus Pilihan</button>
                </div>
                <div className={`max-h-72 overflow-y-auto rounded-xl border bg-white ${errors.siswa ? "border-rose-400" : "border-slate-200"}`}>
                  {filteredSiswa.length > 0 ? filteredSiswa.map((s) => {
                    const nama = s.nama_lengkap || s.nama || s.name || "-";
                    const nis = s.nis || "";
                    const checked = selectedSiswa.includes(s.id);
                    return (
                      <label key={s.id} className={`flex cursor-pointer items-center gap-3 border-b border-slate-50 px-4 py-3 transition hover:bg-blue-50/50 ${checked ? "bg-blue-50/70" : ""}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleSiswa(s.id)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-700 truncate">{nama}</p>
                          {nis && <p className="text-xs text-slate-400">NIS: {nis}</p>}
                        </div>
                        {checked && <svg className="h-4 w-4 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                      </label>
                    );
                  }) : <div className="py-8 text-center text-sm text-slate-400">Tidak ada siswa ditemukan.</div>}
                </div>
                {errors.siswa && <p className="mt-1.5 text-xs font-semibold text-rose-600">{errors.siswa}</p>}
              </div>

              {/* Actions */}
              <div className="mt-10 flex items-center justify-end gap-4">
                <button type="button" onClick={() => navigate("/anggota-kelas")} className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700" disabled={isSubmitting}>Batal</button>
                <button type="submit" disabled={isSubmitting} className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 hover:shadow-lg disabled:opacity-50">
                  {isSubmitting ? "Menyimpan..." : "Buat Rombel & Tambah Siswa"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
