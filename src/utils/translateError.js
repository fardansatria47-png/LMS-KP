/**
 * Kamus terjemahan pesan error Laravel → Bahasa Indonesia
 */
const errorTranslations = [
  // Required / Wajib isi
  { pattern: /The (.+) field is required\./i, replace: (m, field) => `Kolom ${translateFieldName(field)} wajib diisi.` },
  { pattern: /The (.+) is required\./i, replace: (m, field) => `${translateFieldName(field)} wajib diisi.` },

  // Min length
  { pattern: /The (.+) must be at least (\d+) characters\./i, replace: (m, field, n) => `${translateFieldName(field)} minimal ${n} karakter.` },
  { pattern: /The (.+) field must be at least (\d+) characters\./i, replace: (m, field, n) => `Kolom ${translateFieldName(field)} minimal ${n} karakter.` },

  // Max length
  { pattern: /The (.+) may not be greater than (\d+) characters\./i, replace: (m, field, n) => `${translateFieldName(field)} maksimal ${n} karakter.` },
  { pattern: /The (.+) must not be greater than (\d+) characters\./i, replace: (m, field, n) => `${translateFieldName(field)} tidak boleh lebih dari ${n} karakter.` },

  // Unique
  { pattern: /The (.+) has already been taken\./i, replace: (m, field) => `${translateFieldName(field)} sudah digunakan, silakan gunakan yang lain.` },

  // Email
  { pattern: /The (.+) must be a valid email address\./i, replace: (m, field) => `${translateFieldName(field)} harus berupa alamat email yang valid.` },
  { pattern: /The (.+) field must be a valid email address\./i, replace: (m, field) => `Kolom ${translateFieldName(field)} harus berupa alamat email yang valid.` },

  // Confirmed / konfirmasi
  { pattern: /The (.+) confirmation does not match\./i, replace: (m, field) => `Konfirmasi ${translateFieldName(field)} tidak cocok.` },
  { pattern: /The (.+) and (.+) must match\./i, replace: (m, f1, f2) => `${translateFieldName(f1)} dan ${translateFieldName(f2)} harus sama.` },

  // Numeric
  { pattern: /The (.+) must be a number\./i, replace: (m, field) => `${translateFieldName(field)} harus berupa angka.` },
  { pattern: /The (.+) must be an integer\./i, replace: (m, field) => `${translateFieldName(field)} harus berupa bilangan bulat.` },

  // Min/Max numeric
  { pattern: /The (.+) must be at least (\d+)\./i, replace: (m, field, n) => `${translateFieldName(field)} minimal bernilai ${n}.` },
  { pattern: /The (.+) must not be greater than (\d+)\./i, replace: (m, field, n) => `${translateFieldName(field)} tidak boleh lebih dari ${n}.` },

  // String
  { pattern: /The (.+) must be a string\./i, replace: (m, field) => `${translateFieldName(field)} harus berupa teks.` },

  // Exists
  { pattern: /The selected (.+) is invalid\./i, replace: (m, field) => `${translateFieldName(field)} yang dipilih tidak valid.` },

  // In
  { pattern: /The selected (.+) is not a valid option\./i, replace: (m, field) => `Pilihan ${translateFieldName(field)} tidak valid.` },

  // Password
  { pattern: /The (.+) must be at least (\d+) characters and contain at least one uppercase letter/i, replace: (m, field, n) => `${translateFieldName(field)} minimal ${n} karakter dan harus mengandung huruf kapital.` },
  { pattern: /incorrect password/i, replace: () => `Kata sandi lama tidak benar.` },
  { pattern: /wrong password/i, replace: () => `Kata sandi salah.` },

  // Login / Auth
  { pattern: /these credentials do not match our records\./i, replace: () => `Username atau kata sandi yang Anda masukkan salah.` },
  { pattern: /invalid credentials/i, replace: () => `Username atau kata sandi salah.` },
  { pattern: /unauthenticated\./i, replace: () => `Sesi Anda telah berakhir, silakan login kembali.` },
  { pattern: /unauthorized/i, replace: () => `Anda tidak memiliki akses untuk melakukan tindakan ini.` },
  { pattern: /too many login attempts/i, replace: () => `Terlalu banyak percobaan login. Coba lagi nanti.` },

  // File
  { pattern: /The (.+) must be a file\./i, replace: (m, field) => `${translateFieldName(field)} harus berupa file.` },
  { pattern: /The (.+) must be an image\./i, replace: (m, field) => `${translateFieldName(field)} harus berupa gambar.` },
  { pattern: /The (.+) may not be greater than (\d+) kilobytes\./i, replace: (m, field, n) => `Ukuran file ${translateFieldName(field)} tidak boleh lebih dari ${n} KB.` },

  // Date
  { pattern: /The (.+) is not a valid date\./i, replace: (m, field) => `${translateFieldName(field)} bukan tanggal yang valid.` },
  { pattern: /The (.+) must be a date after (.+)\./i, replace: (m, field, after) => `${translateFieldName(field)} harus lebih dari ${after}.` },

  // Generic server error
  { pattern: /server error/i, replace: () => `Terjadi kesalahan pada server. Coba lagi nanti.` },
  { pattern: /internal server error/i, replace: () => `Kesalahan internal server.` },
];

