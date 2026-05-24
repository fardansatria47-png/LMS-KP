import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { confirmDialog } from "./utils/notify";
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

import SiswaRuangBelajar from "./pages/SiswaRuangBelajar";
import SiswaPengumuman from "./pages/SiswaPengumuman";
import SiswaMateriDetail from "./pages/SiswaMateriDetail";
import SiswaTugasDetail from "./pages/SiswaTugasDetail";
import SiswaTugasSusulan from "./pages/SiswaTugasSusulan";
import SiswaTugasSusulanDetail from "./pages/SiswaTugasSusulanDetail";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const handleLogout = async () => {
    const ok = await confirmDialog("Yakin ingin logout?", { isDanger: true, title: "Logout" });
    if (!ok) return;
    localStorage.removeItem("token");
    setToken(null);
    window.location.href = "/login";
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login onLogin={setToken} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/data-pengguna" element={token ? <DataPengguna /> : <Navigate to="/login" />} />
        <Route path="/edit-user/:id" element={token ? <EditUser /> : <Navigate to="/login" />} />
        <Route path="/mata-pelajaran" element={token ? <MataPelajaran /> : <Navigate to="/login" />} />
        <Route path="/tambah-mata-pelajaran" element={token ? <TambahMataPelajaran /> : <Navigate to="/login" />} />
        <Route path="/edit-mata-pelajaran/:id" element={token ? <EditMataPelajaran /> : <Navigate to="/login" />} />
        <Route path="/anggota-kelas" element={token ? <AnggotaKelas /> : <Navigate to="/login" />} />
        <Route path="/tambah-anggota-kelas" element={token ? <TambahAnggotaKelas /> : <Navigate to="/login" />} />
        <Route path="/tambah-kelas" element={token ? <TambahRombel /> : <Navigate to="/login" />} />
        <Route path="/edit-anggota-kelas/:id" element={token ? <EditAnggotaKelas /> : <Navigate to="/login" />} />
        <Route path="/assign-mapel" element={token ? <AssignMapel /> : <Navigate to="/login" />} />
        <Route path="/kelas" element={token ? <Kelas /> : <Navigate to="/login" />} />
        <Route path="/kelas/:id" element={token ? <KelasDetail /> : <Navigate to="/login" />} />
        <Route path="/ruang-belajar/:id" element={token ? <SiswaRuangBelajar /> : <Navigate to="/login" />} />
        <Route path="/ruang-belajar/:id/materi/:materiId" element={token ? <SiswaMateriDetail /> : <Navigate to="/login" />} />
        <Route path="/ruang-belajar/:id/tugas/:tugasId" element={token ? <SiswaTugasDetail /> : <Navigate to="/login" />} />
        <Route path="/kelas/:id/upload-materi" element={token ? <UploadMateri /> : <Navigate to="/login" />} />
        <Route path="/kelas/:id/materi/:materiId" element={token ? <MateriDetail /> : <Navigate to="/login" />} />
        <Route path="/kelas/:id/tugas/:tugasId/pengumpulan" element={token ? <PengumpulanTugas /> : <Navigate to="/login" />} />
        <Route path="/kelas/:id/buat-tugas" element={token ? <BuatTugas /> : <Navigate to="/login" />} />
        <Route path="/kelas/:id/edit-tugas/:tugasId" element={token ? <EditTugas /> : <Navigate to="/login" />} />
        <Route path="/kelas/:id/buat-pengumuman" element={token ? <BuatPengumuman /> : <Navigate to="/login" />} />
        <Route path="/kelas/:id/edit-pengumuman/:pengumumanId" element={token ? <EditPengumuman /> : <Navigate to="/login" />} />
        <Route path="/siswa-pengumuman" element={token ? <SiswaPengumuman /> : <Navigate to="/login" />} />
        <Route path="/siswa/tugas-susulan" element={token ? <SiswaTugasSusulan /> : <Navigate to="/login" />} />
        <Route path="/siswa/tugas-susulan/:id" element={token ? <SiswaTugasSusulanDetail /> : <Navigate to="/login" />} />
        <Route path="/profile" element={token ? <Profile /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;