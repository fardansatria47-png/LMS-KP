import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { getSiswaById, getGuruById, updateSiswa, updateGuru, getRegisterForm } from "../services/authService";
import Sidebar from "../components/Sidebar";
import { getErrorMessage } from "../utils/translateError";

export default function EditUser() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Dapatkan role dari state navigasi sebelumnya (dikirim dari tombol Edit)
  const roleFromState = location.state?.role || "siswa";

  const [form, setForm] = useState({ 
    username: "", 
    nama: "", 
    role: roleFromState,
    mapel_id: "",
    rombel_id: ""
  });
  
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [optionsMapel, setOptionsMapel] = useState([]);
  const [optionsRombel, setOptionsRombel] = useState([]);

  // Ambil data pengguna + referensi dari backend saat halaman dimuat
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resUser, resForm] = await Promise.all([
          roleFromState === "guru" ? getGuruById(id) : getSiswaById(id),
          getRegisterForm()
        ]);

        const formData = resForm.data?.data || resForm.data || {};
        setOptionsMapel(formData.mata_pelajaran || []);
        setOptionsRombel(formData.rombel || []);

        const userData = resUser.data?.data || resUser.data;
        
        if (userData) {
          setForm({
            username: userData.nis || userData.nik || userData.username || "",
            nama: userData.nama_lengkap || userData.nama || userData.name || "",
            role: roleFromState,
            mapel_id: userData.mapel_id || "",
            rombel_id: userData.rombel_id || (userData.anggota_kelas?.[0]?.rombel_id) || ""
          });
        }
      } catch (err) {
        console.error("Gagal mengambil data:", err);
        setMessage(getErrorMessage(err, "Gagal memuat data pengguna."));
      }
    };

    fetchData();
  }, [id, roleFromState]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    // Frontend validation

    if (form.username.length < 3) {
      setMessage("NIS/NIK minimal 3 karakter");
      setLoading(false);
      return;
    }

    if (form.nama.length < 3) {
      setMessage("Nama minimal 3 karakter");
      setLoading(false);
      return;
    }

    try {
      const payload = { ...form };
      if (payload.role === "guru") {
        delete payload.rombel_id;
      } else if (payload.role === "siswa") {
        delete payload.mapel_id;
      }

      const res = roleFromState === "guru" ? await updateGuru(id, payload) : await updateSiswa(id, payload);

      const successMessage = res.data?.message || "Data berhasil diperbarui!";
      navigate("/data-pengguna", { state: { successMessage } });
    } catch (err) {
      setMessage(getErrorMessage(err, "Gagal memperbarui data. Periksa kembali isian Anda."));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-xl bg-blue-50/50 px-4 py-3.5 text-sm text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500";
  const labelClass = "mb-2 block text-sm font-semibold text-slate-600 uppercase";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar />

      <main className="lg:ml-64 flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-10 flex flex-col items-center">
        <div className="w-full max-w-3xl">
          {/* Header Section */}
          <div className="mb-10">
            <h1 className="text-[28px] font-bold text-blue-600 uppercase tracking-wide">Edit Akun</h1>
            <p className="mt-1 text-sm font-medium text-slate-400">
              Perbarui formulir di bawah ini untuk mengedit data pengguna yang sudah terdaftar.<br/>
              Pastikan semua data yang dimasukkan sudah benar dan sesuai dokumen resmi.
            </p>
          </div>

          {/* Form Card */}
          <div className="mx-auto w-full rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-100">
            <div className="mb-8 flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C9.243 2 7 4.243 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.757-2.243-5-5-5zm-3 5c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7zm3 10a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
              <h2 className="text-xl font-bold text-slate-800">Informasi Akun</h2>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* NIK / NIS */}
              <div>
                <label className={labelClass}>NIK / NIS</label>
                <input
                  name="username"
                  placeholder="Contoh: 2023001"
                  value={form.username}
                  onChange={handleChange}
                  required
                  minLength={3}
                  maxLength={255}
                  className={inputClass}
                />
              </div>

              {/* NAMA */}
              <div>
                <label className={labelClass}>NAMA</label>
                <input
                  name="nama"
                  placeholder="Masukkan Nama Lengkap"
                  value={form.nama}
                  onChange={handleChange}
                  required
                  minLength={3}
                  maxLength={100}
                  className={inputClass}
                />
              </div>

              {/* Kondisi Khusus Siswa: Rombel */}
              {form.role === "siswa" && (
                <div>
                  <label className={labelClass}>ROMBEL / KELAS</label>
                  <div className="relative">
                    <select
                      name="rombel_id"
                      value={form.rombel_id}
                      onChange={handleChange}
                      className={`${inputClass} appearance-none pr-10`}
                    >
                      <option value="">Tidak ada rombel</option>
                      {optionsRombel.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nama_rombel || `${item.kelas?.tingkat || item.tingkat} - ${item.jurusan?.nama_jurusan || item.jurusan?.nama || item.nama_jurusan}`}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Kondisi Khusus Guru: Mata Pelajaran */}
              {form.role === "guru" && (
                <div className="space-y-6">
                  <div>
                    <label className={labelClass}>MATA PELAJARAN</label>
                    <div className="relative">
                      <select
                        name="mapel_id"
                        value={form.mapel_id}
                        onChange={handleChange}
                        className={`${inputClass} appearance-none pr-10`}
                      >
                        <option value="">Silakan pilih mata pelajaran</option>
                        {optionsMapel.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.nama || item.nama_mapel}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {message && <p className="text-sm text-rose-600 font-medium">{message}</p>}

              {/* Buttons */}
              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate("/data-pengguna")}
                  className="px-8 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 rounded-xl bg-[#0047df] text-white font-bold text-sm hover:bg-blue-800 transition disabled:opacity-70 flex items-center gap-2 shadow-md shadow-blue-200"
                >
                  {loading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {loading ? "Memproses..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
