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

## [2026-06-24] Bug Perhitungan Max Kredit di Analisa Konsumtif
- ❌ **Yang dicoba:** Menambahkan parameter `sistemAngsuran` pada backend `hitungKonsumtif` untuk menghitung `maxKredit` dengan fungsi anuitas/flat.
- 🐛 **Yang salah:** Frontend `AnalisaKonsumtifPage.jsx` ternyata tidak mengirimkan `sistemAngsuran`, `bungaPerTahun`, `jangkaWaktuBulan`, atau `plafon` ke backend `saveKonsumtif`. Akibatnya, `bungaPerTahun` bernilai `0` dan backend menggunakan default `FLAT`, sehingga nilai `maxKredit` bisa salah (bahkan bernilai 0).
- ✅ **Yang benar:** Frontend `AnalisaKonsumtifPage.jsx` perlu memuat (load) data `suku_bunga`, `jangka_waktu_bulan`, `plafon_diajukan`, dan `sistem_angsuran` dari `pengajuanService`, menyimpannya ke `form`, dan mengirimkannya kembali saat `analisaService.saveKonsumtif`.
- 📁 **File terdampak:** `frontend/src/pages/analisa/AnalisaKonsumtifPage.jsx`
- 🔒 **Aturan baru:** Saat backend function bergantung pada field pengajuan (plafon, tenor, bunga, sistem_angsuran), pastikan field tersebut di-pass down dari frontend atau diambil ulang dari DB di backend.

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

---

## [2026-06-24] Greediness pada Regex Pembersihan OCR Fallback
- ❌ **Yang dicoba:** Menggunakan regex greedy `[A-Z\s\/.-]*` di bagian akhir untuk membersihkan karakter spasi atau tanda baca setelah kata kunci (seperti `LAHIR` atau `TEMPAT`).
- 🐛 **Yang salah:** Karakter `[A-Z]` mencakup semua huruf besar, sehingga regex greedy tersebut ikut menghapus seluruh teks hasil ekstraksi sesudah kata kunci (misal `"TEMPATTGL LAHIR  BATANG"` terhapus sepenuhnya menjadi `""` karena `"BATANG"` cocok dengan `[A-Z]`).
- ✅ **Yang benar:** Batasi karakter pembersih setelah kata kunci hanya untuk spasi atau tanda baca menggunakan `[\s\/.-]*` alih-alih menyertakan huruf alfabet `[A-Z]`.
- 📁 **File terdampak:** backend/src/services/document-ai/document-ai.service.js
- 🔒 **Aturan baru:** Hindari penggunaan pencocokan greedy `[A-Z]*` atau `.*` untuk membersihkan teks jika teks tersebut diikuti oleh data dinamis yang bertipe alfabet. Gunakan character class yang spesifik (seperti spasi dan tanda baca).


---

## [2026-06-24] Docker Container Tidak Bisa Akses Host Service via `localhost`

- ❌ **Yang dicoba:** Konfigurasi `LFM_API_URL=http://localhost:1976` di backend untuk memanggil llama-server yang berjalan di host machine.
- 🐛 **Yang salah:** Dari dalam Docker container, `localhost` merujuk ke network loopback *container itu sendiri*, bukan host machine. Akibatnya semua request ke VLM LFM gagal dengan connection refused, dan sistem selalu fallback ke Tesseract OCR secara diam-diam tanpa error yang jelas di UI.
- ✅ **Yang benar:** Gunakan IP gateway docker bridge (`172.22.0.1`) atau `host.docker.internal` (dengan `extra_hosts: host.docker.internal:host-gateway`) untuk menjangkau service di host dari dalam container. Tambahkan env var eksplisit di `docker-compose.yml` — jangan andalkan fallback nilai default dari `config/index.js` karena fallback tersebut menggunakan `localhost`.
- 📁 **File terdampak:** `docker-compose.yml`, `.env`, `backend/src/config/index.js`
- 🔒 **Aturan baru:** Setiap service eksternal (AI model, queue, cache, dll.) yang berjalan di host harus dikonfigurasi eksplisit di `docker-compose.yml` dengan URL yang dapat dijangkau dari dalam container. JANGAN hardcode `localhost` untuk service di luar container.

---

## [2026-06-24] Perubahan Kode Node.js Tidak Efektif Tanpa Restart Container

