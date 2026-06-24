# 📓 SESSION LOG — BPR BAPERA BATANG
# ═══════════════════════════════════════════════════════
# PURPOSE: Catat apa yang dibangun di setiap sesi AI
#          agar bisa lanjut dari titik yang tepat — bahkan
#          setelah ganti model atau istirahat lama.
#
# HOW TO USE:
# Sebelum akhiri sesi, minta AI:
# "Isi entry SESSION_LOG baru untuk apa yang baru kita kerjakan"
# ═══════════════════════════════════════════════════════

## TEMPLATE
```
## Sesi [N] — [YYYY-MM-DD] | Model: [Claude/GPT/Gemini] | Modul: [#]
**Goal:** [Apa yang ingin dibangun]
**Yang selesai:** [Apa yang benar-benar jadi]
**Keputusan baru:** [Pilihan arsitektur/kode yang dibuat]
**File yang diubah:** [Daftar semua file yang disentuh]
**File JANGAN disentuh:** [File yang sudah bekerja — hands off]
**Bug yang ditemukan:** [Error yang ditemui]
**Hindari sesi berikutnya:** [Apa yang tidak boleh dilakukan]
**Task berikutnya:** [Task eksak untuk sesi selanjutnya]
**Kode yang perlu ditempel:** [File mana yang perlu disertakan next time]
```

---

## ════════════════════════════════════
## RIWAYAT SESI
## ════════════════════════════════════

## Sesi 1 — [YYYY-MM-DD] | Model: ___________ | Modul: Setup
**Goal:** Setup awal project & scaffolding
**Yang selesai:**
- [x] Docker Compose setup (postgres, minio, nginx, backend, frontend)
- [x] Struktur folder backend (routes, controllers, models, middleware, migrations)
- [x] Struktur folder frontend (components, pages, hooks, utils)
- [x] Migrasi 23 tabel database
- [x] Seed data roles & user admin awal
- [x] Nginx reverse proxy config
**Keputusan baru:** [Isi dari sesi aktual]
**File yang diubah:** docker-compose.yml, .env.example, nginx/nginx.conf
**File JANGAN disentuh:** [Isi setelah sesi berikutnya]
**Bug yang ditemukan:** [Isi jika ada]
**Hindari sesi berikutnya:** [Isi]
**Task berikutnya:** Mulai Phase 3 — MAK Generator (modul 09)
**Kode yang perlu ditempel:** docker-compose.yml, backend/migrations/

---

## Sesi 2 — [YYYY-MM-DD] | Model: ___________ | Modul: ___
**Goal:** [Isi]
**Yang selesai:** [Isi]
**Keputusan baru:** [Isi]
**File yang diubah:** [Isi]
**File JANGAN disentuh:** [Isi]
**Bug yang ditemukan:** [Isi]
**Hindari sesi berikutnya:** [Isi]
**Task berikutnya:** [Isi]
**Kode yang perlu ditempel:** [Isi]

---

## Sesi 3 — [YYYY-MM-DD] | Model: ___________ | Modul: ___
**Goal:** [Isi]
**Yang selesai:** [Isi]
**Keputusan baru:** [Isi]
**File yang diubah:** [Isi]
**File JANGAN disentuh:** [Isi]
**Bug yang ditemukan:** [Isi]
**Hindari sesi berikutnya:** [Isi]
**Task berikutnya:** [Isi]
**Kode yang perlu ditempel:** [Isi]

---

## Sesi 4 — 2026-06-19 | Model: Gemini 3.5 Flash | Modul: Analisa & SLIK
**Goal:** Peningkatan OCR SLIK, auto-fill angsuran SLIK ke Analisa Konsumtif, penyebaran otomatis Pengeluaran baru, dan limit Max Angsuran 95%.
**Yang selesai:**
- [x] Perbaikan OCR parser SLIK (`tanggalMulai`, `sukuBunga`, dan penanganan bug false Macet).
- [x] Input field tambahan di form SLIK (Suku Bunga & Tanggal Mulai).
- [x] Penambahan kolom anuitas dan tenor di tabel SLIK detail pengajuan.
- [x] Integrasi nilai total angsuran SLIK ke field Cicilan Existing di Analisa Konsumtif.
- [x] Fitur Auto-fill pengeluaran dengan porsi baru di Analisa Konsumtif (Rumah Tangga 50%, Listrik & Air 7.5% masing-masing, Pendidikan 17.5%, Transportasi 12.5%, Pengeluaran Lain 5%).
- [x] Perubahan limit Max Angsuran di Analisa Konsumtif menjadi 95% dari Disposable Income.
**Keputusan baru:** Max Angsuran dihitung sebesar 95% dari Disposable Income untuk memberikan rasio kelayakan yang lebih fleksibel.
**File yang diubah:** backend/src/modules/ocr/parsers.js, frontend/src/pages/slik/SlikFormPage.jsx, frontend/src/pages/pengajuan/PengajuanDetailPage.jsx, frontend/src/pages/analisa/AnalisaKonsumtifPage.jsx, backend/src/utils/financialFormulas.js
**File JANGAN disentuh:** -
**Bug yang ditemukan:** Broad substring check `"macet"` pada parser SLIK mengoverride data kualitas asli dari OJK. Telah dihapus.
**Hindari sesi berikutnya:** -
**Task berikutnya:** Lanjutkan MAK Generator & perbaikan tab lainnya.
**Kode yang perlu ditempel:** -

