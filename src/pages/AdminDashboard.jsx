import Sidebar from "../components/Sidebar";

export default function AdminDashboard({ summary, navigate }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  // Days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Day of week for 1st of month: 0=Sun..6=Sat
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // ── Hari Libur Nasional Indonesia ──────────────────────────────────
  // Format: "YYYY-MM-DD"
  const HARI_LIBUR = {
    // 2025
    "2025-01-01": "Tahun Baru Masehi",
    "2025-01-27": "Isra Mikraj",
    "2025-01-28": "Cuti Bersama Isra Mikraj",
    "2025-01-29": "Tahun Baru Imlek",
    "2025-01-30": "Cuti Bersama Tahun Baru Imlek",
    "2025-03-29": "Hari Raya Nyepi",
    "2025-03-30": "Cuti Bersama Nyepi",
    "2025-03-31": "Idul Fitri 1446 H",
    "2025-04-01": "Idul Fitri 1446 H",
    "2025-04-02": "Cuti Bersama Idul Fitri",
    "2025-04-03": "Cuti Bersama Idul Fitri",
    "2025-04-04": "Cuti Bersama Idul Fitri",
    "2025-04-07": "Cuti Bersama Idul Fitri",
    "2025-04-18": "Wafat Isa Al-Masih",
    "2025-05-01": "Hari Buruh Internasional",
    "2025-05-12": "Hari Raya Waisak",
    "2025-05-13": "Cuti Bersama Waisak",
    "2025-05-29": "Kenaikan Isa Al-Masih",
    "2025-06-01": "Hari Lahir Pancasila",
    "2025-06-06": "Idul Adha 1446 H",
    "2025-06-09": "Cuti Bersama Idul Adha",
    "2025-06-27": "Tahun Baru Islam 1447 H",
    "2025-08-17": "Hari Kemerdekaan RI",
    "2025-09-05": "Maulid Nabi Muhammad SAW",
    "2025-12-25": "Hari Natal",
    "2025-12-26": "Cuti Bersama Natal",
    // 2026
    "2026-01-01": "Tahun Baru Masehi",
    "2026-01-16": "Isra Mikraj",
    "2026-01-17": "Tahun Baru Imlek",
    "2026-03-19": "Hari Raya Nyepi",
    "2026-03-20": "Idul Fitri 1447 H",
    "2026-03-21": "Idul Fitri 1447 H",
    "2026-03-23": "Cuti Bersama Idul Fitri",
    "2026-03-24": "Cuti Bersama Idul Fitri",
    "2026-03-25": "Cuti Bersama Idul Fitri",
    "2026-03-26": "Cuti Bersama Idul Fitri",
    "2026-04-03": "Wafat Isa Al-Masih",
    "2026-05-01": "Hari Buruh Internasional",
    "2026-05-14": "Kenaikan Isa Al-Masih",
    "2026-05-27": "Hari Raya Waisak",
    "2026-05-27": "Idul Adha 1447 H",
    "2026-06-01": "Hari Lahir Pancasila",
    "2026-06-17": "Tahun Baru Islam 1448 H",
    "2026-08-17": "Hari Kemerdekaan RI",
    "2026-08-25": "Maulid Nabi Muhammad SAW",
    "2026-12-25": "Hari Natal",
  };

  // Cek apakah tanggal tertentu adalah hari libur nasional
  const getHolidayName = (d) => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return HARI_LIBUR[key] || null;
  };

  const StatCard = ({ label, value }) => (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{label}</p>
      <p className="mt-3 text-4xl font-bold text-blue-600">{value || "0"}</p>
    </div>
  );

  return (
    <>
      <Sidebar />
      <div className="ml-64 px-8 py-10">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Selamat Datang</p>
            <h1 className="text-[28px] font-bold text-blue-600 uppercase tracking-wide">Halo, Admin</h1>
            <p className="mt-1 text-sm text-slate-500">Ringkasan operasional SMK hari ini.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-10 grid gap-6 sm:grid-cols-3">
          <StatCard label="Total Siswa" value={summary?.total_siswa || 0} />
          <StatCard label="Total Guru" value={summary?.total_guru || 0} />
          <StatCard label="Mata Pelajaran" value={summary?.total_mapel || 0} />
        </div>

        {/* Calendar and Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Calendar */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-blue-600">Kalender</h3>
            <div className="mt-4">
              <div className="mb-3 flex items-center justify-center">
                <span className="rounded-full bg-slate-800 px-4 py-1 text-xs font-semibold text-white">
                  {now.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                </span>
              </div>

              {/* Day-of-week headers: Min Sen Sel Rab Kam Jum Sab */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold mb-1">
                {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d, idx) => (
                  <div key={d} className={`py-1 ${idx === 0 ? "text-rose-500" : "text-slate-500"}`}>{d}</div>
                ))}
              </div>

              {/* Calendar day cells */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {/* Empty cells for offset */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {/* Day numbers */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isToday = day === today;
                  const dayOfWeek = (firstDayOfWeek + i) % 7;
                  const isSun = dayOfWeek === 0;
                  const holidayName = getHolidayName(day);
                  const isRed = isSun || !!holidayName;
                  return (
                    <div
                      key={day}
                      title={holidayName || undefined}
                      className={`rounded-lg py-1.5 text-xs font-medium cursor-default
                        ${isToday
                          ? "bg-slate-400 text-white font-bold"
                          : isRed
                          ? "text-rose-500 font-semibold hover:bg-rose-50"
                          : "text-slate-600 hover:bg-slate-100"}`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4">
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
