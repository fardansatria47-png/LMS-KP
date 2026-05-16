export const HARI_LIBUR = {
  "2025-01-01":"Tahun Baru Masehi","2025-01-27":"Isra Mikraj","2025-01-29":"Tahun Baru Imlek",
  "2025-03-29":"Hari Raya Nyepi","2025-03-31":"Idul Fitri 1446 H","2025-04-01":"Idul Fitri 1446 H",
  "2025-04-02":"Cuti Bersama Idul Fitri","2025-04-03":"Cuti Bersama Idul Fitri","2025-04-04":"Cuti Bersama Idul Fitri",
  "2025-04-07":"Cuti Bersama Idul Fitri","2025-04-18":"Wafat Isa Al-Masih","2025-05-01":"Hari Buruh Internasional",
  "2025-05-12":"Hari Raya Waisak","2025-05-29":"Kenaikan Isa Al-Masih","2025-06-01":"Hari Lahir Pancasila",
  "2025-06-06":"Idul Adha 1446 H","2025-06-27":"Tahun Baru Islam 1447 H","2025-08-17":"Hari Kemerdekaan RI",
  "2025-09-05":"Maulid Nabi Muhammad SAW","2025-12-25":"Hari Natal","2025-12-26":"Cuti Bersama Natal",
  "2026-01-01":"Tahun Baru Masehi","2026-01-16":"Isra Mikraj","2026-01-17":"Tahun Baru Imlek",
  "2026-03-19":"Hari Raya Nyepi","2026-03-20":"Idul Fitri 1447 H","2026-03-21":"Idul Fitri 1447 H",
  "2026-03-23":"Cuti Bersama Idul Fitri","2026-03-24":"Cuti Bersama Idul Fitri","2026-03-25":"Cuti Bersama Idul Fitri",
  "2026-03-26":"Cuti Bersama Idul Fitri","2026-04-03":"Wafat Isa Al-Masih","2026-05-01":"Hari Buruh Internasional",
  "2026-05-14":"Kenaikan Isa Al-Masih","2026-05-27":"Hari Raya Waisak","2026-06-01":"Hari Lahir Pancasila",
  "2026-06-17":"Tahun Baru Islam 1448 H","2026-08-17":"Hari Kemerdekaan RI","2026-08-25":"Maulid Nabi Muhammad SAW",
  "2026-12-25":"Hari Natal",
};

export default function CalendarWidget() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const getHolidayName = (d) => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return HARI_LIBUR[key] || null;
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
      <h3 className="text-lg font-bold text-blue-600">Kalender</h3>
      <div className="mt-4">
        <div className="mb-3 flex items-center justify-center">
          <span className="rounded-full bg-slate-800 px-4 py-1 text-xs font-semibold text-white">
            {now.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold mb-1">
          {["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map((d, idx) => (
            <div key={d} className={`py-1 ${idx === 0 ? "text-rose-500" : "text-slate-500"}`}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday = day === today;
            const dayOfWeek = (firstDayOfWeek + i) % 7;
            const isSun = dayOfWeek === 0;
            const holidayName = getHolidayName(day);
            const isRed = isSun || !!holidayName;
            return (
              <div key={day} title={holidayName || undefined}
                className={`rounded-lg py-1.5 text-xs font-medium cursor-default ${
                  isToday ? "bg-slate-400 text-white font-bold"
                  : isRed ? "text-rose-500 font-semibold hover:bg-rose-50"
                  : "text-slate-600 hover:bg-slate-100"}`}>
                {day}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
