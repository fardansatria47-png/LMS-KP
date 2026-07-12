import { useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import GuruLayout from "../components/GuruLayout";
import { fixFileUrl } from "../api/api";



function MateriIcon({ tipe }) {
  if (tipe === "Video") {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
      </div>
    );
  }
  if (tipe === "Presentasi") {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 3h16v12H4V3zm8 14l4 4H8l4-4z" /></svg>
      </div>
    );
  }
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white shadow-sm">
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" /></svg>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function MateriDetail() {
  const navigate = useNavigate();
  const { id } = useParams(); // id kelas
  const location = useLocation();
  const { materi, mapelName, className } = location.state || {};

  // Jika diakses langsung URL tanpa state, fallback redirect ke kelas
  useEffect(() => {
    if (!materi) {
      navigate(`/kelas/${id}`);
    }
  }, [materi, navigate, id]);

  if (!materi) return null;

  return (
    <GuruLayout title={materi.judul}>
      <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
        <button
          onClick={() => navigate(`/kelas/${id}`)}
          className="mb-8 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Kelas
        </button>

        <div className="mx-auto max-w-4xl">
          {/* Header Materi */}
          <div className="mb-8 border-b border-slate-200 pb-8">
            <div className="flex items-start gap-5">
              <MateriIcon tipe={materi.tipe} />
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{materi.judul}</h1>
                <div className="mt-2 flex items-center gap-3 text-sm text-slate-500">
                  {mapelName && <span className="font-medium text-blue-600">{mapelName}</span>}
                  {mapelName && className && <span className="h-1 w-1 rounded-full bg-slate-300"></span>}
                  {className && <span>{className}</span>}
                  {(mapelName || className) && <span className="h-1 w-1 rounded-full bg-slate-300"></span>}
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(materi.created_at || materi.tanggal)}
                  </span>
                </div>
              </div>
            </div>

            {materi.deskripsi && (
              <div className="mt-6 ml-17 rounded-xl bg-slate-50 p-6 text-base leading-relaxed text-slate-700 ring-1 ring-slate-100">
                {materi.deskripsi}
              </div>
            )}
          </div>

          {/* Lampiran Materi */}
          <div className="ml-17">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Lampiran Materi</h3>

            {!materi.files || materi.files.length === 0 ? (
              <p className="text-sm text-slate-500">Tidak ada lampiran.</p>
            ) : (
              <div className="flex flex-col gap-6">

                {/* 1. List untuk file gambar/dokumen/pdf */}
                <div className="flex flex-col gap-3">
                  {materi.files.map((file) => {
                    if (file?.tipe?.toUpperCase() === "YOUTUBE") return null;

                    return (
                      <a
                        key={file.id}
                        href={fixFileUrl(file.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500 transition group-hover:bg-blue-500 group-hover:text-white">
                          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="truncate text-sm font-bold text-slate-800 group-hover:text-blue-600 transition">{file.nama_file || "File Lampiran"}</p>
                          <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{file.tipe}</p>
                        </div>
                      </a>
                    );
                  })}
                </div>

                {/* 2. Youtube iframes dipisahkan ke bawah dan dibuat lebar */}
                {materi.files.some(f => f?.tipe?.toUpperCase() === "YOUTUBE") && (
                  <div className="mt-4">
                    <h4 className="mb-3 text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                      Video Referensi
                    </h4>
                    <div className="grid grid-cols-1 gap-6">
                      {materi.files
                        .filter(f => f?.tipe?.toUpperCase() === "YOUTUBE")
                        .map(file => {
                          let embedUrl = file.url;
                          if (embedUrl?.includes("watch?v=")) {
                            const vId = new URL(embedUrl).searchParams.get("v");
                            if (vId) embedUrl = `https://www.youtube.com/embed/${vId}`;
                          } else if (embedUrl?.includes("youtu.be/")) {
                            const vId = embedUrl.split("youtu.be/")[1]?.split("?")[0];
                            if (vId) embedUrl = `https://www.youtube.com/embed/${vId}`;
                          }

                          return (
                            <div key={file.id} className="relative z-0 aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-sm ring-1 ring-slate-100">
                              <iframe
                                className="absolute left-0 top-0 z-10 h-full w-full"
                                src={embedUrl}
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
              </div>
            )}
          </div>
        </div>
      </div>
    </GuruLayout>
  );
}