---

## Sesi 5 — 2026-06-19 | Model: Antigravity | Modul: Data Debitur & MAK
**Goal:** Penambahan field isian Ibu Kandung, Hubungan dengan Bank, dan Kredit yang sedang dinikmati.
**Yang selesai:**
- [x] Migrasi database PostgreSQL untuk kolom `ibu_kandung`, `hubungan_bank`, dan `kredit_aktif`.
- [x] Update backend service `debitur.service.js` dan `mak.service.js` untuk query CRUD dan data snapshot MAK.
- [x] Update frontend `DebiturFormPage.jsx` dengan input field Ibu Kandung (teks), Hubungan dengan Bank (dropdown), dan Kredit yang sedang dinikmati (dropdown).
- [x] Update frontend `DebiturDetailPage.jsx` untuk menampilkan data field baru di halaman detail debitur.
- [x] Update frontend `MakPreviewPage.jsx` untuk memetakan data field baru secara dinamis menggantikan data placeholder di tabel Data Umum Pemohon.
**Keputusan baru:** Dropdown Hubungan dengan Bank memiliki opsi default "Nasabah Baru" dan dropdown Kredit yang sedang dinikmati memiliki opsi default "Tidak Ada".
**File yang diubah:** backend/src/modules/debitur/debitur.service.js, backend/src/modules/mak/mak.service.js, frontend/src/pages/debitur/DebiturFormPage.jsx, frontend/src/pages/debitur/DebiturDetailPage.jsx, frontend/src/pages/mak/MakPreviewPage.jsx
**File JANGAN disentuh:** -
**Bug yang ditemukan:** -
**Hindari sesi berikutnya:** -
**Task berikutnya:** Lanjutkan pengerjaan modul MAK Generator (Phase 3).
**Kode yang perlu ditempel:** -

---

## Sesi 6 — 2026-06-21 | Model: MAI-Code-1-Flash | Modul: OCR
**Goal:** Ganti engine OCR dari Tesseract ke PaddleOCR tanpa mengubah response API frontend.
**Yang selesai:**
- [x] Backend OCR sekarang memanggil PaddleOCR melalui script Python.
- [x] Dukungan OCR untuk gambar dan PDF (PDF dikonversi lewat pdftoppm lalu diproses OCR).
- [x] Dependency Tesseract dihapus dari manifest backend.
- [x] Verifikasi import PaddleOCR berhasil di environment lokal.
**Keputusan baru:** OCR backend kini bergantung pada runtime Python dan paket `paddleocr`/`paddlepaddle`; tidak lagi mengandalkan `tesseract.js`.
**File yang diubah:** backend/src/modules/ocr/ocr.service.js, backend/src/modules/ocr/paddleocr_runner.py, backend/package.json, backend/package-lock.json
**File JANGAN disentuh:** Alur frontend OCR dan endpoint `/ocr` yang sudah dipakai di form debitur, agunan, dan SLIK.
**Bug yang ditemukan:** Environment awal belum memiliki Python packages PaddleOCR yang dibutuhkan, sehingga integrasi OCR gagal sebelum instalasi.
**Hindari sesi berikutnya:** Jangan mengubah format response API OCR atau mengembalikan engine OCR yang berbeda tanpa persetujuan.
**Task berikutnya:** Verifikasi integrasi PaddleOCR di Docker/production, pastikan Python dan dependency terinstall di container.
**Kode yang perlu ditempel:** backend/src/modules/ocr/ocr.service.js, backend/src/modules/ocr/paddleocr_runner.py

---

## Sesi 7 — 2026-06-22 | Model: Antigravity | Modul: OCR
**Goal:** Mengatasi masalah timeout OCR PDF dan mengganti PaddleOCR ke Tesseract kembali karena prosesnya terlalu membebani CPU dan lama.
**Yang selesai:**
- [x] Memperbaiki frontend Axios timeout dari 120000ms (2 menit) menjadi 300000ms (5 menit).
- [x] Menghapus `paddleocr_runner.py` dan paket `paddlepaddle` serta Python dari Dockerfile backend.
- [x] Menginstal `tesseract-ocr`, `tesseract-ocr-ind`, dan `imagemagick` di Dockerfile.
- [x] Merombak `ocr.service.js` untuk mengeksekusi Tesseract OCR secara native (CLI).
- [x] Menambahkan preprocessing `ImageMagick` (Grayscale, Normalize, Resize 200%) agar Tesseract mampu membaca gambar bertekstur (seperti KTP) dengan akurasi sangat tinggi.
- [x] Mengubah logika ekstraksi halaman PDF menjadi asynchronous (`Promise.all`) agar berjalan multi-core/paralel.
**Keputusan baru:** Tesseract OCR digunakan kembali sebagai standard untuk efisiensi resource. Semua pre-processing gambar diserahkan ke ImageMagick. File PDF diekstrak paralel.
**File yang diubah:** frontend/src/services/index.js, backend/Dockerfile, backend/src/modules/ocr/ocr.service.js
**File JANGAN disentuh:** Komponen UI Frontend OCR.
**Bug yang ditemukan:** Frontend Axios memutus koneksi di menit ke-2 karena ada setting `timeout: 120000` hardcoded, yang membuat seolah-olah server gagal merespons.
**Hindari sesi berikutnya:** Menggunakan framework machine-learning Python yang sangat berat di dalam image Docker backend Node.js untuk OCR dokumen jika tidak wajib.
**Task berikutnya:** Lanjutkan pengerjaan MAK Generator (Phase 3) atau modul EWS (Phase 5).
**Kode yang perlu ditempel:** -

