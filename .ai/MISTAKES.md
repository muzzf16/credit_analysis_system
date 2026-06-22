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

## [2026-06-21] OCR engine bergantung pada Python runtime
- ❌ **Dicoba:** Mengganti OCR dengan asumsi backend Node-only dan hanya memakai dependency npm.
- 🐛 **Masalah:** PaddleOCR membutuhkan runtime Python serta paket `paddleocr` dan `paddlepaddle`; jika dependency tidak terinstall, endpoint OCR gagal.
- ✅ **Benar:** Pastikan environment backend memiliki Python dan paket Python yang dibutuhkan sebelum deploy. Di Docker, install dependency Python di image/container.
- 📁 **File:** backend/src/modules/ocr/ocr.service.js, backend/src/modules/ocr/paddleocr_runner.py
- 🔒 **Aturan:** Setiap perubahan OCR harus mempertimbangkan dependency runtime (Node + Python) dan dokumentasi instalasi di server/container.

---

## [2026-06-22] Frontend Axios Hardcoded Timeout
- ❌ **Dicoba:** Meningkatkan batas timeout Nginx dan Node.js Express menjadi 5 menit agar pemrosesan OCR PDF tidak terputus, tapi melupakan konfigurasi di Axios Frontend.
- 🐛 **Masalah:** Frontend (browser) otomatis memutus request HTTP tepat di menit ke-2 (120.000 ms) karena *hardcoded timeout*. Muncul error seakan backend *down*, padahal backend sedang bekerja memproses PDF.
- ✅ **Benar:** Jika menaikkan limit timeout untuk operasi berat (heavy task) di sisi Server/Backend, pastikan nilai `timeout` di *HTTP Client* (Frontend Axios) ikut dinaikkan.
- 📁 **File terdampak:** frontend/src/services/index.js
- 🔒 **Aturan baru:** Selalu sinkronkan Nginx Proxy Timeout, Backend Timeout, dan Axios Frontend Timeout pada endpoint yang melakukan pemrosesan berat.

---

## [2026-06-22] Docker Exec salah Container dan User Database
- ❌ **Dicoba:** Menjalankan `docker compose exec db psql -U bpr_user -d bpr_db` untuk memodifikasi database schema (ALTER TABLE).
- 🐛 **Masalah:** Container bernama `db` tidak ada (yang benar `postgres`), dan role/user `bpr_user` tidak eksis karena credential sesungguhnya diatur oleh file `.env` (yakni `postgres` & `bpr_bapera`).
- ✅ **Benar:** Periksa nama service container dengan `docker compose ps` dan lihat credentials DB di file `.env` sebelum menjalankan `psql` command. Eksekusi menjadi `docker compose exec postgres psql -U postgres -d bpr_bapera`.
- 📁 **File terdampak:** -
- 🔒 **Aturan baru:** Jangan pernah berasumsi credential database tanpa mengecek file `.env` dan `docker-compose.yml` terlebih dahulu!

---

## [2026-06-22] Frontend Cache Issue setelah Update & Rebuild
- ❌ **Dicoba:** Hanya melakukan `docker compose up -d --build frontend` untuk menerapkan perubahan UI React ke server, berasumsi user otomatis melihat perubahannya saat reload.
- 🐛 **Masalah:** Browser meng-cache file `index.html` dari Nginx (karena Nginx tidak punya konfigurasi Cache-Control default). User terus melihat "hardcode" versi lama di layar meski codebase sudah berulang kali diperbarui dan container direbuild.
- ✅ **Benar:** Menambahkan header `Cache-Control "no-store, no-cache, must-revalidate"` pada block `location /` di `nginx.conf` khusus untuk memastikan `index.html` selalu ditarik baru oleh browser setiap di-_refresh_.
- 📁 **File terdampak:** frontend/nginx.conf
- 🔒 **Aturan baru:** Saat mendeploy perubahan frontend SPA, selalu pastikan konfigurasi proxy atau web server memiliki instruksi anti-cache minimal untuk file root index HTML-nya.

---

## [2026-06-22] ReferenceError Setelah Refactoring Variabel
- ❌ **Dicoba:** Mengubah tipe data/nama variabel yang cukup sering dipakai di berbagai baris (misal `totalPlafonSlik` menjadi `totalsSlik.totalPlafon`) lewat script regex atau replacement parsial.
- 🐛 **Masalah:** Ada beberapa pemanggilan lama (`totalPlafonSlik`) yang tertinggal di baris lain di UI yang luput diganti, sehingga UI *crash* (`ReferenceError: totalPlafonSlik is not defined`).
- ✅ **Benar:** Selalu lakukan *global search* atau cek `grep_search` terhadap nama variabel lama di seluruh file setelah refactoring sebelum menyimpan atau mendeploy file tersebut, guna memastikan tidak ada string variabel *orphan* yang tertinggal.
- 📁 **File terdampak:** frontend/src/pages/mak/MakPreviewPage.jsx
- 🔒 **Aturan baru:** DILARANG keras merefactor nama variabel tanpa mengecek tuntas *semua references* dari variabel tersebut.