- ❌ **Yang dicoba:** Menyalin file JS yang sudah dimodifikasi ke dalam container yang sedang berjalan (`docker cp`) langsung dan menjalankan test tanpa restart.
- 🐛 **Yang salah:** Node.js menyimpan cache module yang sudah di-require. File yang di-copy baru akan digunakan, tapi proses Node.js yang sudah berjalan masih menggunakan versi lama dari RAM cache. Test menunjukkan hasil dari kode lama.
- ✅ **Yang benar:** Setelah `docker cp` file baru ke container, selalu lakukan `docker restart <container>` sebelum menjalankan test agar Node.js memuat ulang module dari disk.
- 📁 **File terdampak:** `backend/src/services/document-ai/document-ai.service.js`
- 🔒 **Aturan baru:** Urutan yang benar: (1) edit file di host → (2) `docker cp` ke container → (3) `docker restart <container>` → (4) baru test.

---

## [2026-06-24] Field Mapping Mismatch antara Backend VLM Output dan Frontend State

- ❌ **Yang terjadi:** Frontend menggunakan field names `camelCase` (`tempatLahir`, `tanggalLahir`, `gender`, `statusNikah`) sesuai konvensi React state, tapi VLM backend mengembalikan `snake_case` (`tempat_lahir`, `tanggal_lahir`, `jenis_kelamin`, `status_perkawinan`). Selain itu, nilai enum juga berbeda: VLM output `"LAKI-LAKI"` sementara state React mengharapkan `"L"`.
- 🐛 **Dampak:** Semua field autofill kosong meski VLM berhasil mengekstrak — `extracted.tempatLahir` selalu `undefined` karena key yang benar adalah `extracted.tempat_lahir`.
- ✅ **Yang benar:** Buat helper functions normalisasi di frontend sebelum mengassign ke state: `normalizeGender()` (`LAKI-LAKI` → `L`), `normalizeStatus()` (`KAWIN` → `KAWIN`, `BELUM KAWIN` → `BELUM_KAWIN`), `normalizeDate()` (`DD-MM-YYYY` → `YYYY-MM-DD`). Mapping field eksplisit: `d.tempat_lahir → tempatLahir`, `d.jenis_kelamin → normalizeGender() → gender`.
- 📁 **File terdampak:** `frontend/src/pages/debitur/DebiturFormPage.jsx`
- 🔒 **Aturan baru:** Setiap kali backend mengembalikan data baru (terutama dari AI/VLM), selalu cek format field names dan nilai enum **sebelum** assign ke React state. Jangan berasumsi format sama.

## [2026-06-24] File Picker Browser Menyembunyikan PDF
- ❌ **Yang dicoba:** Menggunakan `accept="image/*,application/pdf"` pada elemen `<input type="file">`.
- 🐛 **Yang salah:** Pada beberapa sistem operasi (seperti Windows), kombinasi `image/*` dengan MIME type spesifik `application/pdf` membuat file picker terkadang menyembunyikan file PDF secara default.
- ✅ **Yang benar:** Tambahkan ekstensi file secara eksplisit `.pdf` di dalam atribut accept: `accept="image/*,.pdf,application/pdf"`.
- 📁 **File terdampak:** `frontend/src/pages/debitur/DebiturFormPage.jsx` dan file lain dengan fitur OCR.
- 🔒 **Aturan baru:** Jika input file diharapkan menerima gambar dan PDF, pastikan atribut `accept` menyertakan string literal ekstensi `.pdf` agar tidak membatasi OS file picker.

## [2026-06-24] Input Currency dengan type="number"
- ❌ **Yang dicoba:** Menggunakan `<input type="number">` untuk field input nilai mata uang (Rupiah).
- 🐛 **Yang salah:** `type="number"` tidak mendukung formatting pemisah ribuan (titik/koma) saat pengguna mengetik, sehingga menyulitkan pembacaan angka besar (misal 2500000).
- ✅ **Yang benar:** Gunakan `<input type="text">`, lalu format `value` dengan `.toLocaleString('id-ID')` dan parsing ulang input numerik di `onChange` menggunakan `.replace(/\D/g, '')`.
- 📁 **File terdampak:** Komponen input form (terutama di Analisa).
- 🔒 **Aturan baru:** Semua input yang mewakili nilai uang (Rupiah) WAJIB menggunakan text input dengan formatting otomatis ribuan (titik) demi kenyamanan UI/UX pengguna.

---