## Sesi 8 — 2026-06-22 | Model: Antigravity | Modul: Analisa & MAK
**Goal:** Penyesuaian perhitungan Sisa Pendapatan dan field Pengurang Angsuran pada Analisa Konsumtif & MAK.
**Yang selesai:**
- [x] Mengubah label "Penghasilan bersih debitur per bulan sebesar" menjadi "Sisa pendapatan per bulan" pada MAK Preview.
- [x] Memperbarui kalkulasi field "Maksimal Angsuran", "RPC", "Prosentase Angsuran", dan "Status Kelayakan" di MAK Preview agar berbasis Sisa Pendapatan alih-alih Take Home Pay.
- [x] Menambahkan kolom database `pengurang_angsuran` pada tabel `analisa_konsumtif` dan `analisa_produktif` via ALTER TABLE.
- [x] Mengubah form input di Analisa Konsumtif & Produktif untuk menangani `pengurang_angsuran`.
- [x] Mengubah perhitungan `sisaPendapatan` di MAK untuk mengurangi `pengurangAngsuran` bersama dengan `angsuranEksisting`.
- [x] Mengganti label "F. Angsuran Kredit 2" menjadi "F. Pengurang angsuran".
**Keputusan baru:** Field "Pengurang Angsuran" ditambahkan untuk menampung kewajiban lain di luar SLIK yang menjadi faktor pengurang sebelum sisa pendapatan akhir.
**File yang diubah:** backend/src/modules/analisa/analisa.service.js, backend/src/utils/financialFormulas.js, frontend/src/pages/analisa/AnalisaKonsumtifPage.jsx, frontend/src/pages/analisa/AnalisaProduktifPage.jsx, frontend/src/pages/mak/MakPreviewPage.jsx
**File JANGAN disentuh:** -
**Bug yang ditemukan:** Error "Connection Refused / 502 Bad Gateway" karena stale IP cache pada container Nginx setelah backend & frontend direbuild. Diselesaikan dengan merestart service Nginx.
**Hindari sesi berikutnya:** Kelupaan sinkronisasi model backend dengan script migrasi resmi saat menambahkan kolom. Kolom baru perlu segera dibuatkan file migrasinya di sesi selanjutnya.
**Task berikutnya:** Sinkronisasi kolom `pengurang_angsuran` ke dalam file migrasi resmi dan lanjut modul MAK/EWS.
**Kode yang perlu ditempel:** -

## Sesi 9 — 2026-06-22 | Model: Antigravity | Modul: MAK
**Goal:** Menghilangkan data hardcode pada dokumen Memorandum Analisa Kredit (MAK) Preview dan mengatasi masalah caching frontend.
**Yang selesai:**
- [x] Mengubah data persetujuan (Jabatan, Keputusan, Plafon, Tenor) di MAK Preview dari data kaku menjadi dinamis yang di-loop dari `approvalList`.
- [x] Mengubah opsi "Kredit Bermasalah pada Bank Lain" di MAK Preview agar otomatis tercentang berdasar kolektibilitas (Kol >= 3) dari data SLIK.
- [x] Menghapus blok teks opini kepatuhan yang bersifat _template kaku_ (hardcode kalimat) dan menggantinya dengan kotak (box) kosong agar opini bisa ditulis tangan setelah dokumen dicetak.
- [x] Menambahkan Cache-Control headers (`no-store`, `no-cache`) pada konfigurasi Nginx frontend agar `index.html` tidak di-_cache_ oleh browser yang menyebabkan user tidak bisa melihat perubahan UI.
**Keputusan baru:** Teks Opini Kepatuhan yang tadinya di-_generate_ otomatis dengan kalimat standar telah dihapus demi fleksibilitas, menyisakan area kosong untuk catatan manual setelah dicetak.
**File yang diubah:** frontend/src/pages/mak/MakPreviewPage.jsx, frontend/nginx.conf
**File JANGAN disentuh:** -
**Bug yang ditemukan:** Browser men-cache `index.html` dari Nginx, sehingga update frontend tidak terlihat oleh user meskipun Docker container sudah di-_rebuild_.
**Hindari sesi berikutnya:** Kelupaan setting cache header Nginx untuk file statis seperti HTML.
**Task berikutnya:** Sinkronisasi kolom `pengurang_angsuran` ke dalam file migrasi resmi dan lanjut modul MAK/EWS.
**Kode yang perlu ditempel:** -

---

