import { useState, useEffect, useCallback } from "react";

// ── Cache hari libur per tahun agar tidak bolak-balik fetch ───────────
const holidayCache = {};

// Fetch hari libur Indonesia dari Nager.Date API (gratis, tidak perlu key)
async function fetchHolidays(year) {
  if (holidayCache[year]) return holidayCache[year];
  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/ID`);
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    // Konversi ke Map: "YYYY-MM-DD" => "Nama Hari Libur"
    const map = {};
    data.forEach((h) => {
      map[h.date] = h.localName || h.name;
    });
    holidayCache[year] = map;
    return map;
  } catch {
    // Jika gagal (offline/API error), kembalikan objek kosong
    return {};
  }
}

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function CalendarWidget() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed
  const [holidays, setHolidays] = useState({});
  const [loadingHolidays, setLoadingHolidays] = useState(false);

  const todayDate = now.getDate();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();

  // Fetch hari libur ketika tahun berubah
  const loadHolidays = useCallback(async (year) => {
    setLoadingHolidays(true);
    const data = await fetchHolidays(year);
    setHolidays(data);
    setLoadingHolidays(false);
  }, []);

  useEffect(() => {
    loadHolidays(viewYear);
  }, [viewYear, loadHolidays]);

  // Jika pindah ke bulan Desember → prefetch tahun depan
  useEffect(() => {
    if (viewMonth === 11) {
      fetchHolidays(viewYear + 1);
    }
    if (viewMonth === 0) {
      fetchHolidays(viewYear - 1);
    }
  }, [viewMonth, viewYear]);

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
  // getDay() → 0=Minggu..6=Sabtu (sudah sesuai dengan grid Min-Sab)
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const getHolidayName = (day) => {
    const key = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return holidays[key] || null;
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7 7 7" />
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
        {loadingHolidays && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl z-10">
            <div className="h-5 w-5 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
          </div>
        )}

        {/* Offset blank cells */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`e-${i}`} />
        ))}

        {/* Day numbers */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isToday = isCurrentMonth && day === todayDate;
          // dayOfWeek: 0=Minggu..6=Sabtu
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
