import Sidebar from "../components/Sidebar";
import CalendarWidget from "../components/CalendarWidget";

export default function AdminDashboard({ summary, navigate }) {
  const StatCard = ({ label, value }) => (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{label}</p>
      <p className="mt-3 text-4xl font-bold text-blue-600">{value || "0"}</p>
    </div>
  );

  return (
    <>
      <Sidebar />
      <div className="lg:ml-64 px-4 sm:px-6 lg:px-8 pt-16 pb-24 lg:py-10">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Selamat Datang</p>
            <h1 className="text-[28px] font-bold text-blue-600 uppercase tracking-wide">Halo, Admin</h1>
            <p className="mt-1 text-sm text-slate-500">Ringkasan operasional SMK hari ini.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 lg:mb-10 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
          <StatCard label="Total Siswa" value={summary?.total_siswa || 0} />
          <StatCard label="Total Guru" value={summary?.total_guru || 0} />
          <StatCard label="Mata Pelajaran" value={summary?.total_mapel || 0} />
        </div>

        {/* Calendar and Actions */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Calendar — shown below Aksi Cepat on mobile, left side on desktop */}
          <div className="order-last lg:order-first">
            <CalendarWidget />
          </div>

          {/* Quick Actions — shown first on mobile, right side on desktop */}
          <div className="order-first lg:order-last rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-lg font-bold text-blue-600">Aksi Cepat</h3>

            {/* Tambah Pengguna */}
            <button
              type="button"
              id="shortcut-tambah-pengguna"
              onClick={() => navigate("/register")}
              className="flex w-full items-center justify-between gap-4 rounded-2xl bg-blue-600 px-5 py-4 text-white transition hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 shrink-0">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">Tambah Pengguna</p>
                  <p className="text-xs text-blue-200 mt-0.5">Tambah Data Siswa/Guru ke Sistem</p>
                </div>
              </div>
              <svg className="h-5 w-5 text-blue-200 group-hover:translate-x-1 transition-transform shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Tambah Mata Pelajaran */}
            <button
              type="button"
              id="shortcut-tambah-mapel"
              onClick={() => navigate("/tambah-mata-pelajaran")}
              className="flex w-full items-center justify-between gap-4 rounded-2xl bg-blue-600 px-5 py-4 text-white transition hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 shrink-0">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">Tambah Mata Pelajaran</p>
                  <p className="text-xs text-blue-200 mt-0.5">Tambah Data Mata Pelajaran ke Sistem</p>
                </div>
              </div>
              <svg className="h-5 w-5 text-blue-200 group-hover:translate-x-1 transition-transform shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Tambah Anggota Kelas */}
            <button
              type="button"
              id="shortcut-tambah-kelas"
              onClick={() => navigate("/tambah-kelas")}
              className="flex w-full items-center justify-between gap-4 rounded-2xl bg-blue-600 px-5 py-4 text-white transition hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 shrink-0">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">Tambah Anggota Kelas</p>
                  <p className="text-xs text-blue-200 mt-0.5">Tambah Kelas dan Atur Pembagian Kelas</p>
                </div>
              </div>
              <svg className="h-5 w-5 text-blue-200 group-hover:translate-x-1 transition-transform shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