## Sesi 10 — 2026-06-22 | Model: Antigravity | Modul: MAK
**Goal:** Menyelaraskan layout MAK yang lama dengan desain/tabel baru (SLIK Pasangan, struktur penilaian jaminan, dll) dan update environment Docker production.
**Yang selesai:**
- [x] Merombak struktur tabel Pemohon dan menambahkan tabel SLIK Pasangan di `MakPreviewPage.jsx`.
- [x] Menyempurnakan layout Aspek Keuangan, agunan tanah & bangunan, serta total nilai likuidasi agar rapi dan dinamis.
- [x] Membuat blok tanda tangan komite pemutus kredit beserta persetujuannya agar dinamis dan sesuai dengan format standar BPR.
- [x] Melakukan `docker compose up -d --build` untuk menerapkan kode terbaru ke dalam Docker container.
- [x] Menjalankan skrip migrasi kolom `pengurang_angsuran` (`005_add_pengurang_angsuran.sql`) langsung dari dalam environment container backend (`docker compose exec backend npm run migrate`).
**Keputusan baru:** Template layout UI MAK sepenuhnya disesuaikan dengan desain screenshot yang diberikan dengan agregasi tabel SLIK baru.
**File yang diubah:** frontend/src/pages/mak/MakPreviewPage.jsx, backend/migrations/005_add_pengurang_angsuran.sql
**File JANGAN disentuh:** -
**Bug yang ditemukan:** ReferenceError karena kelupaan mengganti variabel lama (`totalPlafonSlik`) menjadi variabel bersarang yang baru (`totalsSlik.totalPlafon`) di UI rendering.
**Hindari sesi berikutnya:** Menghapus atau merefactor nama-nama state variable/object tanpa melakukan pencarian global/full-file replacement untuk memastikan tidak ada pemanggilan variabel usang yang tersisa.
**Task berikutnya:** Cek fungsionalitas MAK Generator apakah perlu integrasi simpan PDF atau lanjut ke modul EWS (Phase 5).
**Kode yang perlu ditempel:** -

---

## Sesi 11 — 2026-06-24 | Model: Antigravity (Gemini 3.5 Flash) | Modul: Document AI (VLM OCR)
**Goal:** Mengganti alur ekstraksi dokumen dari regex Tesseract ke vision-based extraction LFM2.5-VL-1.6B pada port 1976 serta membuat adapter pattern dengan fallback otomatis.
**Yang selesai:**
- [x] Menambahkan variabel konfigurasi `ocrEngine` dan `lfmApiUrl` di `backend/src/config/index.js` (LFM di port 1976).
- [x] Membuat service layer `document-ai.service.js` dan validator data `document-ai.schemas.js`.
- [x] Mengonversi halaman pertama file PDF menjadi PNG buffer menggunakan `pdftoppm` sebelum dikirim ke LFM vision.
- [x] Membuat controller `document.controller.js` dan router `document.routes.js` yang mendukung 6 endpoint: KTP, KK, NPWP, SHM, BPKB, dan Survey.
- [x] Mengintegrasikan `authenticate` middleware pada semua endpoint baru.
- [x] Membuat unit test `test-document-ai.js` untuk memverifikasi proses validasi, alur sukses LFM, dan fallback Tesseract.
- [x] Menulis README.md berisi manual deployment systemd service dan contoh curl untuk semua endpoint.
- [x] Menyinkronkan sumber data "F. Biaya Hidup" di halaman cetak/preview MAK agar dijumlahkan secara dinamis dari enam field pengeluaran hidup (Listrik, Air, Transportasi, Pendidikan, Kebutuhan Rumah Tangga, Pengeluaran Lain) di halaman Analisa Konsumtif.
- [x] Membulatkan nilai perhitungan angsuran SLIK (Anuitas) ke integer terdekat (`Math.round`) di halaman cetak/preview MAK sehingga total angsuran terbebas dari angka desimal dibelakang koma (seperti `,086`).
**Keputusan baru:** Menggunakan port 1976 untuk server LFM-VL. Jika server LFM-VL mengalami timeout/error, proses ekstraksi otomatis fallback ke Tesseract OCR. "F. Biaya Hidup" pada memorandum dicetak dari jumlah riil 6 field biaya hidup form Analisa Konsumtif. Nilai angsuran anuitas SLIK dibulatkan ke integer.
**File yang diubah:** backend/src/config/index.js, backend/src/app.js, backend/src/services/document-ai/document-ai.schemas.js, backend/src/services/document-ai/document-ai.service.js, backend/src/modules/document/document.controller.js, backend/src/modules/document/document.routes.js, backend/src/modules/document/README.md, backend/scripts/test-document-ai.js, frontend/src/pages/mak/MakPreviewPage.jsx
**File JANGAN disentuh:** Form UI frontend lama dan endpoint `/ocr` lama karena masih aktif digunakan.
**Bug yang ditemukan:** Greediness pada regex pembersihan `tempat_lahir` dalam Tesseract KTP fallback (mengganti suffix `[A-Z\s\/.-]*` menjadi `[\s\/.-]*` agar kata sesudah nama kota tempat lahir tidak ikut terhapus).
**Hindari sesi berikutnya:** Menaruh regex penangkap data yang terlalu serakah (greedy) jika tidak diimbangi filter type karakter yang tepat.
**Task berikutnya:** Hubungkan endpoint VLM yang baru ke UI frontend React.
**Kode yang perlu ditempel:** -

