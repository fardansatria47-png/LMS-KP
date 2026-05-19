import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMapelById, updateMapel, getMapelFormData } from "../services/authService";
import Sidebar from "../components/Sidebar";
import { getErrorMessage } from "../utils/translateError";

export default function EditMataPelajaran() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nama_mapel: "",
    kode_mapel: "",
    deskripsi: "",
    jurusan_id: "",
    kelas_id: "",
  });

  const [selectedGuruIds, setSelectedGuruIds] = useState([]);
  const [selectedRombelIds, setSelectedRombelIds] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [optionsJurusan, setOptionsJurusan] = useState([]);
  const [optionsKelas, setOptionsKelas] = useState([]);
  const [optionsGuru, setOptionsGuru] = useState([]);
  const [optionsRombel, setOptionsRombel] = useState([]);

  const [guruSearch, setGuruSearch] = useState("");
  const [rombelSearch, setRombelSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resMapel, resFormData] = await Promise.all([
          getMapelById(id),
          getMapelFormData(),
        ]);

        const fd = resFormData.data?.data || resFormData.data || {};
        setOptionsJurusan(Array.isArray(fd.jurusan) ? fd.jurusan : []);
        setOptionsKelas(Array.isArray(fd.kelas) ? fd.kelas : []);
        setOptionsGuru(Array.isArray(fd.guru) ? fd.guru : []);
        setOptionsRombel(Array.isArray(fd.rombel) ? fd.rombel : []);

        const mapelData = resMapel.data?.data || resMapel.data;
        if (mapelData) {
          setForm({
            nama_mapel: mapelData.nama_mapel || "",
            kode_mapel: mapelData.kode_mapel || "",
            deskripsi: mapelData.deskripsi || "",
            jurusan_id: mapelData.jurusan_id || "",
            kelas_id: mapelData.kelas_id || "",
          });
          if (Array.isArray(mapelData.gurus)) {
            setSelectedGuruIds(mapelData.gurus.map((g) => g.id));
          }
          if (Array.isArray(mapelData.rombels)) {
            setSelectedRombelIds(mapelData.rombels.map((r) => r.id));
          }
        }
      } catch (err) {
        console.error("Gagal mengambil data:", err);
        setMessage(getErrorMessage(err, "Gagal memuat data."));
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleGuru = (gid) =>
    setSelectedGuruIds((prev) =>
      prev.includes(gid) ? prev.filter((x) => x !== gid) : [...prev, gid]
    );

  const toggleRombel = (rid) =>
    setSelectedRombelIds((prev) =>
      prev.includes(rid) ? prev.filter((x) => x !== rid) : [...prev, rid]
    );

  const filteredGuru = optionsGuru.filter((g) =>
    (g.nama_lengkap || g.nama || g.name || "").toLowerCase().includes(guruSearch.toLowerCase())
  );

  const filteredRombel = optionsRombel.filter((r) =>
    (r.nama_rombel || r.nama || "").toLowerCase().includes(rombelSearch.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      await updateMapel(id, {
        ...form,
        guru_ids: selectedGuruIds,
        rombel_ids: selectedRombelIds,
      });
      navigate("/mata-pelajaran");
    } catch (err) {
      setMessage(getErrorMessage(err, "Gagal memperbarui data."));
    } finally {
      setLoading(false);
    }
  };

  // ── Sub-components ─────────────────────────────────────────────
  const SelectWrapper = ({ children }) => (
    <div className="relative">
      {children}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );

  const MultiSelectContainer = ({ title, search, setSearch, filteredItems, selectedIds, toggleFn, labelKey, placeholder, allOptions }) => (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-600">
        {title}
        <span className="ml-1 text-xs font-normal text-slate-400">(opsional, bisa lebih dari satu)</span>
      </label>

      {selectedIds.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedIds.map((sid) => {
            const item = allOptions.find((x) => x.id === sid);
            if (!item) return null;
            const nama = item[labelKey] || item.nama || item.name || "Item";
            return (
              <span key={sid} className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                {nama}
                <button type="button" onClick={() => toggleFn(sid)} className="ml-0.5 text-blue-500 hover:text-blue-900">✕</button>
              </span>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-blue-50/50 overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-200 bg-white">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full text-sm text-slate-700 outline-none bg-transparent"
          />
        </div>
        <div className="max-h-44 overflow-y-auto divide-y divide-slate-100">
          {filteredItems.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">{search ? "Data tidak ditemukan" : "Belum ada data"}</p>
          ) : (
            filteredItems.map((item) => {
              const nama = item[labelKey] || item.nama || item.name || "Item";
              const isChecked = selectedIds.includes(item.id);
              return (
                <label key={item.id} className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-blue-50 ${isChecked ? "bg-blue-50/80" : ""}`}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleFn(item.id)}
                    className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-700">{nama}</span>
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <div className="lg:ml-64 px-4 sm:px-6 lg:px-10 pt-16 pb-24 lg:py-12">
        <div className="mb-10">
          <h1 className="text-[28px] font-bold text-blue-600 uppercase tracking-wide">EDIT MATA PELAJARAN</h1>
          <p className="mt-1 text-sm font-medium text-slate-400">Perbarui data mata pelajaran</p>
        </div>

        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-100">
          <div className="mb-8 flex items-center gap-3">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h2 className="text-xl font-bold text-slate-800">Informasi Mata Pelajaran</h2>
          </div>

          {fetching ? (
            <div className="flex flex-col items-center justify-center p-16">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              <p className="text-sm font-medium text-slate-500">Memuat data…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nama */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600">Mata Pelajaran</label>
                <input
                  type="text"
                  name="nama_mapel"
                  value={form.nama_mapel}
                  onChange={handleChange}
                  placeholder="Masukan Nama Mata Pelajaran"
                  className="w-full rounded-xl bg-blue-50/50 px-4 py-3.5 text-sm text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Kode */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600">Kode Mata Pelajaran</label>
                <input
                  type="text"
                  name="kode_mapel"
                  value={form.kode_mapel}
                  onChange={handleChange}
                  placeholder="Kode Mata Pelajaran"
                  className="w-full rounded-xl bg-blue-50/50 px-4 py-3.5 text-sm text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600">Deskripsi</label>
                <textarea
                  name="deskripsi"
                  value={form.deskripsi}
                  onChange={handleChange}
                  placeholder="Tambahkan Deskripsi (Opsional)"
                  rows="3"
                  className="w-full rounded-xl bg-blue-50/50 px-4 py-3.5 text-sm text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Guru */}
              <MultiSelectContainer
                title="Guru Pengajar"
                search={guruSearch}
                setSearch={setGuruSearch}
                filteredItems={filteredGuru}
                selectedIds={selectedGuruIds}
                toggleFn={toggleGuru}
                labelKey="nama_lengkap"
                placeholder="Cari nama guru..."
                allOptions={optionsGuru}
              />

              {/* Rombel */}
              <MultiSelectContainer
                title="Assign ke Rombel"
                search={rombelSearch}
                setSearch={setRombelSearch}
                filteredItems={filteredRombel}
                selectedIds={selectedRombelIds}
                toggleFn={toggleRombel}
                labelKey="nama_rombel"
                placeholder="Cari nama rombel (misal: X-RPL-1)..."
                allOptions={optionsRombel}
              />

              {message && <p className="text-sm text-rose-600 font-medium text-center">{message}</p>}

              {/* Actions */}
              <div className="mt-10 flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => navigate("/mata-pelajaran")}
                  className="px-6 py-3 text-sm font-bold text-slate-500 transition hover:text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 hover:shadow-lg disabled:opacity-50"
                >
                  {loading && (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
