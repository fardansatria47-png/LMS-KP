import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getRombelById, updateRombel, getRombelFormData } from "../services/authService";

export default function EditAnggotaKelas() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({ kelas_id: "", jurusan_id: "", tahun_ajaran: "" });
  const [kelasList, setKelasList] = useState([]);
  const [jurusanList, setJurusanList] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState({});
  const [fetchError, setFetchError] = useState("");

  useEffect(() => { fetchAllData(); }, [id]);

  const fetchAllData = async () => {
    setLoadingData(true);
    setFetchError("");
    try {
      const [resRombel, resFormData] = await Promise.all([
        getRombelById(id),
        getRombelFormData(),
      ]);
      let data = resRombel.data?.data || resRombel.data || {};
      
      // Jika backend secara keliru mengembalikan array (atau kita butuh mengekstrak objectnya)
      if (Array.isArray(data)) {
        data = data.find(r => String(r.id) === String(id)) || data[0] || {};
      }

      const formData = resFormData.data?.data || resFormData.data || {};
      
      const kelasData = formData.kelas || formData.tingkat || [];
      const jurusanData = formData.jurusan || [];

      // Ekstrak nama jurusan dari backend (bisa berupa string atau object)
      let backendJurusanName = "";
      if (typeof data.nama_jurusan === 'string') backendJurusanName = data.nama_jurusan;
      else if (typeof data.jurusan === 'string') backendJurusanName = data.jurusan;
      else if (data.jurusan && typeof data.jurusan === 'object') backendJurusanName = data.jurusan.nama_jurusan || data.jurusan.nama || "";

      // Ekstrak nama tingkat/kelas dari backend (bisa berupa string atau object)
      let backendKelasName = "";
      if (typeof data.tingkat === 'string') backendKelasName = data.tingkat;
      else if (data.tingkat && typeof data.tingkat === 'object') backendKelasName = data.tingkat.nama_kelas || data.tingkat.tingkat || data.tingkat.nama || "";
      else if (typeof data.kelas === 'string') backendKelasName = data.kelas;
      else if (data.kelas && typeof data.kelas === 'object') backendKelasName = data.kelas.nama_kelas || data.kelas.tingkat || data.kelas.nama || "";

      // Cari ID berdasarkan nama
      const foundJurusan = jurusanData.find(j => 
        (j.nama || j.nama_jurusan || "").toLowerCase().trim() === backendJurusanName.toLowerCase().trim()
      );
      const foundKelas = kelasData.find(k => 
        (k.nama_kelas || k.nama || k.tingkat || "").toLowerCase().trim() === backendKelasName.toLowerCase().trim()
      );

      // Gunakan ID asli dari backend jika ada, jika tidak gunakan hasil pencarian
      setForm({
        kelas_id: String(data.kelas_id || foundKelas?.id || ""),
        jurusan_id: String(data.jurusan_id || foundJurusan?.id || ""),
        tahun_ajaran: String(data.tahun_ajaran || ""),
      });
      
      setKelasList(kelasData);
      setJurusanList(jurusanData);

    } catch (err) {
      setFetchError(err?.response?.data?.message || "Gagal memuat data.");
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "jurusan_id") setForm((prev) => ({ ...prev, jurusan_id: value, kelas_id: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.kelas_id) errs.kelas_id = "Kelas wajib dipilih.";
    if (!form.jurusan_id) errs.jurusan_id = "Jurusan wajib dipilih.";
    if (!form.tahun_ajaran) errs.tahun_ajaran = "Tahun Ajaran wajib diisi.";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      await updateRombel(id, {
        kelas_id: form.kelas_id,
        jurusan_id: form.jurusan_id,
        tahun_ajaran: form.tahun_ajaran,
      });
      navigate("/anggota-kelas");
    } catch (err) {
      const apiErrors = err?.response?.data?.errors || {};
      if (Object.keys(apiErrors).length > 0) {
        const mapped = {};
        Object.keys(apiErrors).forEach((k) => (mapped[k] = apiErrors[k][0]));
        setErrors(mapped);
      } else {
        setErrors({ general: err?.response?.data?.message || "Gagal mengupdate rombel." });
      }
    } finally {
      setLoading(false);
    }
  };

  const SelectField = ({ label, name, value, options, required, error, renderOption }) => (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-600">{label} {required && <span className="text-rose-500">*</span>}</label>
      <div className="relative">
        <select name={name} value={value} onChange={handleChange}
          className={`w-full appearance-none rounded-xl bg-blue-50/50 px-4 py-3.5 pr-10 text-sm text-slate-700 outline-none transition focus:bg-white focus:ring-2 ${error ? "ring-2 ring-rose-400" : "focus:ring-blue-500"}`}>
          <option value="">Silakan pilih {label.toLowerCase()}</option>
          {options.map(renderOption)}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs font-semibold text-rose-600">{error}</p>}
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="ml-64 px-10 py-12">
        <div className="mb-10">
          <h1 className="text-[28px] font-bold text-blue-600 uppercase tracking-wide">EDIT ROMBEL / KELAS</h1>
          <p className="mt-1 text-sm font-medium text-slate-400">Ubah data rombongan belajar</p>
        </div>

        {loadingData ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-16">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <p className="text-sm font-medium text-slate-500">Memuat data…</p>
          </div>
        ) : fetchError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
            <p className="font-semibold text-rose-700">{fetchError}</p>
            <button onClick={fetchAllData} className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">Coba Lagi</button>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-100">
            <div className="mb-8 flex items-center gap-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h2 className="text-xl font-bold text-slate-800">Informasi Rombel</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{errors.general}</div>
              )}

              <SelectField label="Jurusan" name="jurusan_id" value={form.jurusan_id} options={jurusanList} required error={errors.jurusan_id}
                renderOption={(j) => <option key={j.id} value={String(j.id)}>{j.nama || j.nama_jurusan}</option>} />

              <SelectField label="Kelas" name="kelas_id" value={form.kelas_id} options={kelasList} required error={errors.kelas_id}
                renderOption={(k) => <option key={k.id} value={String(k.id)}>{k.nama_kelas || k.nama || k.tingkat}</option>} />

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600">Tahun Ajaran <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  name="tahun_ajaran"
                  value={form.tahun_ajaran}
                  onChange={handleChange}
                  placeholder="Misal: 2026/2027"
                  className={`w-full appearance-none rounded-xl bg-blue-50/50 px-4 py-3.5 text-sm text-slate-700 outline-none transition focus:bg-white focus:ring-2 ${errors.tahun_ajaran ? "ring-2 ring-rose-400" : "focus:ring-blue-500"}`}
                />
                {errors.tahun_ajaran && <p className="mt-1.5 text-xs font-semibold text-rose-600">{errors.tahun_ajaran}</p>}
              </div>

              <div className="mt-10 flex items-center justify-end gap-4">
                <button type="button" onClick={() => navigate("/anggota-kelas")} className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700" disabled={loading}>Batal</button>
                <button type="submit" disabled={loading} className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 hover:shadow-lg disabled:opacity-50">
                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
