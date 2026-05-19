import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getTugasSiswaDetail, submitTugasSiswa, batalkanPengumpulanSiswa } from "../services/authService";
import { fixFileUrl } from "../api/api";
import { getErrorMessage } from "../utils/translateError";
import { toast, confirmDialog } from "../utils/notify";
import SiswaLayout from "../components/SiswaLayout";



export default function SiswaTugasDetail() {
  const { id, tugasId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [tugas, setTugas] = useState(location.state?.tugas || null);
  const [mapelName, setMapelName] = useState(location.state?.mapelName || "Mata Pelajaran");
  const [kelasName, setKelasName] = useState(location.state?.kelasName || "Kelas");
  const [guruName, setGuruName] = useState(location.state?.guruName || "Guru Pengajar");

  const [statusPengumpulan, setStatusPengumpulan] = useState(null); // Menampung status pengumpulan
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  useEffect(() => {
    const fetchTugasDetail = async () => {
      try {
        setLoading(true);
        // Panggil endpoint untuk detail tugas
        const res = await getTugasSiswaDetail(tugasId);
        const dataTugas = res.data?.data || res.data;
        
        if (dataTugas) {
          const actualTugas = dataTugas.tugas || dataTugas;
          setTugas(actualTugas);
          // Backend mengirimkan status_pengerjaan di dalam tugas atau di level root
          setStatusPengumpulan(dataTugas.pengumpulan || dataTugas.status_pengumpulan || null);
          
          if (actualTugas.nama_mapel) setMapelName(actualTugas.nama_mapel);
          if (actualTugas.kelas) setKelasName(actualTugas.kelas);
          if (actualTugas.guru) setGuruName(actualTugas.guru);
        }
        
      } catch (err) {
        console.error("Gagal memuat detail tugas:", err);
        setError(getErrorMessage(err, "Gagal memuat detail tugas."));
      } finally {
        setLoading(false);
      }
    };
    
    fetchTugasDetail();
  }, [tugasId]);

  // Status dari backend berdasarkan status_pengerjaan
  // Backend mengirimkan: "Sudah Mengumpulkan" | "Belum Mengumpulkan" | "Terlambat"

  const handleLogout = async () => {
    const ok = await confirmDialog("Yakin ingin logout?", { isDanger: true, title: "Logout" });
    if (ok) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Optional: cek tipe dan ukuran (misal max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast("Ukuran file maksimal 10MB", "warning");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast("Ukuran file maksimal 10MB", "warning");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast("Pilih file jawaban terlebih dahulu!", "warning");
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("tugas_id", tugasId);
      formData.append("file", selectedFile);

      await submitTugasSiswa(formData);
      toast("Tugas berhasil dikumpulkan!", "success");
      
      // Refresh detail untuk melihat status baru
      const res = await getTugasSiswaDetail(tugasId);
      const dataTugas = res.data?.data || res.data;
      setStatusPengumpulan(dataTugas.pengumpulan || dataTugas.status_pengumpulan || null);
      setSelectedFile(null); // reset

    } catch (err) {
      console.error("Gagal mengumpulkan tugas:", err);
      toast(err?.response?.data?.message || "Terjadi kesalahan saat mengumpulkan tugas.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatalPengumpulan = async () => {
    const pId = statusPengumpulan?.id || statusPengumpulan?.pengumpulan_id;
    if (!pId) {
      toast("ID Pengumpulan tidak ditemukan. Tidak bisa membatalkan.", "error");
      return;
    }
    
    const ok = await confirmDialog("Yakin ingin membatalkan pengumpulan tugas ini? File yang sudah dikumpulkan akan dihapus dari sistem.", { isDanger: true, title: "Batalkan Pengumpulan", confirmText: "Ya, Batalkan" });
    if (!ok) return;

    try {
      setIsCanceling(true);
      await batalkanPengumpulanSiswa(pId);
      toast("Pengumpulan berhasil dibatalkan!", "success");
      
      // Refresh detail
      const res = await getTugasSiswaDetail(tugasId);
      const dataTugas = res.data?.data || res.data;
      setStatusPengumpulan(dataTugas.pengumpulan || dataTugas.status_pengumpulan || null);
    } catch (err) {
      console.error("Gagal membatalkan pengumpulan:", err);
      toast(err?.response?.data?.message || "Terjadi kesalahan saat membatalkan pengumpulan.", "error");
    } finally {
      setIsCanceling(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const dateObj = new Date(dateString);
    return dateObj.toLocaleString("id-ID", { 
      day: "numeric", month: "short", year: "numeric", 
      hour: "2-digit", minute: "2-digit" 
    }).replace(/\./g, ":");
  };

  const deadlineStr = formatDateTime(tugas?.deadline);
  
  // Deteksi status dari backend
  const statusPengerjaan = tugas?.status_pengerjaan || "";
  const isSubmitted = statusPengumpulan != null && statusPengumpulan.status !== "Belum"
    || statusPengerjaan === "Sudah Mengumpulkan";
  const isTerlambat = statusPengerjaan === "Terlambat";
  const isPassedDeadline = tugas?.deadline ? new Date() > new Date(tugas.deadline) : false;
  
  const statusBadgeColor = isSubmitted
    ? "bg-[#A7F3D0] text-[#065F46]"
    : isTerlambat
    ? "bg-amber-100 text-amber-700"
    : "bg-slate-200 text-slate-600";
  const statusText = isSubmitted
    ? "Sudah Mengumpulkan"
    : isTerlambat
    ? "Terlambat"
    : "Belum Mengumpulkan";

  return (
    <SiswaLayout title={mapelName}>
      <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
        {/* Top Navbar */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(`/ruang-belajar/${id}`, { state: { activeTab: "Tugas" } })}
            className="flex items-center gap-2 text-[#1E293B] font-bold hover:text-blue-600 transition"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            {mapelName}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-20">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 max-w-4xl">
            {error}
          </div>
        ) : !tugas ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 max-w-4xl">
            Tugas tidak ditemukan.
          </div>
        ) : (
          <div className="max-w-6xl">
            
            {/* Header Banner - Top Area */}
            <div className="mb-6 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#64748B] mb-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Deadline: {deadlineStr}
                </div>
                <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight mb-2">
                  {tugas.judul}
                </h1>
                <p className="text-sm font-medium text-slate-500">
                  {kelasName}
                </p>
              </div>
              
              <div className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 ${statusBadgeColor}`}>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  {isTerlambat ? (
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  ) : (
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  )}
                </svg>
                {statusText}
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              {/* Kiri: Deskripsi Tugas */}
              <div className="w-full lg:w-2/3">
                <div className="rounded-[24px] bg-white p-8 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] border border-slate-100 min-h-[400px]">
                  <div className="flex items-center gap-3 mb-6">
                    <svg className="h-6 w-6 text-[#0B57D0]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <h2 className="text-[17px] font-bold text-[#0F172A]">Deskripsi Tugas</h2>
                  </div>
                  
                  <div className="text-[14px] text-[#475569] leading-relaxed whitespace-pre-line mb-8">
                    {tugas.deskripsi}
                  </div>

                  {/* Tambahan catatan jika perlu (opsional berdasar screenshot) */}
                  <div className="rounded-xl bg-[#EFF6FF] p-4 text-[13px] text-blue-800 font-medium">
                    <span className="font-bold">Catatan:</span> Pastikan jawaban dikumpulkan sesuai dengan instruksi yang diberikan oleh guru. Format file yang diizinkan biasanya berupa PDF, DOCX, ZIP, atau RAR.
                  </div>
                </div>
              </div>

              {/* Kanan: Status & Upload */}
              <div className="w-full lg:w-1/3 flex flex-col gap-6">
                
                {/* Card Status Pengumpulan */}
                <div className="rounded-[24px] bg-white p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] border border-slate-100">
                  <h3 className="text-[16px] font-bold text-[#0F172A] mb-5">Status Pengumpulan</h3>
                  
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <span className="text-[#64748B]">Status</span>
                      <span className={`font-bold ${isSubmitted ? "text-[#059669]" : "text-slate-700"}`}>
                        {isSubmitted ? "Selesai" : "Belum"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <span className="text-[#64748B]">Nilai</span>
                      <span className="font-bold text-slate-700">
                        {statusPengumpulan?.nilai != null ? statusPengumpulan.nilai : "Belum dinilai"}
                      </span>
                    </div>
                  </div>

                  {isSubmitted && statusPengumpulan?.file && (
                    <div className="mt-5">
                      <span className="text-xs font-semibold text-[#0F172A] block mb-2">File Jawaban Anda:</span>
                      <div className="flex items-center justify-between rounded-lg bg-[#EFF6FF] p-3 border border-blue-100">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <svg className="h-5 w-5 text-[#0B57D0] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          <a href={fixFileUrl(statusPengumpulan.file)} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#0F172A] hover:underline truncate">
                            {statusPengumpulan.nama_file || "Lihat File"}
                          </a>
                        </div>
                      </div>
                      
                      {/* Tombol Batalkan Pengumpulan */}
                      <button
                        onClick={handleBatalPengumpulan}
                        disabled={isCanceling}
                        className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50 border border-rose-200"
                      >
                        {isCanceling ? (
                          <>
                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Membatalkan...
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            Batalkan Pengumpulan
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Upload Tugas */}
                <div className="rounded-[24px] bg-[#F8FAFC] p-6 border border-slate-200">
                  <h3 className="text-[16px] font-bold text-[#0F172A] mb-4">Upload Tugas</h3>
                  
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />

                  {/* Jika sudah lewat deadline dan belum submit → tampilkan peringatan terlambat */}
                  {isTerlambat && !isSubmitted ? (
                    <div className="rounded-[16px] border border-amber-200 bg-amber-50 p-5 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mx-auto mb-3">
                        <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                      </div>
                      <p className="font-bold text-amber-700 text-sm mb-1">Batas Waktu Telah Berakhir</p>
                      <p className="text-xs text-amber-600">Deadline tugas ini sudah lewat. Pengumpulan tidak dapat dilakukan.</p>
                    </div>
                  ) : !isSubmitted ? (
                    <>
                      {!selectedFile ? (
                        <div 
                          className="border-2 border-dashed border-[#93C5FD] bg-[#EFF6FF] rounded-[16px] p-6 text-center cursor-pointer transition hover:bg-blue-50"
                          onClick={() => fileInputRef.current?.click()}
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                        >
                          <div className="bg-white h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-[#0B57D0]">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                            </svg>
                          </div>
                          <h4 className="text-sm font-bold text-[#0F172A] mb-1">Upload file jawaban</h4>
                          <p className="text-xs text-slate-500 mb-3">Drag &amp; drop zona atau klik untuk memilih</p>
                          <p className="text-[10px] text-slate-400">Maksimal ukuran file: 10MB (PDF, ZIP, DOCX)</p>
                        </div>
                      ) : (
                        <div className="border border-slate-200 bg-white rounded-[16px] p-4 flex items-center justify-between shadow-sm mb-4">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="bg-blue-50 text-[#0B57D0] p-2 rounded-lg shrink-0">
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                              </svg>
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-semibold text-[#0F172A] truncate">{selectedFile.name}</p>
                              <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setSelectedFile(null)}
                            className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-md transition"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}

                      <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedFile}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#0B57D0] px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                      >
                        {isSubmitting ? "Mengirim..." : "Kirim Tugas"}
                        {!isSubmitting && (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                          </svg>
                        )}
                      </button>
                    </>
                  ) : null}
                </div>

              </div>
            </div>

          </div>
        )}
      </div>
    </SiswaLayout>
  );
}