---

## Sesi 12 — 2026-06-24 | Model: Antigravity (Gemini 1.5 Pro) | Modul: MAK (Memorandum Analisa Kredit)
**Goal:** Memperbarui perhitungan Row F. Biaya Hidup di halaman preview MAK dengan menambahkan Cicilan Existing, serta mencegah double-counting pengeluaran kredit di total pengeluaran dan sisa pendapatan.
**Yang selesai:**
- [x] Memperbarui definisi `biayaHidup` di `MakPreviewPage.jsx` untuk menjumlahkan 6 biaya hidup + `cicilan_existing`.
- [x] Mengatur variabel `angsuranEksisting` menjadi 0 untuk tipe kredit Konsumtif (`isKonsumtif ? 0 : ...`) guna menghindari double-counting `cicilan_existing` dalam total pengeluaran (Row G) dan sisa pendapatan (Row H).
- [x] Mengubah format tampilan Row E (Angsuran Kredit) agar menampilkan `Rp -` alih-alih `Rp 0` saat angsuran eksisting bernilai 0.
- [x] Melakukan kompilasi build frontend dan restart proxy Nginx.
**Keputusan baru:** Kewajiban/cicilan existing untuk kredit konsumtif digabung sepenuhnya ke dalam baris "F. Biaya Hidup" di tabel Aspek Keuangan MAK. Row E "Angsuran Kredit (apabila ada)" dikosongkan (menampilkan `Rp -`) untuk menghindari double-counting.
**File yang diubah:** frontend/src/pages/mak/MakPreviewPage.jsx
**File JANGAN disentuh:** backend/src/utils/financialFormulas.js, frontend/src/pages/analisa/AnalisaKonsumtifPage.jsx
**Bug yang ditemukan:** -
**Hindari sesi berikutnya:** -
**Task berikutnya:** Hubungkan endpoint VLM yang baru ke UI frontend React.
**Kode yang perlu ditempel:** -

---

## ════════════════════════════════════
## PROGRESS TRACKER PER MODUL
## ════════════════════════════════════
> Update setelah setiap sesi

| # | Modul | Status | Sesi Selesai | Catatan |
|---|-------|--------|-------------|---------|
| 01 | Master Data | ✅ Selesai | Sesi 1 | Phase 1 |
| 02 | Data Debitur | ✅ Selesai | Sesi 1 | Phase 1 |
| 03 | Pengajuan Kredit | ✅ Selesai | Sesi 1 | Phase 1 |
| 04 | Survey AO | ✅ Selesai | Sesi 1 | Phase 1 |
| 05 | Analisa Kredit | ✅ Selesai | Sesi 1 | Phase 1 |
| 06 | Scoring Engine (5C) | ✅ Selesai | Sesi 1 | Phase 1 |
| 07 | Agunan | ✅ Selesai | Sesi 1 | Phase 1 |
| 08 | Workflow Approval | ✅ Selesai | Sesi 1 | Phase 1 |
| 09 | MAK Generator | 🔄 In Progress | - | Phase 3 |
| 10 | Dashboard Kredit | ✅ Selesai | Sesi 1 | Phase 1 |
| 11 | EWS | ⬜ Belum mulai | - | Phase 5 |
| 12 | Laporan | 🔄 Basic only | - | Phase 1 |
| 13 | AI Credit Analyst | ⬜ Belum mulai | - | Phase 4 |
| 14 | Document AI (VLM) | ✅ Selesai | Sesi 11 | Phase 3 |

Status: ⬜ Belum | 🔄 In Progress | ✅ Selesai | ❌ Blocked

---

## ════════════════════════════════════
## GANTI MODEL — CHECKLIST
## ════════════════════════════════════
Saat token habis dan perlu ganti model AI, lakukan ini dulu:

### Sebelum ganti — tanya ke model lama:
```
Sebelum kita selesai, tolong:
1. Ringkas apa yang kita bangun sesi ini
2. Daftar keputusan baru yang dibuat
3. Daftar kesalahan atau jalan buntu yang ditemui
4. Berikan task eksak untuk sesi berikutnya
5. Daftar file yang diubah dan file yang sudah berjalan
```

### Buka model baru — paste ini:
```
Aku lanjutkan project yang sudah berjalan di production.
Ini adalah context sesi-ku:

[PASTE ISI .ai/CONTEXT.md]

Ini kode yang relevan:
[PASTE FILE YANG INGIN DIKERJAKAN]

Task sesi ini: [TASK SPESIFIK]
```

---

## 🔧 Sesi 13 — Fix VLM LFM Integration (24 Jun 2026)

### Masalah yang Ditemukan
- **Root Cause**: Backend container menggunakan `http://localhost:1976` untuk memanggil LFM VLM server, padahal dari dalam Docker container `localhost` merujuk ke container itu sendiri — bukan ke host machine tempat `llama-server` berjalan.
- **Dampak**: Semua panggilan VLM gagal (connection refused) dan sistem selalu fallback ke Tesseract OCR, sehingga pengguna tidak pernah mendapat hasil ekstraksi via VLM.