/**
 * Kamus nama kolom (field) Laravel → Bahasa Indonesia
 */
const fieldNames = {
  username:              "Nama Pengguna / NIS / NIK",
  password:              "Kata Sandi",
  password_confirmation: "Konfirmasi Kata Sandi",
  email:                 "Email",
  nama:                  "Nama",
  nama_lengkap:          "Nama Lengkap",
  role:                  "Peran",
  mapel_id:              "Mata Pelajaran",
  rombel_id:             "Rombel / Kelas",
  judul:                 "Judul",
  deskripsi:             "Deskripsi",
  isi:                   "Isi",
  materi:                "Materi",
  file:                  "File",
  gambar:                "Gambar",
  tanggal:               "Tanggal",
  tenggat_waktu:         "Tenggat Waktu",
  nilai:                 "Nilai",
  catatan:               "Catatan",
  jenis_kelamin:         "Jenis Kelamin",
  current_password:      "Kata Sandi Saat Ini",
  new_password:          "Kata Sandi Baru",
  kelas_id:              "Kelas",
  jurusan_id:            "Jurusan",
  tingkat:               "Tingkat",
  nama_rombel:           "Nama Rombel",
  nama_jurusan:          "Nama Jurusan",
  nama_mapel:            "Nama Mata Pelajaran",
  guru_id:               "Guru",
  siswa_id:              "Siswa",
  tugas_id:              "Tugas",
};

function translateFieldName(field) {
  const key = field.toLowerCase().replace(/ /g, "_");
  return fieldNames[key] || field.replace(/_/g, " ");
}

/**
 * Terjemahkan satu pesan error Laravel ke Bahasa Indonesia.
 * @param {string} msg
 * @returns {string}
 */
export function translateErrorMessage(msg) {
  if (!msg || typeof msg !== "string") return msg;

  for (const { pattern, replace } of errorTranslations) {
    if (pattern.test(msg)) {
      return msg.replace(pattern, replace);
    }
  }

  return msg; // Kembalikan apa adanya jika tidak ada terjemahan
}

/**
 * Proses error dari Axios (response Laravel) dan kembalikan pesan Bahasa Indonesia.
 * Mendukung:
 *  - err.response.data.errors (422 validation)
 *  - err.response.data.message
 *  - err.response.data.error
 *  - Network errors
 *
 * @param {any} err - Error object dari Axios catch
 * @param {string} [defaultMessage] - Pesan default jika tidak ada yang cocok
 * @returns {string}
 */
export function getErrorMessage(err, defaultMessage = "Terjadi kesalahan. Silakan coba lagi.") {
  if (!err) return defaultMessage;

  if (err.response) {
    const { status, data } = err.response;

    // Validasi 422 dengan banyak field errors
    if (status === 422 && data?.errors) {
      const messages = Object.values(data.errors).flat();
      return messages.map(translateErrorMessage).join(" | ");
    }

    // Status 502 Bad Gateway
    if (status === 502) return "Server tidak dapat dijangkau (502). Coba lagi nanti.";

    // Status 503 Service Unavailable
    if (status === 503) return "Layanan sedang tidak tersedia (503). Coba lagi nanti.";

    // Status 429 Too Many Requests
    if (status === 429) return "Terlalu banyak percobaan. Silakan tunggu sebentar.";

    // Pesan tunggal dari backend
    const rawMessage = data?.message || data?.error || `Kesalahan ${status || "tidak diketahui"}.`;
    return translateErrorMessage(rawMessage);
  }

  // Network Error
  if (err.message === "Network Error") {
    return "Gagal terhubung ke server. Periksa koneksi internet Anda.";
  }

  // Timeout
  if (err.code === "ECONNABORTED") {
    return "Permintaan melebihi batas waktu. Coba lagi.";
  }

  return translateErrorMessage(err.message) || defaultMessage;
}
