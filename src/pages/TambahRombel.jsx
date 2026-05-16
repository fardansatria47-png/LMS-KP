import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { createRombel, getRombelFormData } from "../services/authService";
import { toast } from "../utils/notify";

export default function TambahRombel() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    kelas_id: "",
    jurusan_id: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optionsJurusan, setOptionsJurusan] = useState([]);
  const [optionsKelas, setOptionsKelas] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await getRombelFormData();
        const data = res.data?.data || res.data || {};
        
        setOptionsJurusan(data.jurusan || []);
        setOptionsKelas(data.kelas || data.tingkat || []);
      } catch (e) {
        console.error("Gagal mengambil form data rombel:", e);
      }
    };
    fetchOptions();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.kelas_id || !formData.jurusan_id) {
      toast("Harap lengkapi semua data!", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await createRombel({
        kelas_id: formData.kelas_id,
        tingkat: formData.kelas_id,
        jurusan_id: formData.jurusan_id,
      });
      navigate("/anggota-kelas");
    } catch (error) {
      toast(error?.response?.data?.message || "Gagal membuat kelas/rombel", "error");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <div className="lg:ml-64 px-4 sm:px-6 lg:px-10 pt-16 pb-24 lg:py-12">
        <div className="mb-10">
          <h1 className="text-[28px] font-bold text-blue-600 uppercase tracking-wide">TAMBAH KELAS</h1>
          <p className="mt-1 text-sm font-medium text-slate-400">Buat data rombongan belajar baru</p>
        </div>

        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-100">
          <div className="mb-8 flex items-center gap-3">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h2 className="text-xl font-bold text-slate-800">Informasi Kelas</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">Jurusan</label>
              <div className="relative">
                <select
                  name="jurusan_id"
                  value={formData.jurusan_id}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-xl bg-blue-50/50 px-4 py-3.5 pr-10 text-sm text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Silakan pilih jurusan</option>
                  {optionsJurusan.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nama || item.nama_jurusan}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">Tingkat / Kelas</label>
              <div className="relative">
                <select
                  name="kelas_id"
                  value={formData.kelas_id}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-xl bg-blue-50/50 px-4 py-3.5 pr-10 text-sm text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Silakan pilih tingkat/kelas</option>
                  {optionsKelas.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nama || item.tingkat || item.nama_kelas}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>



            <div className="mt-10 flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate("/anggota-kelas")}
                className="px-6 py-3 text-sm font-bold text-slate-500 transition hover:text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 hover:shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? "Menyimpan..." : "Buat Kelas"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
