# 🚫 MISTAKES LOG — BPR BAPERA BATANG
# ═══════════════════════════════════════════════════════
# PURPOSE: Catat setiap pendekatan salah, bug, dan jalan buntu
#          agar model AI TIDAK mengulangi kesalahan yang sama.
#
# HOW TO USE:
# - Tambah entry baru setiap kali ada yang gagal
# - Tanya AI: "Update MISTAKES.md dengan apa yang baru terjadi"
# - Referensikan file ini di CONTEXT.md setiap sesi
# ═══════════════════════════════════════════════════════

## TEMPLATE ENTRY BARU
```
## [YYYY-MM-DD] Judul Singkat
- ❌ **Yang dicoba:** [pendekatan yang dipakai]
- 🐛 **Yang salah:** [error atau masalah yang muncul]
- ✅ **Yang benar:** [solusi yang berhasil]
- 📁 **File terdampak:** [nama file]
- 🔒 **Aturan baru:** [aturan yang harus diikuti mulai sekarang]
```

---

## ════════════════════════════════════
## KESALAHAN UMUM — STACK (PRE-FILLED)
## ════════════════════════════════════

## [GENERAL] Environment & Security
- ❌ **Dicoba:** Hardcode URL API atau credentials langsung di source code
- 🐛 **Masalah:** Secret bocor ke Git, beda environment tidak bisa switch
- ✅ **Benar:** Semua config sensitif di `.env`, akses via `process.env.VARIABLE`
- 🔒 **Aturan:** TIDAK ADA credentials di source code. Gunakan `.env` selalu.

---

- ❌ **Dicoba:** Commit file `.env` ke Git
- 🐛 **Masalah:** Password DB, JWT_SECRET, ENCRYPTION_KEY bocor
- ✅ **Benar:** `.env` ada di `.gitignore`, gunakan `.env.example` sebagai template
- 🔒 **Aturan:** `.env` tidak pernah masuk Git. Titik.

---

## [GENERAL] Database & Migrasi
- ❌ **Dicoba:** Ubah schema langsung via query manual di PostgreSQL
- 🐛 **Masalah:** Perubahan tidak terdokumentasi, environment lain tidak ikut update
- ✅ **Benar:** Buat file migrasi baru, jalankan `npm run migrate`
- 🔒 **Aturan:** Semua perubahan schema WAJIB lewat file migrasi

---

- ❌ **Dicoba:** Hapus atau rename kolom yang sudah ada
- 🐛 **Masalah:** Break query yang sudah berjalan, data hilang
- ✅ **Benar:** Tambah kolom baru, migrate data, deprecated kolom lama bertahap
- 🔒 **Aturan:** Jangan pernah hapus/rename kolom production tanpa backup + migrasi

---

## [GENERAL] Authentication & Authorization
- ❌ **Dicoba:** Buat route API tanpa middleware auth
- 🐛 **Masalah:** Endpoint bisa diakses tanpa login
- ✅ **Benar:** Semua route yang butuh auth pakai middleware `authenticate` + `authorize(role)`
- 🔒 **Aturan:** Setiap route baru harus ada middleware auth sesuai role

---

- ❌ **Dicoba:** Simpan JWT token di localStorage
- 🐛 **Masalah:** Rentan XSS attack
- ✅ **Benar:** Gunakan HttpOnly cookie atau memory (sesuai keputusan awal project)
- 🔒 **Aturan:** Jangan ubah storage strategy JWT tanpa diskusi security

---

## [GENERAL] File Upload & MinIO
- ❌ **Dicoba:** Simpan file upload langsung ke filesystem server (`/uploads/`)
- 🐛 **Masalah:** File hilang saat container di-restart, tidak scalable
- ✅ **Benar:** Semua file upload ke MinIO bucket `bpr-bapera`
- 🔒 **Aturan:** WAJIB MinIO untuk semua file (dokumen, foto agunan, MAK)

---

## [GENERAL] Formula Kredit (KRITIS)
- ❌ **Dicoba:** Ubah threshold DSR dari 40% ke nilai lain
- 🐛 **Masalah:** Melanggar kebijakan kredit BPR, analisa jadi tidak valid
- ✅ **Benar:** DSR max 40%, RPC min 110%, DSCR min 1.2 — ini TETAP
- 🔒 **Aturan:** Formula dan threshold kredit adalah kebijakan bisnis, TIDAK BOLEH diubah tanpa persetujuan direksi

---

- ❌ **Dicoba:** Ubah bobot scoring 5C (Character 25%, dst)
- 🐛 **Masalah:** Hasil scoring tidak sesuai standar BPR
- ✅ **Benar:** Bobot 5C tetap: Character 25%, Capacity 30%, Capital 15%, Collateral 20%, Condition 10%
- 🔒 **Aturan:** Bobot scoring = locked, tidak ada negosiasi

---

## [GENERAL] API Response Format
- ❌ **Dicoba:** Return response dengan format berbeda-beda tiap endpoint
- 🐛 **Masalah:** Frontend error karena struktur tidak konsisten
- ✅ **Benar:** Selalu gunakan format standar:
  ```json
  { "success": true/false, "message": "...", "data": {...} }
  ```
- 🔒 **Aturan:** Semua response API ikuti format standar di atas

---

## [GENERAL] Docker & Container
- ❌ **Dicoba:** Jalankan `docker-compose down -v` di production
- 🐛 **Masalah:** Volume database terhapus, semua data hilang
- ✅ **Benar:** `docker-compose down -v` HANYA untuk dev/staging. Production: backup dulu
- 🔒 **Aturan:** DILARANG `down -v` di production tanpa backup PostgreSQL dulu

---

- ❌ **Dicoba:** Edit konfigurasi Nginx langsung di container yang berjalan
- 🐛 **Masalah:** Perubahan hilang saat container restart
- ✅ **Benar:** Edit file di `nginx/` folder, lalu `docker-compose restart nginx`
- 🔒 **Aturan:** Semua config Nginx di folder `nginx/`, bukan di dalam container

---

## [GENERAL] Audit Log
- ❌ **Dicoba:** Buat fitur CRUD tanpa mencatat ke `audit_logs`
- 🐛 **Masalah:** Perubahan data tidak terlacak, tidak bisa audit trail
- ✅ **Benar:** Setiap operasi create/update/delete data sensitif wajib insert ke `audit_logs`
- 🔒 **Aturan:** Data kredit, debitur, approval — semua harus audit trail

---

## ════════════════════════════════════
## KESALAHAN SPESIFIK PROJECT
## (Tambahkan di bawah ini saat ditemukan)
## ════════════════════════════════════

## [YYYY-MM-DD] Contoh Entry
- ❌ **Dicoba:** [pendekatan]
- 🐛 **Masalah:** [yang gagal]
- ✅ **Benar:** [solusi]
- 📁 **File:** [file terdampak]
- 🔒 **Aturan:** [aturan baru]
