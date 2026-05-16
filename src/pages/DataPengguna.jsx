import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getSiswa, getGuru, deleteSiswa, deleteGuru } from "../services/authService";
import { toast } from "../utils/notify";

// ── Constants ────────────────────────────────────────────────────────
const PER_PAGE = 10;

// ── Component ────────────────────────────────────────────────────────
export default function DataPengguna() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("siswa");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [deleting, setDeleting] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Helper: extract flat array from any API response shape
  const extractFromResponse = (obj) => {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj;
    if (typeof obj === "object") {
      for (const key of ["data", "siswa", "results"]) {
        if (obj[key] !== undefined) return extractFromResponse(obj[key]);
      }
      const entries = Object.entries(obj);
      const arrayEntries = entries.filter(([, v]) => Array.isArray(v));
      if (arrayEntries.length > 0 && arrayEntries.length === entries.length) {
        const result = [];
        arrayEntries.forEach(([kelasName, students]) => {
          students.forEach(s => result.push({ ...s, _kelasLabel: kelasName.trim() }));
        });
        return result;
      }
    }
    return [];
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      let dataSiswa = [];
      let dataGuru = [];

      try {
        const resSiswa = await getSiswa();
        dataSiswa = extractFromResponse(resSiswa.data).map(u => ({ ...u, role: "siswa" }));
      } catch (e) {
        console.error("Error fetch siswa:", e);
      }

      try {
        const resGuru = await getGuru();
        dataGuru = extractFromResponse(resGuru.data).map(u => ({ ...u, role: "guru" }));
      } catch (e) {
        console.error("Error fetch guru:", e);
      }

      setUsers([...dataSiswa, ...dataGuru]);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const role = (u.role || "").toLowerCase();
      const matchesTab = tab === "siswa" ? role === "siswa" : role === "guru";
      const matchesSearch =
        !search ||
        (u.nama_lengkap || u.nama || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.nis || u.nip || u.nik || "").toString().includes(search);
      return matchesTab && matchesSearch;
    });
  }, [users, tab, search]);

  const grouped = useMemo(() => {
    if (tab !== "siswa") return null;
    const map = {};
    filtered.forEach((u) => {
      const kelasLabel =
        u._kelasLabel ||
        (Array.isArray(u.kelas) ? u.kelas[0] : null) ||
        u.kelas?.nama || u.kelas?.tingkat ||
        u.kelas ||
        (u.kelas_id ? `Kelas ID: ${u.kelas_id}` : "Belum ada kelas");
      if (!map[kelasLabel]) map[kelasLabel] = [];
      map[kelasLabel].push(u);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b, "id", { numeric: true }));
  }, [filtered, tab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);

  useEffect(() => { setPage(1); }, [tab, search]);

  const confirmDelete = (user) => setDeleteModal({ open: true, user });
  const cancelDelete = () => setDeleteModal({ open: false, user: null });

  const handleDelete = async () => {
    if (!deleteModal.user) return;
    setDeleting(true);
    try {
      if (deleteModal.user.role === "siswa") {
        await deleteSiswa(deleteModal.user.id);
      } else {
        await deleteGuru(deleteModal.user.id);
      }
      setUsers((prev) => prev.filter((u) => u.id !== deleteModal.user.id));
      cancelDelete();
    } catch (err) {
      toast(err?.response?.data?.message || "Gagal menghapus pengguna", "error");
    } finally {
      setDeleting(false);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return (
      <div className="mt-8 flex items-center justify-center gap-2">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`sep-${i}`} className="px-2 text-slate-400">...</span>
          ) : (
            <button key={p} onClick={() => setPage(p)} className={`h-9 w-9 rounded-lg text-sm font-bold transition ${page === p ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-600 hover:bg-slate-100"}`}>{p}</button>
          )
        )}
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    );
  };

  // ── User Row ──────────────────────────────────────────────────────
  const UserRow = ({ user }) => (
    <tr className="group border-b border-slate-100 transition hover:bg-slate-50/60">
      <td className="py-4 pl-6 pr-3">
        <span className="text-sm font-medium text-slate-700">{user.nama_lengkap || user.nama || user.name || "-"}</span>
      </td>
      <td className="px-3 py-4">
        <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-bold">
          {user.nis || user.nip || user.nik || "-"}
        </span>
      </td>
      <td className="px-3 py-4 text-sm font-medium text-slate-600">{user.jenis_kelamin || "-"}</td>
      {tab === "siswa" && (
        <>
          <td className="px-3 py-4 text-sm font-medium text-slate-600">
            {typeof user.jurusan === "string" ? user.jurusan
              : user.jurusan?.nama || user.jurusan?.nama_jurusan
              || user.nama_jurusan || "-"}
          </td>
          <td className="px-3 py-4 text-center text-sm font-medium text-slate-600">
            {user._kelasLabel || user.tingkat || user.kelas?.nama || "-"}
          </td>
        </>
      )}
      <td className="px-4 py-4 pr-8">
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => navigate(`/edit-user/${user.id}`, { state: { role: tab } })}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-500 transition hover:bg-blue-50 hover:text-blue-700"
            title="Edit"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
          <button
            onClick={() => confirmDelete(user)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
            title="Hapus"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </td>
    </tr>
  );

  // ── Kelas section for grouped siswa ─────────────────────────────
  const KelasSection = ({ kelasName, students }) => {
    const displayStudents = selectedKelas ? students : students.slice(0, 3);
    return (
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1.5 rounded-full bg-blue-600" />
            <h3 className="text-lg font-bold text-slate-800">{kelasName}</h3>
            <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-bold text-blue-700">{students.length} SISWA</span>
          </div>
          {!selectedKelas && (
            <button onClick={() => setSelectedKelas(kelasName)} className="text-xs font-semibold text-blue-600 transition hover:text-blue-800">
              Lihat Semua &rsaquo;
            </button>
          )}
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="py-3 pl-6 pr-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Nama Siswa</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">NIS</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Jenis Kelamin</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Jurusan</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Kelas</th>
                <th className="px-3 py-3 pr-6 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {displayStudents.map(u => <UserRow key={u.id} user={u} />)}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ── Flat table for guru ──────────────────────────────────────────
  const FlatTable = ({ data }) => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            <th className="py-3 pl-6 pr-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Nama Guru</th>
            <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">NIK / NIP</th>
            <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Jenis Kelamin</th>
            <th className="px-3 py-3 pr-6 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {data.map(u => <UserRow key={u.id} user={u} />)}
          {data.length === 0 && (
            <tr><td colSpan={4} className="py-12 text-center text-slate-400">Tidak ada data guru ditemukan.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-64 px-8 py-10">

        {/* Header */}
        {selectedKelas ? (
          <div className="mb-8">
            <button onClick={() => setSelectedKelas(null)} className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Kembali
            </button>
            <h1 className="text-[28px] font-bold text-blue-600 uppercase tracking-wide">Daftar Siswa — {selectedKelas}</h1>
          </div>
        ) : (
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <h1 className="text-[28px] font-bold text-blue-600 uppercase tracking-wide">Manajemen Data Pengguna</h1>
            <button onClick={() => navigate("/register")} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 hover:shadow-lg">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
              Buat Akun Pengguna
            </button>
          </div>
        )}

        {/* Tabs + search */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <button onClick={() => { setTab("siswa"); setSelectedKelas(null); }} className={`px-6 py-3 text-sm font-semibold transition ${tab === "siswa" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}>Daftar Siswa</button>
            <button onClick={() => { setTab("guru"); setSelectedKelas(null); }} className={`px-6 py-3 text-sm font-semibold transition ${tab === "guru" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}>Daftar Guru</button>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau NIS/NIP…" className="w-64 rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-16">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <p className="text-sm font-medium text-slate-500">Memuat data pengguna…</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
            <p className="font-semibold text-rose-700">{error}</p>
            <button onClick={fetchUsers} className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700">Coba Lagi</button>
          </div>
        ) : tab === "guru" ? (
          <>
            <FlatTable data={paged} />
            {renderPagination()}
          </>
        ) : selectedKelas ? (
          <>
            {grouped && grouped.filter(([k]) => k === selectedKelas).map(([kelas, students]) => (
              <KelasSection key={kelas} kelasName={kelas} students={students} />
            ))}
          </>
        ) : grouped ? (
          <>
            {grouped.map(([kelas, students]) => (
              <KelasSection key={kelas} kelasName={kelas} students={students} />
            ))}
            {grouped.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">Tidak ada data siswa ditemukan.</div>
            )}
          </>
        ) : null}
      </div>

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm animate-[fadeIn_0.2s_ease] rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
              <svg className="h-6 w-6 text-rose-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Hapus Pengguna?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Yakin ingin menghapus <span className="font-semibold text-slate-700">{deleteModal.user?.nama_lengkap || deleteModal.user?.nama}</span>? Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={cancelDelete} disabled={deleting} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Batal</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50">
                {deleting ? "Menghapus…" : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