### Perubahan yang Dilakukan
1. **`docker-compose.yml`**: Tambah env var `LFM_API_URL=http://172.22.0.1:1976` (gateway docker bridge host) dan `OCR_ENGINE=lfm`, plus `extra_hosts: host.docker.internal:host-gateway`
2. **`.env`**: Tambah `LFM_API_URL` dan `OCR_ENGINE` sebagai referensi
3. **`document-ai.service.js`**:
   - Prompt per tipe dokumen dibuat lebih eksplisit (deskripsi field + contoh nilai, bukan hanya template JSON kosong)
   - Refactor `callLfmVision` → `callLfmVisionOnce` + wrapper `callLfmVision` dengan 1x retry otomatis
   - Naikkan `max_tokens` ke 700
   - Tambah JSON prefix sanitizer (`content.indexOf('{')`)
   - Logging lebih detail termasuk URL dan engine yang digunakan

### Hasil Verifikasi
- Engine: `lfm` ✅ (sebelumnya selalu `tesseract`)
- URL: `http://172.22.0.1:1976` ✅ (dapat dijangkau dari container)
- KTP Extraction test: NIK, nama, TTL, alamat, RT/RW, agama, status, pekerjaan — semua terisi dengan benar
- Waktu inference: ~20-24 detik per dokumen (CPU-only, normal untuk model 1.6B)

### Catatan
- Gambar test yang digunakan adalah synthetic image (PIL). Gambar KTP asli diharapkan memberikan hasil lebih akurat.
- `kecamatan` sesekali terisi salah karena layout KTP synthetic yang tidak ideal. Pada gambar KTP asli ini harusnya lebih baik.

---

## 🔧 Sesi 14 — Frontend ↔ VLM Document AI Integration (24 Jun 2026)

### Task
Sambungkan frontend `DebiturFormPage.jsx` ke endpoint VLM baru `/api/document/ktp` — menggantikan endpoint OCR lama `/ocr`.

### Masalah yang Ditemukan
- Frontend masih memanggil endpoint lama `ocrService.process()` → `/ocr` (Tesseract)
- Field mapping salah: VLM output pakai `snake_case` (`tempat_lahir`, `jenis_kelamin`) tapi state React pakai `camelCase` (`tempatLahir`, `gender`)
- Normalisasi nilai perlu: `LAKI-LAKI` → `L`, `KAWIN` → `KAWIN`, `DD-MM-YYYY` → `YYYY-MM-DD`
- `agama` tidak di-autofill meski VLM mengekstraknya
- `documentService` belum ada di `frontend/src/services/index.js`

### Perubahan yang Dilakukan
1. **`frontend/src/services/index.js`**: Tambah `documentService` dengan 6 endpoint VLM:
   `extractKtp`, `extractKk`, `extractNpwp`, `extractShm`, `extractBpkb`, `extractSurvey`
   — masing-masing ke `/document/{tipe}` dengan timeout 120 detik

2. **`frontend/src/pages/debitur/DebiturFormPage.jsx`**:
   - Import `documentService` + icon `Sparkles` dari lucide-react
   - Tambah state `vlmEngine` untuk tracking engine hasil scan
   - Tambah helper functions: `normalizeGender()`, `normalizeStatus()`, `normalizeDate()`
   - Ubah `handleOcrScan` untuk type `ktp`: pakai `documentService.extractKtp()` + mapping baru
   - Surat Nikah tetap pakai `ocrService` lama (tidak ada endpoint VLM)
   - UI scan KTP: tambah badge `🤖 VLM AI` (hijau) / `OCR` (amber) setelah scan
   - Teks status dinamis saat loading dan setelah berhasil

### Hasil Verifikasi
- Frontend di-rebuild dan deploy: ✅
- Bundle berisi `document/ktp`: ✅ (grep count = 1)
- Endpoint `/api/document/ktp` → HTTP 401 (route ada, butuh auth): ✅
- Semua container berjalan: ✅

### Catatan
- Belum ditest dengan foto KTP asli dari browser (butuh login user di sistem)
- Field `kelurahan` dari VLM kadang terisi nilai dari field lain pada gambar synthetic — pada KTP asli harusnya lebih akurat

---

## 🔧 Sesi 15 — Mengembalikan Perhitungan Row E & F MAK (24 Jun 2026)

### Task
Sesuai instruksi, mengembalikan perhitungan Row F (Biaya Hidup) pada MAK agar **tidak** menyertakan cicilan existing, dan menempatkan kembali cicilan existing tersebut pada Row E (Angsuran Kredit) untuk kredit Konsumtif.

### Perubahan yang Dilakukan
- **`MakPreviewPage.jsx`**: 
  - Mengembalikan `angsuranEksisting` untuk kredit Konsumtif agar mengambil nilai dari `financialAnalisa.cicilan_existing`.
  - Menghapus penjumlahan `financialAnalisa.cicilan_existing` dari variabel `biayaHidup`.
  - Row E kini kembali menampilkan nominal cicilan existing, sedangkan Row F murni berisi 6 komponen biaya hidup.
  - Melakukan rebuild frontend container (`docker compose up -d --build frontend`).

