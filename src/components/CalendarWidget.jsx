import { useState } from "react";

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// Hari libur spesifik (tanggal merah dan cuti bersama)
// Karena hari raya keagamaan (Idul Fitri, dll) berubah setiap tahun, 
// kita hardcode untuk tahun-tahun terdekat agar sangat akurat.
const VARIABLE_HOLIDAYS = {
  // 2025
  "2025-01-27": "Isra Mikraj",
  "2025-01-28": "Cuti Bersama Isra Mikraj",
  "2025-01-29": "Tahun Baru Imlek",
  "2025-01-30": "Cuti Bersama Imlek",
  "2025-03-29": "Hari Raya Nyepi",
  "2025-03-30": "Cuti Bersama Nyepi",
  "2025-03-31": "Idul Fitri 1446 H",
  "2025-04-01": "Idul Fitri 1446 H",
  "2025-04-02": "Cuti Bersama Idul Fitri",
  "2025-04-03": "Cuti Bersama Idul Fitri",
  "2025-04-04": "Cuti Bersama Idul Fitri",
  "2025-04-07": "Cuti Bersama Idul Fitri",
  "2025-04-18": "Wafat Isa Al-Masih",
  "2025-05-12": "Hari Raya Waisak",
  "2025-05-13": "Cuti Bersama Waisak",
  "2025-05-29": "Kenaikan Isa Al-Masih",
  "2025-06-06": "Idul Adha 1446 H",
  "2025-06-09": "Cuti Bersama Idul Adha",
  "2025-06-27": "Tahun Baru Islam 1447 H",
  "2025-09-05": "Maulid Nabi Muhammad SAW",
  "2025-12-26": "Cuti Bersama Natal",

  // 2026
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
  "2026-05-14": "Kenaikan Isa Al-Masih",
  "2026-05-27": "Idul Adha 1447 H",
  "2026-05-31": "Hari Raya Waisak",
  "2026-06-16": "Tahun Baru Islam 1448 H", // <--- 16 Juni 2026
  "2026-08-25": "Maulid Nabi Muhammad SAW",
  "2026-12-24": "Cuti Bersama Natal",
};

export default function CalendarWidget() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const todayDate = now.getDate();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    setViewYear(todayYear);
    setViewMonth(todayMonth);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  // Menggabungkan hari libur fix (otomatis setiap tahun) dengan hari raya (dinamis)
  const getHolidayName = (day) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const key = `${viewYear}-${mm}-${dd}`;
    const md = `${mm}-${dd}`; // bulan-tanggal

    // Libur Fix setiap tahun
    if (md === "01-01") return "Tahun Baru Masehi";
    if (md === "05-01") return "Hari Buruh Internasional";
    if (md === "06-01") return "Hari Lahir Pancasila";
    if (md === "08-17") return "Hari Kemerdekaan RI";
    if (md === "12-25") return "Hari Raya Natal";

    // Libur variabel (Idul fitri, Nyepi, Waisak, dll)
    return VARIABLE_HOLIDAYS[key] || null;
  };

  const isCurrentMonth = viewYear === todayYear && viewMonth === todayMonth;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-blue-600">Kalender</h3>
        {!isCurrentMonth && (
          <button
            onClick={goToday}
            className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-semibold text-blue-600 hover:bg-blue-100 transition"
          >
            Hari Ini
          </button>
        )}
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition"
          aria-label="Bulan sebelumnya"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span className="rounded-full bg-slate-800 px-4 py-1 text-xs font-semibold text-white">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>

        <button
          onClick={nextMonth}
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition"
          aria-label="Bulan berikutnya"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            {/* SVG Path yang sudah diperbaiki! (-) agar tidak jadi garis miring */}
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers: Min Sen Sel Rab Kam Jum Sab */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold mb-1">
        {DAY_NAMES.map((d, idx) => (
          <div key={d} className={`py-1 ${idx === 0 ? "text-rose-500" : "text-slate-400"}`}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1 text-center relative">
        {/* Offset blank cells */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`e-${i}`} />
        ))}

        {/* Day numbers */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isToday = isCurrentMonth && day === todayDate;
          const dayOfWeek = (firstDayOfWeek + i) % 7;
          const isSunday = dayOfWeek === 0;
          const holidayName = getHolidayName(day);
          const isRed = isSunday || !!holidayName;

          return (
            <div
              key={day}
              title={holidayName || (isSunday ? "Minggu" : undefined)}
              className={`relative rounded-lg py-1.5 text-xs font-medium cursor-default transition ${
                isToday
                  ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-200"
                  : isRed
                  ? "text-rose-500 font-semibold hover:bg-rose-50"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {day}
              {/* Titik indikator hari libur (bukan hari ini & bukan Minggu murni) */}
              {holidayName && !isToday && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-rose-400" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-[10px] text-slate-400 border-t border-slate-100 pt-3">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-blue-600" />
          Hari ini
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-rose-400" />
          Libur Nasional
        </span>
        <span className="flex items-center gap-1 text-rose-400 font-semibold">
          Min = Hari Minggu
        </span>
      </div>
    </div>
  );
}
