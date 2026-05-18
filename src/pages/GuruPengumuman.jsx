import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getPengumuman, getKelasGuru, deletePengumuman } from "../services/authService";
import GuruLayout from "../components/GuruLayout";
import echo from "../utils/echo";
import { toast } from "../utils/notify";

const PER_PAGE = 10;

export default function GuruPengumuman() {
  const navigate = useNavigate();

  const [pengumumanList, setPengumumanList] = useState([]);
  const [kelasGuru, setKelasGuru] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMapel, setSelectedMapel] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
  const [deleting, setDeleting] = useState(false);

  // Fetch kelas guru
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const resKelas = await getKelasGuru();
      const kelasList = resKelas.data?.data || resKelas.data || [];
      const list = Array.isArray(kelasList) ? kelasList : [];
      setKelasGuru(list);

      if (list.length > 0) {
        setSelectedMapel(list[0].mapel_id || list[0].mata_pelajaran_id || list[0].id);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat data pengumuman");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedMapel) {
      setPengumumanList([]);
      return;
    }

    const fetchPengumumanByMapel = async () => {
      setLoading(true);
      setError("");
      try {
        const resPengumuman = await getPengumuman({ mapel_id: selectedMapel });
        const pengData = resPengumuman.data?.data || resPengumuman.data || [];
        setPengumumanList(Array.isArray(pengData) ? pengData : []);
      } catch (err) {
        setError(err?.response?.data?.message || "Gagal memuat data pengumuman");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPengumumanByMapel();
  }, [selectedMapel]);

  // Real-time listener untuk pengumaman baru
  useEffect(() => {
    if (!selectedMapel) return;

    const channelName = `pengumuman.mapel.${selectedMapel}`;
    console.log(`[Echo] Subscribe ke channel: ${channelName}`);
    const channel = echo.private(channelName);

    channel.subscribed(() => {
      console.log(`[Echo] ✅ Subscribe berhasil: ${channelName}`);
    });

    channel.error((error) => {
      console.error(`[Echo] ❌ Error subscribe: ${channelName}`, error);
    });

    const handleNewPengumuman = (e) => {
      console.log("[Echo] Pengumaman baru diterima:", e);
      const newPengumuman = e.pengumuman || e;
      if (newPengumuman?.id) {
        setPengumumanList((prev) => {
          const exists = prev.find((p) => p.id === newPengumuman.id);
          return exists ? prev : [newPengumuman, ...prev];
        });
        toast("Ada pengumaman baru!", "info");
      }
    };

    channel.listen(".App\\Events\\PengumumanCreated", handleNewPengumuman);
    channel.listen(".PengumumanCreated", handleNewPengumuman);
    channel.listen("PengumumanCreated", handleNewPengumuman);

    return () => {
      echo.leaveChannel(channelName);
    };
  }, [selectedMapel]);

  // Filter pengumuman
  const filtered = useMemo(() => {
    return pengumumanList.filter((p) => {
      const matchesMapel =
        !selectedMapel ||
        String(p.mapel_id || p.mata_pelajaran_id) === String(selectedMapel);
      const matchesSearch =
        !search ||
        (p.judul || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.deskripsi || "").toLowerCase().includes(search.toLowerCase());
      return matchesMapel && matchesSearch;
    });
  }, [pengumumanList, selectedMapel, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [selectedMapel, search]);

  const handleDelete = async () => {
    if (!deleteModal.item) return;
    setDeleting(true);
    try {
      await deletePengumuman(deleteModal.item.id);
      setPengumumanList((prev) => prev.filter((p) => p.id !== deleteModal.item.id));
      setDeleteModal({ open: false, item: null });
      toast("Pengumaman berhasil dihapus", "success");
    } catch (err) {
      toast(err?.response?.data?.message || "Gagal menghapus pengumaman", "error");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const mapelName = kelasGuru.find(
    (k) => String(k.mapel_id || k.mata_pelajaran_id || k.id) === String(selectedMapel)
  )?.nama_mapel || "Semua Mata Pelajaran";

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
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`sep-${i}`} className="px-2 text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-9 w-9 rounded-lg text-sm font-bold transition ${
                page === p
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <GuruLayout title="Kelola Pengumuman">
      <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">Kelola Pengumuman</h1>
            <p className="mt-1 text-sm text-slate-500">
              Kelola semua pengumaman untuk mata pelajaran Anda
            </p>
          </div>
          <button
            onClick={() => navigate("/kelas")}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 hover:shadow-lg"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Buat Pengumaman
          </button>
        </div>

        {/* Filter & Search */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          {/* Filter Mata Pelajaran */}
          <div className="flex-1">
            <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
              Filter Mata Pelajaran
            </label>
            <select
              value={selectedMapel || ""}
              onChange={(e) => setSelectedMapel(e.target.value || null)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Semua Mata Pelajaran</option>
              {kelasGuru.map((k) => (
                <option
                  key={k.id}
                  value={k.mapel_id || k.mata_pelajaran_id || k.id}
                >
                  {k.nama_mapel || k.mata_pelajaran}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex-1">
            <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
              Cari Judul atau Isi
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari pengumaman..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-16">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <p className="text-sm font-medium text-slate-500">Memuat pengumaman...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
            <p className="font-semibold text-rose-700">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paged.length > 0 ? (
                paged.map((pengumuman) => (
                  <div
                    key={pengumuman.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800">
                          {pengumuman.judul}
                        </h3>
                        <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                          {pengumuman.deskripsi}
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            {formatDate(pengumuman.created_at)}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700">
                            {pengumuman.nama_mapel || pengumuman.mata_pelajaran || "Mata Pelajaran"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() =>
                            navigate(`/kelas/${pengumuman.mapel_id || pengumuman.mata_pelajaran_id}/edit-pengumuman/${pengumuman.id}`)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-500 transition hover:bg-blue-50 hover:text-blue-700"
                          title="Edit"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, item: pengumuman })}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                          title="Hapus"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
                  Belum ada pengumaman untuk mata pelajaran ini.
                </div>
              )}
            </div>
            {renderPagination()}
          </>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
              <svg
                className="h-6 w-6 text-rose-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Hapus Pengumaman?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Yakin ingin menghapus pengumaman <span className="font-semibold text-slate-700">"{deleteModal.item?.judul}"</span>? Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, item: null })}
                disabled={deleting}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </GuruLayout>
  );
}
