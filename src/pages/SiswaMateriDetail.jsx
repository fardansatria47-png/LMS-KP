import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getMataPelajaranSiswaDetail } from "../services/authService";
import { fixFileUrl } from "../api/api";
import { confirmDialog } from "../utils/notify";
import { logoutUser } from "../services/authService";
import { getErrorMessage } from "../utils/translateError";
import SiswaLayout from "../components/SiswaLayout";



export default function SiswaMateriDetail() {
  const { id, materiId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [materi, setMateri] = useState(location.state?.materi || null);
  const [mapelName, setMapelName] = useState(location.state?.mapelName || "Memuat...");
  const [guruName, setGuruName] = useState(location.state?.guruName || "Memuat...");

  useEffect(() => {
    // Jika data materi belum ada dari state, ambil ulang dari API ruang belajar
    if (!materi) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const res = await getMataPelajaranSiswaDetail(id);
          const mapelData = res.data?.data || res.data;
          setMapelName(mapelData.nama_mapel || "Mata Pelajaran");
          setGuruName(mapelData.guru || "Guru Pengajar");
          
          const found = mapelData.materi?.find(m => String(m.id) === String(materiId));
          if (found) {
            setMateri(found);
          } else {
            setError("Materi tidak ditemukan.");
          }
        } catch (err) {
          setError(getErrorMessage(err, "Gagal memuat detail materi."));
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      setLoading(false);
    }
  }, [id, materiId, materi]);

  const handleLogout = async () => {
    const ok = await confirmDialog("Yakin ingin logout?", { isDanger: true, title: "Logout" });
    if (ok) {
      try {
        await logoutUser();
      } catch (e) {
        console.warn("[Logout] API logout gagal:", e);
      }
      localStorage.removeItem("user_role");
      window.location.href = "/login";
    }
  };

  const dateStr = materi?.created_at 
    ? new Date(materi.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) 
    : "Baru Saja";

  // Pisahkan file dokumen dan youtube
  const dokumenFiles = materi?.files?.filter(f => f.tipe?.toLowerCase() !== "youtube") || [];
  const youtubeFiles = materi?.files?.filter(f => f.tipe?.toLowerCase() === "youtube") || [];

  return (
    <SiswaLayout title={mapelName}>
      <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-8 max-w-4xl">
        {/* Top Navbar */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(`/ruang-belajar/${id}`)}
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
        ) : !materi ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 max-w-4xl">
            Materi tidak ditemukan.
          </div>
        ) : (
          <div className="max-w-4xl">
            
            {/* Header Content Card */}
            <div className="rounded-[24px] bg-white p-8 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] border border-slate-100 mb-8">
              <div className="flex items-center gap-4 text-[13px] font-semibold text-[#64748B] mb-4">
                <div className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  {guruName}
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                  </svg>
                  {dateStr}
                </div>
              </div>
              
              <h1 className="text-[26px] font-extrabold text-[#0F172A] leading-tight mb-4">
                {materi.judul}
              </h1>
              <p className="text-[14px] text-[#475569] leading-relaxed">
                {materi.deskripsi}
              </p>
            </div>

            {/* Video Pembelajaran */}
            {youtubeFiles.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="h-5 w-5 text-[#0B57D0]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <h2 className="text-[17px] font-bold text-[#0F172A]">Video Pembelajaran</h2>
                </div>
                
                <div className="space-y-6">
                  {youtubeFiles.map((vid, idx) => {
                    // Pastikan URL-nya menggunakan format embed agar tidak diblok
                    let embedUrl = vid.url;
                    if (embedUrl?.includes("watch?v=")) {
                      const vId = new URL(embedUrl).searchParams.get("v");
                      if (vId) embedUrl = `https://www.youtube.com/embed/${vId}`;
                    } else if (embedUrl?.includes("youtu.be/")) {
                      const vId = embedUrl.split("youtu.be/")[1]?.split("?")[0];
                      if (vId) embedUrl = `https://www.youtube.com/embed/${vId}`;
                    }
                    
                    return (
                      <div key={idx} className="rounded-[20px] overflow-hidden border border-slate-200 shadow-sm bg-black aspect-video w-full relative z-0">
                        <iframe 
                          className="absolute top-0 left-0 w-full h-full z-10"
                          src={embedUrl} 
                          title={vid.nama_file || "Video Pembelajaran"} 
                          frameBorder="0" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen>
                        </iframe>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Materi Pendukung */}
            {dokumenFiles.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <svg className="h-5 w-5 text-[#0B57D0]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                  <h2 className="text-[17px] font-bold text-[#0F172A]">Materi Pendukung</h2>
                </div>

                <div className="space-y-3">
                  {dokumenFiles.map((file, idx) => {
                    const isPdf = file.url?.toLowerCase().endsWith(".pdf") || file.tipe?.toLowerCase() === "pdf";
                    return (
                      <div key={idx} className="rounded-[16px] border border-slate-200 bg-white p-4 sm:p-5 flex items-center justify-between gap-4 transition hover:shadow-md">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] ${isPdf ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                            {isPdf ? (
                              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 16l-4-4h3V4h2v8h3l-4 4zm9-12h-6v2h6v14H3V6h6V4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" /></svg>
                            ) : (
                              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" /></svg>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-[14px] sm:text-[15px] font-bold text-[#0F172A] truncate" title={file.nama_file || "Dokumen Materi"}>
                              {file.nama_file || "Dokumen Materi"}
                            </h3>
                            <p className="text-[11px] sm:text-[12px] font-medium text-slate-500">
                              {isPdf ? "Dokumen PDF" : "File Berkas"}
                            </p>
                          </div>
                        </div>
                        <a 
                          href={fixFileUrl(file.url)} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex shrink-0 items-center justify-center rounded-lg bg-[#0B57D0] px-3 py-2 sm:px-6 sm:py-2.5 text-[11px] sm:text-[13px] font-bold text-white transition hover:bg-blue-800 gap-1.5 sm:gap-2 whitespace-nowrap"
                        >
                          <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          Unduh Materi
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </SiswaLayout>
  );
}