## [2026-06-25] Form Agunan Masih Menggunakan Endpoint OCR Lama
- ❌ **Yang dicoba:** Menambahkan service `extractShm` pada backend dan beranggapan semua halaman akan langsung menggunakan arsitektur VLM yang baru.
- 🐛 **Yang salah:** Pada komponen `AgunanFormPage.jsx` dan `AgunanEditPage.jsx`, pemindaian masih memanggil `ocrService.process()` (endpoint lama `/ocr` berbasis Tesseract) karena luput dari scope pembaruan halaman Debitur.
- ✅ **Yang benar:** Ganti import `ocrService` menjadi `documentService` di semua komponen form agunan dan gunakan pemanggilan endpoint spesifik (misal `documentService.extractShm(formData)`), lalu sinkronkan *mapping* dari parameter response *snake_case* ke *camelCase*.
- 📁 **File terdampak:** `frontend/src/pages/agunan/AgunanFormPage.jsx` dan `AgunanEditPage.jsx`
- 🔒 **Aturan baru:** Saat mengganti/memigrasikan arsitektur *core* sistem (misalnya OCR ke VLM), lakukan pencarian teks global (contohnya `ocrService`) di seluruh kode `src/pages` frontend untuk memastikan tidak ada komponen yang tertinggal menggunakan API lama.

---

## [2026-06-25] VLM Halusinasi akibat Instruksi Negatif di Prompt
- ❌ **Yang dicoba:** Menaruh instruksi negatif dengan contoh teks pada prompt OCR (contoh: `jangan tambah kata "JAKARTA" jika tidak tertulis`).
- 🐛 **Yang salah:** Model Llama Vision sangat sensitif, seringkali malah salah mengartikan constraint negatif sebagai referensi konteks, yang mengakibatkan model menambahkan kata fiktif ("JAKARTA") ke dalam hasil ekstraksinya.
- ✅ **Yang benar:** Hapus contoh teks spesifik/negatif dari prompt. Buat instruksi lurus saja (misalnya: `"Ekstrak persis seperti di gambar. HANYA JSON. Jangan menebak jika tidak terbaca."`).
- 📁 **File terdampak:** `backend/src/services/document-ai/document-ai.service.js`
- 🔒 **Aturan baru:** DILARANG menaruh contoh teks spesifik/negatif yang berpotensi ditelan sebagai halusinasi oleh VLM. Gunakan instruksi positif yang absolut dan clear.

---

## [2026-06-25] Batas Ukuran File (File Size Limit) Nginx dan Multer Terlalu Kecil
- ❌ **Yang dicoba:** Menggunakan limit bawaan 10MB untuk `client_max_body_size` di Nginx dan `fileSize` di konfigurasi Multer.
- 🐛 **Yang salah:** Pengguna gagal mengunggah dokumen KTP/SHM berformat PDF tebal atau foto smartphone beresolusi tinggi (karena ukurannya melebihi 10MB), mengakibatkan keluhan "tidak bisa upload image/pdf" tanpa respon/log error yang jelas di konsol backend.
- ✅ **Yang benar:** Menaikkan batas ukuran upload ke nilai yang lebih besar dan leluasa (50MB) baik di layer Reverse Proxy (Nginx) maupun backend handler (Multer).
- 📁 **File terdampak:** `nginx/nginx.conf`, `backend/src/middleware/upload.js`
- 🔒 **Aturan baru:** Saat meluncurkan fitur unggah dokumen/foto di production, pastikan batasan ukuran file di Nginx dan Multer telah dikonfigurasi cukup besar untuk mengakomodasi file nyata.

---

## [2026-06-26] Import Path yang Salah Setelah Refactor Folder
- ❌ **Yang dicoba:** Mengimpor modul dari path lama setelah beberapa file dipindahkan ke folder baru.
- 🐛 **Yang salah:** Import `upload` sebagai default export (`const { upload } = require(...)`) padahal yang diekspor adalah named export. Selain itu, path `ocr.service` dan `parsers` sudah dipindah sebelumnya sehingga import menjadi error `MODULE_NOT_FOUND`.
- ✅ **Yang benar:** Periksa export pattern (default vs named) dan pastikan semua `require()` menggunakan path yang benar setelah refactor.
- 📁 **File terdampak:** `backend/src/modules/document-intelligence/routes/document-intelligence.routes.js`, `backend/src/services/document-ai/document-ai.service.js`
- 🔒 **Aturan baru:** Setelah melakukan refactor/move file, lakukan pencarian global (`grep`) untuk semua `require()` atau `import` yang menunjuk ke path lama sebelum melakukan deploy Docker.