---

## 🔧 Sesi 16 — Tiered DSR & DSR Toggle Bypass (24 Jun 2026)

### Task
Merespon permintaan agar DSR tidak dihilangkan secara kaku, tetapi dibuat bertingkat (Tiered) berdasarkan besaran penghasilan. Selain itu, ditambahkan fitur Toggle (Bypass) DSR sehingga analis dapat mematikan filter DSR dan status kelayakan murni mengandalkan indikator RPC.

### Perubahan yang Dilakukan
1. **Database (`analisa_konsumtif`)**:
   - Menambahkan kolom `use_dsr BOOLEAN DEFAULT true` via `ALTER TABLE` agar state toggle tersimpan dan tetap ada saat halaman dimuat ulang.
2. **Backend (`financialFormulas.js` & `analisa.service.js`)**:
   - Menerapkan Tiered DSR:
     - Gaji ≤ Rp 5 Juta -> Max DSR 30%
     - Gaji > 5 Juta - 15 Juta -> Max DSR 40%
     - Gaji > 15 Juta - 50 Juta -> Max DSR 50%
     - Gaji > 50 Juta -> Max DSR 60%
   - Parameter `useDsr` digunakan untuk mengecualikan filter `dsr <= maxDsr` dari variabel `layak`.
   - Mengubah `INSERT` agar menampung nilai `use_dsr` dari frontend.
3. **Frontend (`AnalisaKonsumtifPage.jsx`)**:
   - Menambahkan Switch/Toggle component di baris DSR.
   - Menampilkan status dinamis `(Diabaikan)` jika dimatikan, dan menampilkan Max DSR dinamis (`max 30%`, `max 50%`, dll) jika dinyalakan.

### Hasil Eksekusi
- Database berhasil di-alter.
- Logika backend telah diuji melalui penyesuaian kode.
- Frontend container berhasil direbuild dan diaplikasikan ke live server.

### Follow-up Task:
- Mengubah default DSR menjadi disable (OFF).
- Memindahkan field "Angsuran Diajukan" dari block Pengeluaran ke block Hasil Analisa.
- Mengisi otomatis "Angsuran Diajukan" dari data `pengajuan` (`angsuran_perbulan`) menggunakan `pengajuanService`.
- **Fix 2**: `UPDATE analisa_konsumtif SET use_dsr = false;` agar semua data lama menggunakan default OFF, serta mengubah `ALTER COLUMN use_dsr SET DEFAULT false`.
- **Fix 2**: Memperbaiki fallback logika autofill sehingga jika angsuran_diajukan dari DB adalah 0, sistem akan memaksa load dari `angsuran_perbulan` pengajuan.

---

## 🔧 Sesi 17 — Opsi Sistem Angsuran FLAT dan ANUITAS (24 Jun 2026)

### Task
Menambahkan opsi pada halaman pembuatan Pengajuan Kredit agar analis dapat memilih metode perhitungan angsuran secara **FLAT** atau **ANUITAS**, yang otomatis menyesuaikan nilai "Angsuran per Bulan (auto)".

### Perubahan yang Dilakukan
1. **Database (`pengajuan`)**:
   - Menambahkan kolom `sistem_angsuran VARCHAR(20) DEFAULT 'FLAT'` via `ALTER TABLE`.
2. **Backend (`financialFormulas.js` & `pengajuan.service.js`)**:
   - Menambahkan parameter `sistemAngsuran` pada `hitungAngsuran` yang mendukung percabangan dua metode (FLAT: (Pokok+BungaTahunan/12) dan ANUITAS: rumus present value anuitas standar).
   - Memasukkan `sistem_angsuran` dalam eksekusi query insert ke tabel `pengajuan`.
3. **Frontend (`PengajuanFormPage.jsx`)**:
   - Menambahkan *state* baru `sistemAngsuran` pada form.
   - Menambahkan opsi elemen UI `<select>` di samping Suku Bunga.
   - Mengubah blok efek auto-calc untuk mendukung dua cara menghitung nilai `angsuranPerbulan` secara dinamis mengikuti sistem yang dipilih.

### Hasil Eksekusi
- Sistem angsuran telah masuk ke DB.
- UI pada Pengajuan Kredit sudah memiliki dropdown FLAT/ANUITAS yang bereaksi instan merubah nilai kalkulasi cicilan.

### Follow-up Task untuk Sesi Berikutnya:
- **BUG FIX KRITIS**: Memperbaiki proses *save* Analisa Konsumtif. Saat ini, karena `AnalisaKonsumtifPage.jsx` tidak memuat dan mengirim ulang parameter `sistemAngsuran`, `bungaPerTahun`, `jangkaWaktuBulan`, dan `plafon` ke backend, perhitungan `maxKredit` di `hitungKonsumtif` menggunakan nilai 0 (dan ter-fallback ke 0). Hal ini menyebabkan penyimpanan nilai *Max Kredit* di analisa jadi meleset. Sesi selanjutnya HARUS memperbaiki *data passing* ini.

