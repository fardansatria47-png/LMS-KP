import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardSummary, getCurrentUser, getDashboardGuru, getDashboardSiswa } from "../services/authService";
import { getErrorMessage } from "../utils/translateError";
import AdminDashboard from "./AdminDashboard";
import GuruDashboard from "./GuruDashboard";
import SiswaDashboard from "./SiswaDashboard";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError("");
      try {
        // Ambil user dari API /me (sumber kebenaran utama)
        const resUser = await getCurrentUser();
        const userData = resUser.data?.data || resUser.data;
        setCurrentUser(userData);

        // Ambil role dari API — JANGAN fallback ke "admin" secara otomatis
        const roleFromAPI = (
          userData?.role ||
          (Array.isArray(userData?.roles) ? userData.roles[0] : null)
        )?.toLowerCase?.() || null;

        if (!roleFromAPI) {
          // Jika backend tidak mengembalikan role, paksa logout untuk keamanan
          console.error("[Auth] Role tidak ditemukan dari API /me. Paksa logout.");
          localStorage.removeItem("user_role");
          navigate("/login");
          return;
        }

        // Cross-validasi dengan role yang tersimpan di localStorage saat login
        const cachedRole = localStorage.getItem("user_role");
        if (cachedRole && cachedRole !== roleFromAPI) {
          // Role tidak cocok — kemungkinan token milik orang lain atau data korup
          console.error(`[Auth] Role mismatch! Cache: ${cachedRole}, API: ${roleFromAPI}. Paksa logout.`);
          localStorage.removeItem("user_role");
          navigate("/login");
          return;
        }

        // Perbarui cache localStorage dengan role terbaru dari API
        localStorage.setItem("user_role", roleFromAPI);

        if (roleFromAPI === "guru") {
          const resGuru = await getDashboardGuru();
          setSummary(resGuru.data?.data || resGuru.data);
        } else if (roleFromAPI === "siswa" || roleFromAPI === "murid") {
          const resSiswa = await getDashboardSiswa();
          setSummary(resSiswa.data?.data || resSiswa.data);
        } else if (roleFromAPI === "admin") {
          const resSummary = await getDashboardSummary();
          setSummary(resSummary.data?.data || resSummary.data);
        } else {
          // Role tidak dikenal — paksa logout
          console.error(`[Auth] Role tidak dikenal: "${roleFromAPI}". Paksa logout.`);
          localStorage.removeItem("user_role");
          navigate("/login");
          return;
        }
      } catch (err) {
        setError(getErrorMessage(err, "Gagal memuat data dashboard"));
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-slate-500">
          <svg className="animate-spin mx-auto h-8 w-8 text-blue-600 mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm font-medium">Memuat data...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-rose-700 max-w-md">
          <p className="font-semibold">{error}</p>
        </div>
      </main>
    );
  }

  // Gunakan role yang sudah divalidasi dari localStorage (bukan fallback "admin")
  const role = (currentUser?.role || localStorage.getItem("user_role") || "").toLowerCase();
  const isGuru = role === "guru";
  const isSiswa = role === "siswa" || role === "murid";

  if (isGuru) {
    return <GuruDashboard user={currentUser} summary={summary} />;
  }

  if (isSiswa) {
    return <SiswaDashboard user={currentUser} summary={summary} />;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminDashboard summary={summary} navigate={navigate} />
    </main>
  );
}
