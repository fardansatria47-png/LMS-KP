import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { confirmDialog } from "../utils/notify";
import CalendarWidget from "../components/CalendarWidget";
import SiswaLayout from "../components/SiswaLayout";

const SISWA_NAV = [
  { label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", path: "/dashboard" },
  { label: "Kelas Saya", icon: "M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z", path: "/mata-pelajaran" },
  { label: "Profil", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", path: "/profile" },
];

export default function SiswaDashboard({ user, summary }) {
  const navigate = useNavigate();

  const nama = summary?.siswa_name || user?.nama || user?.name || "Siswa";
  const stats = summary?.summary || {};
  const pengumumanList = summary?.pengumuman || [];

  // Realtime WebSocket (Reverb) listener
  useEffect(() => {
    // Sesuai struktur kelas_preview
    const kelasPreview = summary?.kelas_preview || [];
    
    // Jika tidak ada kelas_preview, kita coba listen ke kelas-1
    const channelsToListen = kelasPreview.length > 0 
      ? kelasPreview.map(k => `kelas-${k.id}`)
      : ['kelas-1'];

    channelsToListen.forEach(channelName => {
      if (window.Echo) {
        window.Echo.channel(channelName)
          .listen('TugasBaruEvent', (e) => {
              console.log(`[Reverb] Tugas Baru di ${channelName}:`, e);
              // Anda dapat menambahkan UI notifikasi di sini nanti
          });
      }
    });

    return () => {
      channelsToListen.forEach(channelName => {
        if (window.Echo) {
          window.Echo.leaveChannel(channelName);
        }
      });
    };
  }, [summary?.kelas_preview]);

  const handleLogout = async () => {
    const ok = await confirmDialog("Yakin ingin logout?", { isDanger: true, title: "Logout" });
    if (ok) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  };

  return (
    <SiswaLayout title="Dashboard">
      <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-12">
        {/* Header */}
        <div className="mb-8 border-b border-slate-200 pb-6">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0f172a] tracking-tight">Halo, {nama}</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">Lanjutkan aktivitas pembelajaran Anda hari ini.</p>
        </div>

        {/* Stat Cards */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm flex items-center justify-between border border-slate-100">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">TOTAL MATA PELAJARAN</p>
              <p className="mt-2 text-4xl font-black text-[#0f172a]">{stats.total_mata_pelajaran ?? 0}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
          </div>
          
          <div className="rounded-2xl bg-white p-6 shadow-sm flex items-center justify-between border border-slate-100">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">TUGAS TERTUNDA</p>
              <p className="mt-2 text-4xl font-black text-[#0f172a]">{stats.tugas_tertunda ?? 0}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm flex items-center justify-between border border-slate-100">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">TUGAS SELESAI</p>
              <p className="mt-2 text-4xl font-black text-[#0f172a]">{stats.tugas_selesai ?? 0}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Calendar + Pengumuman Grid */}
        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          {/* Kalender */}
          <CalendarWidget />

          {/* Pengumuman */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="mb-4 text-sm font-bold text-slate-800">Pengumuman</h2>
              <p className="text-xs text-slate-500">Lihat pengumuman terbaru dari mata pelajaran Anda.</p>
            </div>
            <button
              onClick={() => navigate('/siswa-pengumuman')}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Lihat Semua Pengumuman
            </button>
          </div>
          <div className="space-y-4">
              {pengumumanList.length > 0 ? (
                pengumumanList.map((p, idx) => (
                  <div key={p.id || idx} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex gap-5 items-start">
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">{p.judul || p.title || "Pengumuman"}</h3>
                      <p className="mt-2 text-xs font-medium text-slate-500 leading-relaxed">
                        {p.deskripsi || p.konten || p.content || "Tidak ada deskripsi."}
                      </p>
                      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {p.waktu || (p.created_at ? new Date(p.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "Baru Saja")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex gap-5 items-start">
                    <div>
                      <h3 className="font-bold text-sm text-[#0f172a]">Jadwal Ujian Tengah Semester</h3>
                      <p className="mt-2 text-xs font-medium text-slate-500 leading-relaxed">
                        Harap diperhatikan bahwa UTS akan dimulai pada tanggal 15...
                      </p>
                      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">2 JAM YANG LALU</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex gap-5 items-start">
                    <div>
                      <h3 className="font-bold text-sm text-[#0f172a]">Workshop Karir IT</h3>
                      <p className="mt-2 text-xs font-medium text-slate-500 leading-relaxed">
                        Daftarkan diri Anda untuk mengikuti workshop persiapan...
                      </p>
                      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">KEMARIN</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </SiswaLayout>
  );
}
