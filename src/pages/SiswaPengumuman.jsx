import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getMataPelajaranSiswa, getPengumuman, getCurrentUserProfile } from "../services/authService";
import SiswaLayout from "../components/SiswaLayout";
import { getErrorMessage } from "../utils/translateError";
import echo from "../utils/echo";
import { toast, confirmDialog } from "../utils/notify";

const PER_PAGE = 10;

export default function SiswaPengumuman() {
  const navigate = useNavigate();

  const [pengumumanList, setPengumumanList] = useState([]);
  const [mataPelajaranSiswa, setMataPelajaranSiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMapel, setSelectedMapel] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Fetch mata pelajaran siswa
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const resMataPelajaran = await getMataPelajaranSiswa();
      const mapelData = resMataPelajaran.data?.data || resMataPelajaran.data || [];
      const mapelList = Array.isArray(mapelData) ? mapelData : [];
      setMataPelajaranSiswa(mapelList);

      if (mapelList.length > 0) {
        setSelectedMapel(mapelList[0].mapel_id || mapelList[0].mata_pelajaran_id || mapelList[0].id);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat data pengumuman"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const fetchPengumumanByMapel = async () => {
      setLoading(true);
      setError("");
      try {
        const payload = selectedMapel ? { mapel_id: selectedMapel } : {};
        const resPengumuman = await getPengumuman(payload);
        const pengData = resPengumuman.data?.data || resPengumuman.data || [];
        setPengumumanList(Array.isArray(pengData) ? pengData : []);
      } catch (err) {
        setError(getErrorMessage(err, "Gagal memuat data pengumuman"));
      } finally {
        setLoading(false);
      }
    };

    fetchPengumumanByMapel();
  }, [selectedMapel]);

  // Real-time listeners untuk semua mata pelajaran siswa
  useEffect(() => {
    if (mataPelajaranSiswa.length === 0) return;

    const unsubscribers = mataPelajaranSiswa.map((mapel) => {
      const mapelId = mapel.mapel_id || mapel.mata_pelajaran_id || mapel.id;
      const channelName = `pengumuman.mapel.${mapelId}`;
      console.log(`[Echo Siswa] Subscribe ke channel: ${channelName}`);
      const channel = echo.private(channelName);

      channel.subscribed(() => {
        console.log(`[Echo Siswa] ✅ Subscribe berhasil: ${channelName}`);
      });

      channel.error((error) => {
        console.error(`[Echo Siswa] ❌ Error subscribe: ${channelName}`, error);
      });

      const handleNewPengumuman = (e) => {
        console.log("[Echo Siswa] Pengumaman baru diterima:", e);
        const newPengumuman = e.pengumuman || e;
        if (newPengumuman?.id) {
          setPengumumanList((prev) => {
            const exists = prev.find((p) => p.id === newPengumuman.id);
            if (exists) return prev;
            return [newPengumuman, ...prev];
          });
          toast(`Pengumaman baru di ${mapel.nama_mapel}!`, "info");
        }
      };

      channel.listen(".App\\Events\\PengumumanCreated", handleNewPengumuman);
      channel.listen(".PengumumanCreated", handleNewPengumuman);
      channel.listen("PengumumanCreated", handleNewPengumuman);

      return () => {
        console.log(`[Echo Siswa] Unsubscribe dari channel: ${channelName}`);
        echo.leaveChannel(channelName);
      };
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub?.());
    };
  }, [mataPelajaranSiswa]);

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

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const mapelName = mataPelajaranSiswa.find(
    (m) => String(m.mapel_id || m.mata_pelajaran_id || m.id) === String(selectedMapel)
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
    <SiswaLayout title="Pengumaman">
      <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Pengumaman</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pantau pengumaman terbaru dari guru-guru Anda
          </p>
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
              {mataPelajaranSiswa.map((m) => (
                <option
                  key={m.id}
                  value={m.mapel_id || m.mata_pelajaran_id || m.id}
                >
                  {m.nama_mapel || m.mata_pelajaran}
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
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                        <svg
                          className="h-5 w-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="mb-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[10px] sm:text-xs font-semibold text-emerald-700">
                            {(() => {
                              const match = mataPelajaranSiswa.find(
                                (m) => String(m.mapel_id || m.mata_pelajaran_id || m.id) === String(pengumuman.mapel_id)
                              );
                              return match?.nama_mapel || match?.mata_pelajaran || pengumuman.nama_mapel || pengumuman.mata_pelajaran || "Mata Pelajaran";
                            })()}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">
                          {pengumuman.judul}
                        </h3>
                        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
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
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {formatDate(pengumuman.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
                  <svg
                    className="mx-auto mb-4 h-12 w-12 text-slate-300"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                    />
                  </svg>
                  <p className="font-medium">Belum ada pengumaman untuk mata pelajaran ini.</p>
                </div>
              )}
            </div>
            {renderPagination()}
          </>
        )}
      </div>
    </SiswaLayout>
  );
}
