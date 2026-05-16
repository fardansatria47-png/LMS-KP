import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardSummary, getCurrentUser, getDashboardGuru, getDashboardSiswa } from "../services/authService";
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
        // Ambil user dulu untuk tahu role-nya
        const resUser = await getCurrentUser();
        const userData = resUser.data?.data || resUser.data;
        setCurrentUser(userData);

        const role = userData?.role || userData?.roles?.[0] || "admin";

        if (role === "guru") {
          // Panggil endpoint khusus guru
          const resGuru = await getDashboardGuru();
          const guruData = resGuru.data?.data || resGuru.data;
          setSummary(guruData);
        } else if (role === "siswa" || role === "murid") {
          // Panggil endpoint khusus siswa
          const resSiswa = await getDashboardSiswa();
          const siswaData = resSiswa.data?.data || resSiswa.data;
          setSummary(siswaData);
        } else {
          // Panggil endpoint admin
          const resSummary = await getDashboardSummary();
          const summaryData = resSummary.data?.data || resSummary.data;
          setSummary(summaryData);
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Gagal memuat data dashboard");
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

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

  const role = currentUser?.role || currentUser?.roles?.[0] || "admin";
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
