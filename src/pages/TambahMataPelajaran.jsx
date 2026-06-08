import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { createMapel, getMapelFormData, assignMapelToGuru, assignMapelToRombel, getGuruByMapelRoute, getRombelMapel } from "../services/authService";
import { toast } from "../utils/notify";

export default function TambahMataPelajaran() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nama: "",
    kode: "",
    konfirmasiKode: "",
    deskripsi: "",
    jurusan_id: "",
    kelas_id: "",
  });
  const [selectedGuruIds, setSelectedGuruIds] = useState([]);
  const [selectedRombelIds, setSelectedRombelIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optionsJurusan, setOptionsJurusan] = useState([]);
  const [optionsKelas, setOptionsKelas] = useState([]);
  const [optionsGuru, setOptionsGuru] = useState([]);
  const [optionsRombel, setOptionsRombel] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  
  const [guruSearch, setGuruSearch] = useState("");
  const [rombelSearch, setRombelSearch] = useState("");

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await getMapelFormData();
        const data = res.data?.data || res.data || {};
        setOptionsJurusan(Array.isArray(data.jurusan) ? data.jurusan : []);
        setOptionsKelas(Array.isArray(data.kelas) ? data.kelas : []);
        setOptionsGuru(Array.isArray(data.guru) ? data.guru : []);
        setOptionsRombel(Array.isArray(data.rombel) ? data.rombel : []);
      } catch (e) {
        console.error("Gagal mengambil data referensi:", e);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleGuru = (guruId) => {
    setSelectedGuruIds((prev) =>
      prev.includes(guruId) ? prev.filter((id) => id !== guruId) : [...prev, guruId]
    );
  };

  const toggleRombel = (rombelId) => {
    setSelectedRombelIds((prev) =>
      prev.includes(rombelId) ? prev.filter((id) => id !== rombelId) : [...prev, rombelId]
    );
  };

  const filteredGuru = optionsGuru.filter((g) => {
    const nama = (g.nama_lengkap || g.nama || g.name || "").toLowerCase();
    return nama.includes(guruSearch.toLowerCase());
  });

  const filteredRombel = optionsRombel.filter((r) => {
    const nama = (r.nama_rombel || r.nama || "").toLowerCase();
    return nama.includes(rombelSearch.toLowerCase());
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.kode !== formData.konfirmasiKode) {
      toast("Kode Mata Pelajaran dan Konfirmasi Kode tidak cocok!", "warning");
      return;
    }
    if (!formData.nama || !formData.kode) {
      toast("Harap lengkapi semua data!", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createMapel({
        nama_mapel: formData.nama,
        kode_mapel: formData.kode,
        deskripsi: formData.deskripsi,
        jurusan_id: formData.jurusan_id || null,
        kelas_id: formData.kelas_id || null,
        guru_ids: selectedGuruIds,
        rombel_ids: selectedRombelIds,
      });

      const newMapelId = res.data?.data?.id || res.data?.id;
      if (newMapelId) {
        if (selectedGuruIds && selectedGuruIds.length > 0) {
          await Promise.all(selectedGuruIds.map(async (guruId) => {
            try {
              const existingRes = await getGuruByMapelRoute(guruId);
              const existingMapels = existingRes.data?.data?.mapel || [];
              const existingIds = existingMapels.map(m => m.id);
              if (!existingIds.includes(newMapelId)) {
                await assignMapelToGuru(guruId, [...existingIds, newMapelId]);
              }
            } catch (err) {
              console.error("Gagal assign guru:", err);
            }
          }));
        }
        if (selectedRombelIds && selectedRombelIds.length > 0) {
          await Promise.all(selectedRombelIds.map(async (rombelId) => {
            try {
              const existingRes = await getRombelMapel(rombelId);
              const existingMapels = existingRes.data?.data || existingRes.data || [];
              const existingIds = Array.isArray(existingMapels) ? existingMapels.map(m => m.id) : [];
              if (!existingIds.includes(newMapelId)) {
                await assignMapelToRombel(rombelId, [...existingIds, newMapelId]);
              }
            } catch (err) {
              console.error("Gagal assign rombel:", err);
            }
          }));
        }
      }

      navigate("/mata-pelajaran");
    } catch (error) {
      toast(error?.response?.data?.message || "Gagal membuat mata pelajaran", "error");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const MultiSelectContainer = ({ title, search, setSearch, filteredItems, selectedIds, toggleFn, labelKey, placeholder }) => (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-600">
        {title}
        <span className="ml-1 text-xs font-normal text-slate-400">(opsional, bisa lebih dari satu)</span>
      </label>

      {/* Selected badges */}
      {selectedIds.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedIds.map((id) => {
            const item = optionsGuru.concat(optionsRombel).find((x) => x.id === id);
            if (!item) return null;
            const nama = item[labelKey] || item.nama || item.name || "Item";
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700"
              >
                {nama}
                <button
                  type="button"
                  onClick={() => toggleFn(id)}
                  className="ml-0.5 text-blue-500 hover:text-blue-900"
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Search + list */}
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
          {loadingOptions ? (
            <p className="px-4 py-3 text-sm text-slate-400">Memuat data...</p>
          ) : filteredItems.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">
              {search ? "Data tidak ditemukan" : "Belum ada data"}
            </p>
          ) : (
            filteredItems.map((item) => {
              const nama = item[labelKey] || item.nama || item.name || "Item";
              const isChecked = selectedIds.includes(item.id);
              return (
                <label
                  key={item.id}
                  className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-blue-50 ${isChecked ? "bg-blue-50/80" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleFn(item.id)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600"
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

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <div className="lg:ml-64 px-4 sm:px-6 lg:px-10 pt-16 pb-24 lg:py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-[28px] font-bold text-blue-600 uppercase tracking-wide">TAMBAH MATA PELAJARAN</h1>
          <p className="mt-1 text-sm font-medium text-slate-400">Manajemen mata pelajaran</p>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-100">
          <div className="mb-8 flex items-center gap-3">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h2 className="text-xl font-bold text-slate-800">Informasi Mata Pelajaran</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nama */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">Mata Pelajaran</label>
              <input
                type="text"
                name="nama"
                value={formData.nama}
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
                name="kode"
                value={formData.kode}
                onChange={handleChange}
                placeholder="Buat Kode Mata Pelajaran"
                className="w-full rounded-xl bg-blue-50/50 px-4 py-3.5 text-sm text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Konfirmasi Kode */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">Konfirmasi Kode Mata Pelajaran</label>
              <input
                type="text"
                name="konfirmasiKode"
                value={formData.konfirmasiKode}
                onChange={handleChange}
                placeholder="Masukan Kembali Kode Mata Pelajaran"
                className="w-full rounded-xl bg-blue-50/50 px-4 py-3.5 text-sm text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Deskripsi */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">Deskripsi</label>
              <textarea
                name="deskripsi"
                value={formData.deskripsi}
                onChange={handleChange}
                placeholder="Tambahkan Deskripsi (Opsional)"
                rows="3"
                className="w-full rounded-xl bg-blue-50/50 px-4 py-3.5 text-sm text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>




            {/* Guru Pengajar */}
            <MultiSelectContainer 
              title="Guru Pengajar"
              search={guruSearch}
              setSearch={setGuruSearch}
              filteredItems={filteredGuru}
              selectedIds={selectedGuruIds}
              toggleFn={toggleGuru}
              labelKey="nama_lengkap"
              placeholder="Cari nama guru..."
            />

            {/* Rombel (Kelas Spesifik) */}
            <MultiSelectContainer 
              title="Assign ke Rombel"
              search={rombelSearch}
              setSearch={setRombelSearch}
              filteredItems={filteredRombel}
              selectedIds={selectedRombelIds}
              toggleFn={toggleRombel}
              labelKey="nama_rombel"
              placeholder="Cari nama rombel (misal: X-RPL-1)..."
            />

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
                disabled={isSubmitting}
                className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 hover:shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? "Menyimpan..." : "Buat Mata Pelajaran"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
