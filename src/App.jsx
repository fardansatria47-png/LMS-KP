import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { confirmDialog } from "./utils/notify";
import { logoutUser } from "./services/authService";
import Login from "./pages/login";
import Register from "./pages/register";
import Profile from "./pages/profile";
import Dashboard from "./pages/dashboard";
import DataPengguna from "./pages/DataPengguna";
import EditUser from "./pages/EditUser";
import MataPelajaran from "./pages/MataPelajaran";
import TambahMataPelajaran from "./pages/TambahMataPelajaran";
import EditMataPelajaran from "./pages/EditMataPelajaran";
import AnggotaKelas from "./pages/AnggotaKelas";
import TambahAnggotaKelas from "./pages/TambahAnggotaKelas";
import EditAnggotaKelas from "./pages/EditAnggotaKelas";
import TambahRombel from "./pages/TambahRombel";
import AssignMapel from "./pages/AssignMapel";
import Kelas from "./pages/Kelas";
import KelasDetail from "./pages/KelasDetail";
import UploadMateri from "./pages/UploadMateri";
import MateriDetail from "./pages/MateriDetail";
import PengumpulanTugas from "./pages/PengumpulanTugas";
import BuatTugas from "./pages/BuatTugas";
import EditTugas from "./pages/EditTugas";
import BuatPengumuman from "./pages/BuatPengumuman";
import EditPengumuman from "./pages/EditPengumuman";
import GuruRPP from "./pages/GuruRPP";
import BuatRPP from "./pages/BuatRPP";
import EditRPP from "./pages/EditRPP";

import SiswaRuangBelajar from "./pages/SiswaRuangBelajar";
import SiswaPengumuman from "./pages/SiswaPengumuman";
import SiswaMateriDetail from "./pages/SiswaMateriDetail";
import SiswaTugasDetail from "./pages/SiswaTugasDetail";
import SiswaTugasSusulan from "./pages/SiswaTugasSusulan";
import SiswaTugasSusulanDetail from "./pages/SiswaTugasSusulanDetail";

function App() {
  // 🍪 Autentikasi kini berbasis cookie HttpOnly yang dikelola backend.
  // Gunakan user_role di localStorage sebagai "penanda sesi" lokal (bukan token).
  // Cookie asli tidak bisa dibaca JS (HttpOnly), jadi ini hanya untuk routing UI.
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("user_role")
  );

  // --- START TEST REVERB LISTENER ---
  // Kode sementara untuk mengecek endpoint test reverb dari backend
  useEffect(() => {
    if (window.Echo) {
      window.Echo.channel('forum')
        .listen('.forum.message', (data) => {
          console.log("Pesan Realtime Diterima:", data);
          alert("Pesan realtime masuk (Test Reverb): " + (data.message?.message || data.message || "Berhasil!"));
        });
    }
  }, []);
  // --- END TEST REVERB LISTENER ---

  const handleLogout = async () => {
    const ok = await confirmDialog("Yakin ingin keluar?", { isDanger: true, title: "Keluar" });
    if (!ok) return;
    try {
      // Minta backend untuk menghapus cookie HttpOnly
      await logoutUser();
    } catch (e) {
      console.warn("[Logout] API logout gagal, melanjutkan pembersihan lokal:", e);
    }
    // Bersihkan state lokal
    localStorage.removeItem("user_role");
    setIsAuthenticated(false);
    window.location.href = "/login";
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={() => setIsAuthenticated(true)} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/data-pengguna" element={isAuthenticated ? <DataPengguna /> : <Navigate to="/login" />} />
        <Route path="/edit-user/:id" element={isAuthenticated ? <EditUser /> : <Navigate to="/login" />} />
        <Route path="/mata-pelajaran" element={isAuthenticated ? <MataPelajaran /> : <Navigate to="/login" />} />
        <Route path="/tambah-mata-pelajaran" element={isAuthenticated ? <TambahMataPelajaran /> : <Navigate to="/login" />} />
        <Route path="/edit-mata-pelajaran/:id" element={isAuthenticated ? <EditMataPelajaran /> : <Navigate to="/login" />} />
        <Route path="/anggota-kelas" element={isAuthenticated ? <AnggotaKelas /> : <Navigate to="/login" />} />
        <Route path="/tambah-anggota-kelas" element={isAuthenticated ? <TambahAnggotaKelas /> : <Navigate to="/login" />} />
        <Route path="/tambah-kelas" element={isAuthenticated ? <TambahRombel /> : <Navigate to="/login" />} />
        <Route path="/edit-anggota-kelas/:id" element={isAuthenticated ? <EditAnggotaKelas /> : <Navigate to="/login" />} />
        <Route path="/assign-mapel" element={isAuthenticated ? <AssignMapel /> : <Navigate to="/login" />} />
        <Route path="/kelas" element={isAuthenticated ? <Kelas /> : <Navigate to="/login" />} />
        <Route path="/kelas/:id" element={isAuthenticated ? <KelasDetail /> : <Navigate to="/login" />} />
        <Route path="/ruang-belajar/:id" element={isAuthenticated ? <SiswaRuangBelajar /> : <Navigate to="/login" />} />
        <Route path="/ruang-belajar/:id/materi/:materiId" element={isAuthenticated ? <SiswaMateriDetail /> : <Navigate to="/login" />} />
        <Route path="/ruang-belajar/:id/tugas/:tugasId" element={isAuthenticated ? <SiswaTugasDetail /> : <Navigate to="/login" />} />
        <Route path="/kelas/:id/upload-materi" element={isAuthenticated ? <UploadMateri /> : <Navigate to="/login" />} />
        <Route path="/kelas/:id/materi/:materiId" element={isAuthenticated ? <MateriDetail /> : <Navigate to="/login" />} />
        <Route path="/kelas/:id/tugas/:tugasId/pengumpulan" element={isAuthenticated ? <PengumpulanTugas /> : <Navigate to="/login" />} />
        <Route path="/kelas/:id/buat-tugas" element={isAuthenticated ? <BuatTugas /> : <Navigate to="/login" />} />
        <Route path="/kelas/:id/edit-tugas/:tugasId" element={isAuthenticated ? <EditTugas /> : <Navigate to="/login" />} />
        <Route path="/kelas/:id/buat-pengumuman" element={isAuthenticated ? <BuatPengumuman /> : <Navigate to="/login" />} />
        <Route path="/kelas/:id/edit-pengumuman/:pengumumanId" element={isAuthenticated ? <EditPengumuman /> : <Navigate to="/login" />} />
        {/* ── RPP Routes ── */}
        <Route path="/rpp" element={isAuthenticated ? <GuruRPP /> : <Navigate to="/login" />} />
        <Route path="/rpp/buat" element={isAuthenticated ? <BuatRPP /> : <Navigate to="/login" />} />
        <Route path="/rpp/edit/:id" element={isAuthenticated ? <EditRPP /> : <Navigate to="/login" />} />
        <Route path="/siswa-pengumuman" element={isAuthenticated ? <SiswaPengumuman /> : <Navigate to="/login" />} />
        <Route path="/siswa/tugas-susulan" element={isAuthenticated ? <SiswaTugasSusulan /> : <Navigate to="/login" />} />
        <Route path="/siswa/tugas-susulan/:id" element={isAuthenticated ? <SiswaTugasSusulanDetail /> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;