---

## 🔧 Sesi 18 — Perbaikan Perhitungan Total Pengeluaran (24 Jun 2026)

### Task
Memperbaiki rumus perhitungan "Total Pengeluaran" di Analisa Konsumtif agar hanya menjumlahkan: Listrik, Air, Transportasi, Pendidikan, Cicilan Existing, Kebutuhan Rumah Tangga, dan Pengeluaran Lain. "Angsuran Diajukan" dan "Pengurang Angsuran" tidak boleh dimasukkan ke dalam Total Pengeluaran.

### Perubahan yang Dilakukan
1. **Frontend (`AnalisaKonsumtifPage.jsx`)**:
   - Mengubah `totalPengeluaran` agar tidak memanggil `totalCicilan` (yang mencakup angsuran diajukan dan pengurang angsuran), melainkan memanggil `totalPengeluaranBase + form.cicilanExisting`.
2. **Backend (`financialFormulas.js`)**:
   - Mengubah perhitungan `totalPengeluaran` pada fungsi `hitungKonsumtif` dengan cara yang sama agar perhitungan kelayakan saat disimpan ke database sama persis dengan frontend.
3. **Deployment**:
   - Melakukan `docker compose up -d --build backend frontend` untuk me-rebuild image docker dan me-restart container dengan kode terbaru.

### Hasil Eksekusi
- Perhitungan "Total Pengeluaran" di Kalkulator frontend sekarang hanya memuat 7 komponen pengeluaran tersebut.
- Perubahan berhasil dideploy ke environment Docker.

---

## 🔧 Sesi 19 — Perbaikan Akurasi VLM KTP (24 Jun 2026)

### Task
Memperbaiki akurasi pembacaan OCR VLM untuk KTP karena model berhalusinasi (misal: menebak alamat 'Jakarta', salah membaca tempat lahir menjadi 'Pelayoran', dan gagal mem-parsing tanggal lahir).

### Perubahan yang Dilakukan
1. **Backend (`document-ai.service.js`)**:
   - Memperketat prompt untuk dokumen KTP dengan instruksi eksplisit: `BACA TEKS PERSIS SEPERTI YANG TERTULIS PADA GAMBAR KTP` dan `DILARANG mengarang, menebak, atau menambahkan kata yang tidak ada di gambar`.
   - Memperjelas instruksi agar field `tempat_lahir` dan `tanggal_lahir` diekstrak persis dari kata sebelum/sesudah tanda koma.
2. **Frontend (`DebiturFormPage.jsx`)**:
   - Memperbaiki fungsi `normalizeDate` menggunakan regex yang tidak _anchored_ (menghapus `^` dan `$`) agar dapat menangkap format tanggal lahir `DD-MM-YYYY` meskipun dikembalikan dengan teks tambahan oleh VLM.
   - Menambahkan _fallback_ format `YYYY-MM-DD` jika VLM mereturn format tersebut secara natural.
3. **Deployment**:
   - Melakukan `docker compose up -d --build backend frontend`.

### Hasil Eksekusi
- Sistem prompt backend dan fungsi normalisasi tanggal frontend telah diperbarui.
- Diharapkan keakuratan ekstraksi VLM untuk nama, tempat/tanggal lahir, alamat, kelurahan, dan kecamatan meningkat dan tidak berhalusinasi.

---

## 🔧 Sesi 20 — Penyesuaian Prompt VLM SHM (24 Jun 2026)

### Task
Menyesuaikan prompt VLM untuk dokumen Sertifikat Hak Milik (SHM) agar sesuai dengan struktur gambar sertifikat sebenarnya (seperti Buku Tanah dan Surat Ukur) dan menghindari halusinasi.

### Perubahan yang Dilakukan
- **Backend (`document-ai.service.js`)**:
  - Memperbarui prompt untuk `case 'shm'` agar lebih ketat: `BACA TEKS PERSIS SEPERTI YANG TERTULIS PADA GAMBAR SERTIFIKAT TANAH (SHM)`.
  - Menambahkan aturan larangan mengarang/menebak (halusinasi).
  - Memberikan panduan spesifik per field agar AI bisa menemukan nilainya secara lebih presisi (misalnya mencari `luas_tanah` hanya angkanya saja, mencari `atas_nama` di bawah "NAMA PEMEGANG HAK", dll).
  - Melakukan _rebuild_ image backend Docker agar prompt terbaru segera teraplikasi pada server.

### Hasil Eksekusi
- Sistem backend telah menggunakan struktur instruksi VLM SHM yang baru dan lebih kebal terhadap data yang tidak ada di dalam gambar.

## [2026-06-24] UI/UX Improvement - Input Format Rupiah
- **Modifikasi:** Mengubah field input yang tadinya `<input type="number">` biasa menjadi `<input type="text">` dengan fungsi format otomatis ribuan (titik) serta memiliki prefix `Rp`.
- **File Terdampak:** `AnalisaKonsumtifPage.jsx` (semua input Gaji, Pengeluaran, Angsuran Diajukan) dan `AnalisaProduktifPage.jsx` (Omset, Biaya, Angsuran).
