import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, getRegisterForm } from "../services/authService";
import Sidebar from "../components/Sidebar";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    nama: "",
    password: "",
    password_confirmation: "",
    role: "",
    mapel_id: "",
    jenis_kelamin: "",
    rombel_id: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [optionsMapel, setOptionsMapel] = useState([]);
  const [optionsRombel, setOptionsRombel] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getRegisterForm();
        const data = res.data?.data || res.data || {};

        // Sesuaikan dengan struktur JSON dari backend /register-form
        setOptionsMapel(data.mata_pelajaran || []);
        setOptionsRombel(data.rombel || []);
      } catch (e) {
        console.error("Fetch register form data error:", e);
      }
    };
    fetchData();
  }, []);

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
    if (form.password !== form.password_confirmation) {
      setMessage("Password tidak cocok dengan konfirmasi password");
      setLoading(false);
      return;
    }

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
      if (payload.role === "guru" || payload.role === "admin") {
        delete payload.rombel_id;
        delete payload.jurusan_id;
        delete payload.kelas_id;
      } else if (payload.role === "siswa") {
        delete payload.mapel_id;
      }

      const res = await registerUser(payload);
      const successMessage = res.data?.message || "Register berhasil!";
      navigate("/data-pengguna", { state: { successMessage } });
    } catch (err) {
      let displayMessage = "Register gagal 😢";

      if (err.response) {
        const data = err.response.data;
        if (err.response.status === 422 && data.errors) {
          // Gabungkan semua pesan error validasi Laravel menjadi satu string
          displayMessage = Object.values(data.errors).flat().join(" | ");
        } else {
          displayMessage = data.message || data.error || "Terjadi kesalahan pada data (422)";
        }
      } else if (err.message === "Network Error") {
        displayMessage = "Network error: Periksa koneksi atau backend server.";
      }

      setMessage(displayMessage);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-xl bg-blue-50/50 px-4 py-3.5 text-sm text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500";
  const labelClass = "mb-2 block text-sm font-semibold text-slate-600 uppercase";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar />

      <main className="ml-64 flex-1 p-10 flex flex-col items-center">
        <div className="w-full max-w-3xl">
          {/* Header Section */}
          <div className="mb-10">
            <h1 className="text-[28px] font-bold text-blue-600 uppercase tracking-wide">Buat Akun Baru</h1>
            <p className="mt-1 text-sm font-medium text-slate-400">
              Lengkapi formulir di bawah ini untuk mendaftarkan pengguna baru ke sistem akademik.<br />
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
            <br></br>

            <form className="space-y-6" onSubmit={handleSubmit}>
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
              <div>
                <label className={labelClass}>Jenis Kelamin</label>
                <div className="relative">
                  <select
                    name="jenis_kelamin"
                    value={form.jenis_kelamin}
                    onChange={handleChange}
                    className={`${inputClass} appearance-none pr-10`}
                  >
                    <option value="">Silakan pilih jenis kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>


              {/* SANDI */}
              <div>
                <label className={labelClass}>SANDI</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className={inputClass}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium italic">Kata Sandi Minimal 6 Karakter</p>
              </div>

              {/* KONFIRMASI SANDI */}
              <div>
                <label className={labelClass}>KONFIRMASI SANDI</label>
                <div className="relative">
                  <input
                    name="password_confirmation"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password_confirmation}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className={inputClass}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* ROLE */}
              <div>
                <label className={labelClass}>ROLE</label>
                <div className="relative">
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className={`${inputClass} appearance-none pr-10`}
                  >
                    <option value="">Silahkan Pilih Role</option>
                    <option value="siswa">Siswa</option>
                    <option value="guru">Guru</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {/* Kondisi Khusus Siswa: Rombel/Kelas */}
              {form.role === "siswa" && (
                <div className="space-y-6">
                  <div>
                    <label className={labelClass}>ROMBEL / KELAS</label>
                    <div className="relative">
                      <select
                        name="rombel_id"
                        value={form.rombel_id}
                        onChange={handleChange}
                        className={`${inputClass} appearance-none pr-10`}
                        required
                      >
                        <option value="">Silakan pilih rombel</option>
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
                  {loading ? "Memproses..." : "Buat Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
