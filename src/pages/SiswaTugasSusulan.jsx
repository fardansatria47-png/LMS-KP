import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTugasSusulanSiswa } from "../services/authService";
import { getErrorMessage } from "../utils/translateError";
import SiswaLayout from "../components/SiswaLayout";

const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  const dateObj = new Date(dateString);
  return dateObj
    .toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(/\./g, ":");
};

const getStatusMeta = (item) => {
  const status = (item.status_pengumpulan || "").toLowerCase();
  const deadlineStr = item.deadline_susulan || item.deadline;
  const isDeadlinePassed = deadlineStr ? new Date() > new Date(deadlineStr) : false;

  if (status && !status.includes("belum")) {
    return {
      label: "Sudah Dikumpulkan",
      color: "bg-emerald-100 text-emerald-700",
      dot: "bg-emerald-500",
    };
  }
  if (isDeadlinePassed) {
    return {
      label: "Terlambat",
      color: "bg-amber-100 text-amber-700",
      dot: "bg-amber-500",
    };
  }
  return {
    label: "Belum Dikumpulkan",
    color: "bg-indigo-100 text-indigo-700",
    dot: "bg-indigo-500",
  };
};

export default function SiswaTugasSusulan() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getTugasSusulanSiswa();
        const raw = res.data;

        let data = [];
        if (Array.isArray(raw)) data = raw;
        else if (Array.isArray(raw?.data)) data = raw.data;
        else if (Array.isArray(raw?.data?.data)) data = raw.data.data;

        // Urutkan: belum/terlambat dulu, sudah paling bawah
        data.sort((a, b) => {
          const aSubmitted = a.status_pengumpulan && !a.status_pengumpulan.toLowerCase().includes("belum");
          const bSubmitted = b.status_pengumpulan && !b.status_pengumpulan.toLowerCase().includes("belum");
          if (aSubmitted && !bSubmitted) return 1;
          if (!aSubmitted && bSubmitted) return -1;
          // Urutkan berdasar deadline terdekat
          const aD = new Date(a.deadline_susulan || a.deadline || 0);
          const bD = new Date(b.deadline_susulan || b.deadline || 0);
          return aD - bD;
        });

        setList(data);
      } catch (err) {
        setError(getErrorMessage(err, "Gagal memuat daftar tugas susulan."));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const belumCount = list.filter((t) => {
    const s = (t.status_pengumpulan || "").toLowerCase();
    return !s || s.includes("belum");
  }).length;

  return (
    <SiswaLayout title="Tugas Susulan">
      <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
        {/* ── Page Header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Tugas Susulan</h1>
              <p className="text-sm text-slate-500 font-medium">Daftar tugas susulan dari semua mata pelajaran</p>
            </div>
          </div>

          {/* Summary badges */}
          {!loading && !error && (
            <div className="flex flex-wrap gap-3 mt-5">
              <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-2.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                <span className="text-xs font-bold text-slate-700">
                  {list.length} Tugas Susulan
                </span>
              </div>
              {belumCount > 0 && (
                <div className="flex items-center gap-2 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-2.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  <span className="text-xs font-bold text-amber-700">
                    {belumCount} Belum Dikumpulkan
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
            <p className="text-sm text-slate-500 font-medium">Memuat tugas susulan...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 flex items-start gap-3">
            <svg className="h-5 w-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : list.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center gap-5 rounded-[28px] border border-slate-200 bg-white py-20 px-8 text-center shadow-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-400">
              <svg className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0F172A]">Tidak Ada Tugas Susulan</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-xs">
                Kamu tidak memiliki tugas susulan saat ini. Tugas susulan akan muncul di sini jika guru menugaskan kamu.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl">
            {list.map((item, idx) => {
              const status = getStatusMeta(item);
              const deadlineDisplay = formatDateTime(item.deadline_susulan || item.deadline);
              const isSubmitted = status.label === "Sudah Dikumpulkan";

              return (
                <div
                  key={item.id || idx}
                  className={`group relative rounded-[22px] bg-white p-6 shadow-sm border transition-all hover:shadow-md cursor-pointer ${
                    isSubmitted
                      ? "border-slate-100 hover:border-slate-200"
                      : "border-indigo-100 hover:border-indigo-300"
                  }`}
                  onClick={() => navigate(`/siswa/tugas-susulan/${item.id}`)}
                >
                  {/* Accent bar kiri */}
                  <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${status.dot}`}></div>

                  <div className="flex items-start justify-between gap-4 pl-3">
                    <div className="flex-1 min-w-0">
                      {/* Header tugas */}
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h2 className="text-[16px] font-bold text-[#0F172A] leading-snug truncate">
                          {item.judul || item.judul_tugas}
                        </h2>
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 uppercase tracking-wide shrink-0">
                          ✦ Susulan
                        </span>
                      </div>

                      {/* Info mapel & guru */}
                      {(item.nama_mapel || item.mapel || item.mata_pelajaran) && (
                        <p className="text-[12px] font-semibold text-slate-500 mb-2">
                          {item.nama_mapel || item.mapel || item.mata_pelajaran}
                          {(item.guru || item.nama_guru) && (
                            <> · <span>{item.guru || item.nama_guru}</span></>
                          )}
                        </p>
                      )}

                      {/* Deskripsi singkat */}
                      {(item.deskripsi || item.deskripsi_tugas) && (
                        <p className="text-[13px] text-[#64748B] leading-relaxed mb-3 line-clamp-2">
                          {item.deskripsi || item.deskripsi_tugas}
                        </p>
                      )}

                      {/* Catatan guru */}
                      {item.keterangan && (
                        <p className="text-[12px] text-indigo-700 bg-indigo-50 rounded-xl px-3 py-2 mb-3 italic border border-indigo-100 line-clamp-2">
                          📝 Catatan Guru: {item.keterangan}
                        </p>
                      )}

                      {/* Deadline & Status */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[12px] font-bold text-rose-600">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Deadline: {deadlineDisplay}
                        </div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${status.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`}></span>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    {/* Arrow & Action button */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/siswa/tugas-susulan/${item.id}`);
                        }}
                        className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold text-white transition ${
                          isSubmitted
                            ? "bg-slate-400 hover:bg-slate-500"
                            : "bg-indigo-600 hover:bg-indigo-700"
                        }`}
                      >
                        {isSubmitted ? "Lihat Detail" : "Kerjakan"}
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SiswaLayout>
  );
}