---

## [2026-06-27] Salah Relative Path Level untuk Utility deepFreeze
- ❌ **Yang dicoba:** Mengimpor `deepFreeze` utility dari `PromptContext.js` dan `Narrative.js` dengan level relative path `../../../utils/deepFreeze`.
- 🐛 **Yang salah:** Entity tersebut terletak di `src/modules/ai/context/entities/PromptContext.js` dan `src/modules/ai/narrative/entities/Narrative.js`, sehingga path `../../../utils/deepFreeze` hanya naik ke level `src/modules/` alih-alih `src/` (di mana folder `utils` berada), memicu error `MODULE_NOT_FOUND`.
- ✅ **Yang benar:** Gunakan path level `../../../../utils/deepFreeze` untuk naik 4 tingkat agar sampai ke root source `src` folder.
- 📁 **File terdampak:** `backend/src/modules/ai/context/entities/PromptContext.js`, `backend/src/modules/ai/narrative/entities/Narrative.js`
- 🔒 **Aturan baru:** Selalu hitung dengan teliti jumlah level folder saat melakukan impor relatif, terutama di dalam struktur subdirektori bertingkat seperti `src/modules/<name>/<layer>/entities/`.

---

## [2026-06-27] SyntaxError JSON Parse Akibat UTF-8 BOM pada Schema JSON di Windows
- ❌ **Yang dicoba:** Membaca file schema JSON menggunakan `fs.readFileSync(schemaPath, 'utf8')` dan langsung mem-parsing-nya dengan `JSON.parse()`.
- 🐛 **Yang salah:** Pada environment Windows, file JSON schema yang dibuat/diedit menggunakan editor tertentu terkadang menyertakan karakter Byte Order Mark (BOM) UTF-8 (`\ufeff`) di awal file. Karakter ini tidak terlihat di text editor biasa, namun menyebabkan `JSON.parse` crash dengan error `Unexpected token '﻿'`.
- ✅ **Yang benar:** Bersihkan karakter BOM terlebih dahulu menggunakan `.replace(/^\uFEFF/, '')` sebelum mem-parsing string data tersebut dengan `JSON.parse()`.
- 📁 **File terdampak:** `backend/src/modules/ai/narrative/entities/Narrative.js`
- 🔒 **Aturan baru:** Saat memuat atau mem-parsing file JSON dari disk secara manual (tidak lewat `require`), selalu gunakan pembersihan BOM (`.replace(/^\uFEFF/, '')`) demi keandalan lintas-platform (cross-platform).

---

## [2026-06-27] Placeholder Filter Unreplaced pada Interpolasi Prompt
- ❌ **Yang dicoba:** Menggunakan regex string replace statis dengan array kunci kaku (seperti `{{facts.income}}`) untuk menggantikan placeholder di template prompt.
- 🐛 **Yang salah:** Template aslinya memiliki filter formatting (seperti `{{facts.income | formatRupiah}}`). Regex replace statis tidak mencocokkan string dengan filter tersebut, sehingga placeholder di prompt user terkirim tanpa ter-replace (tetap berupa text kurung kurawal mentah).
- ✅ **Yang benar:** Gunakan regex dinamis `/{{\s*([^}]+?)\s*}}/g` untuk memecah key dan filter (via `|`), mengambil nilainya dari context secara rekursif/dinamis, lalu menjalankan filter formatting yang sesuai.
- 📁 **File terdampak:** `backend/src/modules/ai/prompt/builder/PromptBuilder.js`
- 🔒 **Aturan baru:** Gunakan dynamic token extraction alih-alive static key lists jika template prompt mendukung filter atau path dinamis.

---

