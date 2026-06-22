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
