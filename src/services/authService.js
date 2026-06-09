import API from "../api/api";

export const registerUser = async (data) => {
  return await API.post("/register", data);
};

export const loginUser = async (data) => {
  return await API.post("/login", data);
};

export const getCurrentUser = async () => {
  return await API.get("/me");
};

// Alternative endpoints to try
// export const getCurrentUserAlt = async () => {
//   return await API.get("/me");
// };

export const getCurrentUserProfile = async () => {
  return await API.get("/me");
};

export const getDashboardSummary = async () => {
  return await API.get("/dashboard/summary");
};

export const getDashboardGuru = async () => {
  return await API.get("/dashboard/guru");
};

export const getDashboardSiswa = async () => {
  return await API.get("/dashboard/siswa");
};

export const getKelasGuru = async () => {
  return await API.get("/guru/mata-pelajaran");
};

// ── Materi (Guru) ────────────────────────────────────────────────────
export const getMateri = async (params = {}) => {
  return await API.get("/guru/materi", { params });
};
export const getMateriById = async (id) => {
  return await API.get(`/guru/materi/${id}`);
};
export const createMateri = async (data) => {
  return await API.post("/guru/materi", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const updateMateri = async (id, data) => {
  return await API.put(`/guru/materi/${id}`, data);
};
export const deleteMateri = async (id) => {
  return await API.delete(`/guru/materi/${id}`);
};

// ── Tugas (Guru) ─────────────────────────────────────────────────────
export const getTugas = async (params = {}) => {
  return await API.get("/tugas", { params }); // Adjusting to api/tugas as per screenshot
};
export const getTugasById = async (id) => {
  return await API.get(`/tugas/${id}`);
};
export const createTugas = async (data) => {
  return await API.post("/tugas", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const updateTugas = async (id, data) => {
  // If data is FormData, we usually use POST with _method=PUT for Laravel/PHP backends
  if (data instanceof FormData) {
    data.append("_method", "PUT");
    return await API.post(`/tugas/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return await API.put(`/tugas/${id}`, data);
};
export const deleteTugas = async (id) => {
  return await API.delete(`/tugas/${id}`);
};

export const getPengumpulanGuru = async (tugasId, params = {}) => {
  return await API.get(`/tugas/${tugasId}/pengumpulan`, { params });
};

export const simpanNilaiGuru = async (pengumpulanId, nilai, catatan = "") => {
  return await API.post(`/pengumpulan/${pengumpulanId}/nilai`, { nilai, catatan });
};

// ── Download Rekap Nilai ──────────────────────────────────────────────
export const downloadRecapNilai = async (params = {}) => {
  return await API.get("/recap/nilai", {
    params,
    responseType: "blob", // Penting untuk mengunduh file (Excel/PDF)
  });
};

export const createTugasSusulan = async (data) => {
  return await API.post("/tugas-susulan", data);
};

export const deleteTugasSusulan = async (id) => {
  return await API.delete(`/tugas-susulan/${id}`);
};

export const getTugasSusulanGuru = async (params = {}) => {
  return await API.get("/tugas-susulan", { params });
};

// ── Data Pengguna ────────────────────────────────────────────────────

// Siswa
export const getSiswa = async (params = {}) => {
  return await API.get("/siswa", { params });
};

export const getSiswaById = async (id) => {
  return await API.get(`/siswa/${id}`);
};

export const getMataPelajaranSiswa = async () => {
  return await API.get("/siswa/mata-pelajaran");
};

export const getMataPelajaranSiswaDetail = async (id) => {
  return await API.get(`/siswa/mata-pelajaran/${id}`);
};

export const getTugasSiswa = async (mapel_id) => {
  return await API.get(`/siswa/mata-pelajaran/${mapel_id}/tugas`);
};

export const getTugasSiswaDetail = async (id) => {
  return await API.get(`/siswa/tugas/${id}`);
};

export const submitTugasSiswa = async (data) => {
  return await API.post("/pengumpulan", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const batalkanPengumpulanSiswa = async (pengumpulanId) => {
  return await API.delete(`/siswa/pengumpulan/${pengumpulanId}`);
};

// ── Tugas Susulan Siswa (endpoint baru) ──────────────────────────────
export const getTugasSusulanSiswa = async () => {
  return await API.get("/siswa/tugas-susulan");
};

export const getTugasSusulanSiswaDetail = async (id) => {
  return await API.get(`/siswa/tugas-susulan/${id}`);
};

export const createSiswa = async (data) => {
  return await API.post("/siswa", data);
};

export const updateSiswa = async (id, data) => {
  return await API.put(`/siswa/${id}`, data);
};

export const deleteSiswa = async (id) => {
  return await API.delete(`/siswa/${id}`);
};

// Guru
export const getGuru = async (params = {}) => {
  return await API.get("/guru", { params });
};

export const getGuruById = async (id) => {
  return await API.get(`/guru/${id}`);
};

export const createGuru = async (data) => {
  return await API.post("/guru", data);
};

export const updateGuru = async (id, data) => {
  return await API.put(`/guru/${id}`, data);
};

export const deleteGuru = async (id) => {
  return await API.delete(`/guru/${id}`);
};

export const assignMapelToGuru = async (guruId, mapelIds) => {
  return await API.post(`/guru/${guruId}/assign-mapel`, { mapel_id: mapelIds });
};

export const getGuruByMapelRoute = async (id) => {
  return await API.get(`guru/${id}/mapel`);
};

// Kelas
export const getKelas = async (params = {}) => {
  return await API.get("/kelas", { params });
};

//mata pelajaran
export const getMapel = async (params = {}) => {
  return await API.get("/mata-pelajaran", { params });
};
export const getMapelFiltered = async ({ kelas_id, jurusan_id } = {}) => {
  return await API.get("/mapel/filter", { params: { kelas_id, jurusan_id } });
};
// mata pelajaran
export const getMapelById = async (id) => {
  return await API.get(`/mata-pelajaran/${id}`);
};
export const createMapel = async (data) => {
  return await API.post("/mata-pelajaran", data);
};
export const updateMapel = async (id, data) => {
  return await API.put(`/mata-pelajaran/${id}`, data);
};
export const deleteMapel = async (id) => {
  return await API.delete(`/mata-pelajaran/${id}`);
};
export const getMapelFormData = async () => {
  return await API.get("/mata-pelajaran/form-data");
};

// Jurusan
export const getJurusan = async (params = {}) => {
  return await API.get("/jurusan", { params });
};

// ── Rombel (Kelas) ──────────────────────────────────────────────────
export const getRombelFormData = async () => {
  return await API.get("/rombel/form-data");
};
export const getRombel = async (params = {}) => {
  return await API.get("/rombel", { params });
};
export const getRombelById = async (id) => {
  return await API.get(`/rombel/${id}`);
};
export const createRombel = async (data) => {
  return await API.post("/rombel", data);
};
export const updateRombel = async (id, data) => {
  return await API.put(`/rombel/${id}`, data);
};
export const deleteRombel = async (id) => {
  return await API.delete(`/rombel/${id}`);
};
export const assignSiswaToRombel = async (rombelId, siswaId) => {
  return await API.post(`/rombel/${rombelId}/assign`, { siswa_id: siswaId });
};
export const kickSiswaFromRombel = async (rombelId, siswaId) => {
  return await API.delete(`/rombel/${rombelId}/kick/${siswaId}`);
};
export const assignMapelToRombel = async (rombelId, mapelIds) => {
  return await API.post(`/rombel/${rombelId}/assign-mapel`, { mapel_ids: mapelIds });
};
export const getRombelMapel = async (rombelId) => {
  return await API.get(`/rombel/${rombelId}/mapel`);
};

// ── Anggota Kelas ───────────────────────────────────────────────────
export const getAnggotaKelas = async (params = {}) => {
  return await API.get("/anggota-kelas", { params });
};
export const createAnggotaKelas = async (data) => {
  return await API.post("/anggota-kelas", data);
};
export const deleteAnggotaKelas = async (id) => {
  return await API.delete(`/anggota-kelas/${id}`);
};

export const getRegisterForm = async () => {
  return await API.get("/register-form");
};

// ── Siswa Guru ────────────────────────────────────────────────────────
export const getSiswaGuru = async (params = {}) => {
  return await API.get("/guru/siswa", { params });
};

// ── Pengumuman (Guru) ─────────────────────────────────────────────────
export const getPengumuman = async (params = {}) => {
  return await API.get("/pengumuman", { params });
};
export const getPengumumanById = async (id) => {
  return await API.get(`/pengumuman/${id}`);
};
export const createPengumuman = async (data) => {
  return await API.post("/pengumuman", data);
};
export const updatePengumuman = async (id, data) => {
  return await API.put(`/pengumuman/${id}`, data);
};
export const deletePengumuman = async (id) => {
  return await API.delete(`/pengumuman/${id}`);
};

// ── Profil Guru ───────────────────────────────────────────────────────
export const getGuruProfile = async () => {
  return await API.get("/guru/profile");
};
export const updateGuruPassword = async (data) => {
  return await API.put("/guru/password", data);
};

// ── Profil Siswa ───────────────────────────────────────────────────────
export const getSiswaProfile = async () => {
  return await API.get("/siswa/profile");
};
export const updateSiswaPassword = async (data) => {
  return await API.put("/siswa/password", data);
};

// ── Diskusi ────────────────────────────────────────────────────────
export const getDiskusi = async (mapelId) => {
  return await API.get(`/diskusi/${mapelId}`);
};

export const sendDiskusi = async (mapelId, pesan) => {
  return await API.post(`/diskusi/${mapelId}`, { pesan });
};

export const deleteDiskusi = async (pesanId) => {
  return await API.delete(`/diskusi/${pesanId}`);
};

// ── AI Generate Soal ────────────────────────────────────────────────────────
export const generateDeskripsiAI = async (data) => {
  return await API.post("/ai/generate-deskripsi", data);
};

export const generateSoalAI = async (data) => {
  return await API.post("/bank-soal/generate", data);
};

export const getSoalAIStatus = async (logId) => {
  return await API.get(`/bank-soal/status/${logId}`);
};

// ── Import Siswa & Guru ──────────────────────────────────────────
export const importSiswa = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return await API.post("/siswa/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const importGuru = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return await API.post("/guru/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// ── Reset Password Siswa oleh Admin ─────────────────────────────────
export const resetPasswordSiswa = async (id) => {
  return await API.post(`/siswa/${id}/reset-password`);
};

// ── Reset Password Guru oleh Admin ───────────────────────────────────
export const resetPasswordGuru = async (id) => {
  return await API.post(`/guru/${id}/reset-password`);
};

// ── Kenaikan Kelas Massal ───────────────────────────────────────────
export const promoteRombel = async (sourceRombelId, targetRombelId) => {
  return await API.post("/rombel/promote", {
    source_rombel_id: sourceRombelId,
    target_rombel_id: targetRombelId,
  });
};

// ── Kelulusan Massal Kelas XII ──────────────────────────────────────
export const graduateRombel = async (rombelId, action) => {
  return await API.post("/rombel/graduate", {
    rombel_id: rombelId,
    action: action,
  });
};