## [2026-06-27] Tipe Data Mismatch Pada FactCollection/CapabilityCollection ke Schema
- ❌ **Yang dicoba:** Mengirimkan instance `FactCollection` dan `CapabilityCollection` langsung ke `AnalysisPackageBuilder.build()`, berasumsi bahwa `.toJSON()` akan menghasilkan data objek.
- 🐛 **Yang salah:** Pada framework internal, `.toJSON()` pada `FactCollection` dan `CapabilityCollection` mengembalikan data array `[]` (daftar item), sementara skema validator `AnalysisPackage` membatasi tipe data ini sebagai `"type": "object"`. Selain itu, prompt builder mengharapkan akses key-value seperti `facts.income` yang akan menghasilkan nilai `undefined` jika datanya berbentuk array.
- ✅ **Yang benar:** Petakan array fakta dan kapabilitas ke dalam bentuk objek key-value (plain JavaScript object) yang rapi sebelum diserahkan ke builder.
- 📁 **File terdampak:** `backend/src/modules/ai/ai.service.js`
- 🔒 **Aturan baru:** Pastikan format data domain (seperti Map/Set/Array) ditransformasikan menjadi bentuk objek JSON datar (flat object) yang valid sebelum divalidasi dengan JSON schema bertipe "object".

---

## [2026-06-27] Kolom Database Baru Terlewat di File Migrasi Resmi
- ❌ **Yang dicoba:** Menjalankan unit test dengan database kosong baru dan berasumsi migrasi bawaan sudah mencakup seluruh kolom yang ada di production.
- 🐛 **Yang salah:** Kolom-kolom baru seperti `ibu_kandung`, `hubungan_bank`, dan `kredit_aktif` yang ditambahkan pada Sesi 5 tidak pernah dimasukkan ke file migrasi SQL backend. Akibatnya, pengujian yang memanggil `getMakData()` crash dengan error `column d.ibu_kandung does not exist`.
- ✅ **Yang benar:** Tambahkan instruksi `ALTER TABLE` menggunakan pola `ADD COLUMN IF NOT EXISTS` di file migrasi SQL berikutnya agar database lama maupun baru tetap sinkron.
- 📁 **File terdampak:** `backend/migrations/007_add_ai_narrative.sql`
- 🔒 **Aturan baru:** Setiap penambahan kolom baru di database, pastikan untuk segera membuat file migrasinya di folder migrations. JANGAN melakukan alter manual langsung di psql/production tanpa file migrasi.

---

## [2026-06-27] Inkonsistensi Kolom Notifikasi (judul/pesan vs title/message)
- ❌ **Yang dicoba:** Mengirimkan in-app notifikasi lewat `notifikasiService.createNotification` dengan property `title` dan `message` yang dipetakan oleh query di `notifikasi.service.js`.
- 🐛 **Yang salah:** Mengalami error `column "title" of relation "notifikasi" does not exist` karena tabel `notifikasi` di-create pertama kali di `001_initial_schema.sql` menggunakan kolom `judul` dan `pesan`, sedangkan deklarasi `title` dan `message` di `002_phase3_tables.sql` menggunakan `CREATE TABLE IF NOT EXISTS` yang secara otomatis ter-skip oleh PostgreSQL karena tabelnya sudah ada.
- ✅ **Yang benar:** Menambahkan statemen `ALTER TABLE notifikasi RENAME COLUMN` untuk mengubah nama kolom (`judul`/`pesan`/`tipe`/`referensi_id`/`referensi_tipe`) menjadi kolom baru (`title`/`message`/`type`/`reference_id`/`reference_type`) agar serasi di database.
- 📁 **File terdampak:** `backend/migrations/008_extend_ews_table.sql`
- 🔒 **Aturan baru:** Selalu periksa apakah tabel lama dengan prefix `IF NOT EXISTS` diubah definisinya di migrasi baru. Jika ya, gunakan alter table untuk menyelaraskannya daripada berasumsi deklarasi ganda akan memperbarui skema.

---

## [2026-06-27] Kolom u.phone Tidak Ditemukan di Tabel users
- ❌ **Yang dicoba:** Menyeleksi nomor handphone pengguna via `u.phone` dari tabel `users` untuk mengirimkan WhatsApp Gateway EWS.
- 🐛 **Yang salah:** Query crash dengan error `column u.phone does not exist` karena tabel `users` di skema awal (`001_initial_schema.sql`) tidak mendefinisikan kolom `phone` dan tidak ada file migrasi yang menambahkannya, sementara kode `notifikasi.service.js` sudah telanjur memakainya.
- ✅ **Yang benar:** Menambahkan `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)` pada file migrasi `008_extend_ews_table.sql`.
- 📁 **File terdampak:** `backend/migrations/008_extend_ews_table.sql`
- 🔒 **Aturan baru:** Pastikan kolom utilitas/kontak seperti nomor telepon atau email pengguna (`users.phone`) tercatat dengan benar di file migrasi database utama untuk mendukung flow notifikasi WA/SMS.


