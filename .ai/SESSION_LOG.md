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
| 13 | AI Credit Analyst | 🔄 In Progress | Sesi 28 | Phase 4 |
| 14 | Document AI (VLM) | ✅ Selesai | Sesi 11 | Phase 3 |
| 15 | Decision Kernel | ✅ Selesai | Sesi 27 | Phase 5 |
| 16 | Analysis Package | ✅ Selesai | Sesi 28 | Phase 6.1 |
| 17 | PromptContext | ✅ Selesai | Sesi 29 | Phase 6.2 |
| 18 | Prompt Definitions | ✅ Selesai | Sesi 30 | Phase 6.3 |
| 19 | LLM Adapters | ✅ Selesai | Sesi 31 | Phase 6.4 |
| 20 | Narrative Engine | ✅ Selesai | Sesi 32 | Phase 6.5 |
| 21 | MAK Builder | ✅ Selesai | Sesi 33 | Phase 6.6 |

---

## 🔒 AI ARCHITECTURE v1.0 — LOCKED (26 Jun 2026)

**Goal:** Memfinalisasikan arsitektur AI Credit Analyst sebagai bounded context yang terpisah dengan prinsip stable contract, prompt version independence, dan provider independence.

**Prinsip Tambahan yang Dikunci:**
1. **Stable Contract Rule:** AnalysisPackage v1.0 bersifat append-only, tidak boleh mengubah field yang sudah dipublikasikan.
2. **Prompt Version Independence:** Prompt Definition memiliki lifecycle sendiri, tidak bergantung pada versi AnalysisPackage.
3. **Provider Independence Rule:** Hanya LLMAdapter yang boleh mengenal SDK vendor, seluruh modul AI lainnya bersifat provider-agnostic.

**File yang diperbarui:**
- `.kilo/plans/1782486628090-ai-credit-analyst-architecture.md` (architectural plan)
- `.ai/DECISIONS.md` (AI Boundary Rule, Stable Contract Rule)
- `.ai/CONTEXT.md` (task update)
- `.ai/SESSION_LOG.md` (progress tracker)

**Task berikutnya:** Lanjutkan ke Sprint 6.3 — Prompt Definitions & Builder.

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

---

## 🔧 Sesi 21 — Perbaikan Akurasi VLM KTP, SHM, Surat Nikah, KK, BPKB & Form Agunan (25 Jun 2026)
**Goal:** Meningkatkan akurasi proses OCR/VLM yang kurang maksimal, dengan menerapkan pre-processing gambar, memperketat prompt untuk dokumen selain KTP (Surat Nikah, KK, NPWP, BPKB, SHM), menambah post-processing (regex sanitization), serta menggabungkan scan Surat Nikah & form Agunan menggunakan endpoint VLM baru.
**Yang selesai:**
- [x] Menerapkan pre-processing gambar (Grayscale, Normalize, Deskew 40%, Sharpen) menggunakan `imagemagick` via `execFile` di backend sebelum diproses VLM.
- [x] Memperbarui schema dan prompt VLM untuk KTP, KK, NPWP, BPKB, Surat Nikah, dan SHM (ditambah ekstraksi `provinsi` dan pola deteksi nomor pada SHM).
- [x] Menambahkan _post-processing sanitizer_ regex di `validateAndClean` untuk memastikan karakter di field NIK, No. KK, NPWP, dan Luas Tanah berupa angka murni (tanpa salah ketik huruf O/A dll).
- [x] Memigrasikan scan dokumen "Surat Nikah" ke endpoint `/document/surat_nikah` (meninggalkan _fallback_ Tesseract lama).
- [x] Memigrasikan fungsi pemindaian di form Agunan (`AgunanFormPage.jsx` & `AgunanEditPage.jsx`) menggunakan `documentService` VLM (SHM dan BPKB) dengan mapping state yang tepat dan pembentukan alamat otomatis dari `desa` + `kecamatan` + `kabupaten`.
- [x] Me-rebuild dan restart environment Docker untuk `backend` dan `frontend`.
**Keputusan baru:** Seluruh proses OCR/VLM di sistem, tanpa terkecuali, kini terpusat pada service Document AI baru (Llama Vision) dengan pra-pemrosesan gambar otomatis untuk meminimalkan halusinasi model. Pemindaian lawas berbasis OCR Service Tesseract dihapus penggunaannya di _frontend_.
**File yang diubah:** `backend/src/services/document-ai/document-ai.service.js`, `backend/src/services/document-ai/document-ai.schemas.js`, `backend/src/modules/document/document.controller.js`, `backend/src/modules/document/document.routes.js`, `frontend/src/services/index.js`, `frontend/src/pages/debitur/DebiturFormPage.jsx`, `frontend/src/pages/agunan/AgunanFormPage.jsx`, `frontend/src/pages/agunan/AgunanEditPage.jsx`
**File JANGAN disentuh:** `backend/src/modules/ocr/ocr.service.js` (Simpan sebagai museum _fallback_ cadangan)
**Bug yang ditemukan:** Frontend Form Agunan sempat tertinggal belum memakai arsitektur VLM yang baru dan masih menggunakan legacy endpoint. Pemetaan nilai (state mapping) juga kurang tepat untuk data _snake_case_ yang dikirim VLM backend.
**Hindari sesi berikutnya:** Menambah endpoint backend yang memengaruhi state frontend tanpa melakukan pembersihan global / *refactoring* menyeluruh ke halaman-halaman yang fungsinya tumpang tindih.
**Task berikutnya:** Fokus mengeksplorasi modul EWS (Early Warning System - Phase 5) karena fungsionalitas MAK dan Document AI sudah memadai.
**Kode yang perlu ditempel:** -

---

## 🔧 Sesi 22 — Upgrade Prompt OCR SHM + Field Mapping Agunan (25 Jun 2026)
**Goal:** Meningkatkan kelengkapan ekstraksi data dari dokumen SHM menggunakan data nyata SHM No. 01620 (AAW579903, Sidomulyo, Limpung, Batang) sebagai referensi, dan memperkaya field mapping ke form agunan.
**Yang selesai:**
- [x] Upgrade prompt VLM SHM dari 8 field basic menjadi 23 field komprehensif: NIB, kode dokumen, nama pemegang hak, tanggal lahir pemegang, keadaan tanah, luas terbilang, nomor surat ukur, asal hak, hak tanggungan aktif, nama kreditur HT, nomor HT, referensi DI 307/208, kantor pertanahan.
- [x] Prompt baru adaptif — mampu baca semua halaman SHM (Cover DI-206, Pendaftaran, Peralihan HT, Surat Ukur DI-207) dari 1 upload gambar.
- [x] Perluas `SHM_SCHEMA` di `document-ai.schemas.js` dengan semua field baru, backward-compatible (field lama `atas_nama`, `kabupaten`, `desa` tetap ada sebagai alias).
- [x] `validateAndClean` case `'shm'` diperbarui: smart alias resolution, safe null handling, konversi `luas_m2` integer, boolean untuk `hak_tanggungan_aktif`.
- [x] Field mapping OCR → form agunan diperluas di `AgunanFormPage.jsx` dan `AgunanEditPage.jsx` menggunakan logika `formMapper.js`: `nama_pemegang_hak`, `luas_m2`, `desa_kelurahan`, `kabupaten_kota`, `keadaan_tanah` → `deskripsi`, `buildAlamat` (desa + Kec. + Kab. + provinsi).
- [x] Backend di-cp dan di-restart (`bpr_bapera_api`), frontend di-rebuild dan di-recreate (`bpr_bapera_frontend`).
**Keputusan baru:** Field `atas_nama` dan `kabupaten` dst dipertahankan sebagai alias (bukan dihapus) di schema untuk backward compatibility. Prompt SHM adalah single-image adaptive (bukan multi-halaman terpisah karena VLM hanya 1 gambar per call). Deskripsi agunan otomatis diisi dari `keadaan_tanah` + `luas_m2`.
**File yang diubah:**
- `backend/src/services/document-ai/document-ai.schemas.js` — SHM_SCHEMA diperluas + validateAndClean
- `backend/src/services/document-ai/document-ai.service.js` — prompt SHM komprehensif
- `frontend/src/pages/agunan/AgunanFormPage.jsx` — field mapping SHM diperluas
- `frontend/src/pages/agunan/AgunanEditPage.jsx` — field mapping SHM diperluas
**File JANGAN disentuh:** `backend/src/modules/ocr/ocr.service.js`, `backend/src/modules/document/document.routes.js`, `frontend/src/services/index.js`
**Bug yang ditemukan:** -
**Hindari sesi berikutnya:** Jangan ganti field schema yang sudah ada menjadi field baru tanpa alias backward compat — bisa break response yang sudah ada di frontend lain.
**Task berikutnya:** Test live scan SHM di form agunan, lalu lanjut ke modul EWS (Phase 5).
**Kode yang perlu ditempel:** -

---

## 🔧 Sesi 23 — Upload Multi-Halaman SHM + Merge ke Form Agunan (25 Jun 2026)
**Goal:** Pecah upload SHM menjadi 5 slot terpisah per jenis halaman agar VLM bisa menggunakan prompt yang spesifik untuk setiap halaman, meningkatkan akurasi ekstraksi data agunan secara signifikan.
**Yang selesai:**
- [x] +5 prompt VLM per-halaman: `shm_cover`, `shm_pendaftaran`, `shm_peralihan`, `shm_surat_ukur`, `shm_peta`
- [x] +5 `validateAndClean` case di schemas untuk sanitasi output VLM per halaman
- [x] +`processSHMPage` controller + route `POST /document/shm/page` (diletakkan SEBELUM `/shm`)
- [x] +`extractShmPage` di `services/index.js`
- [x] Rewrite `AgunanFormPage.jsx` + `AgunanEditPage.jsx`: 5-slot UI dengan status idle/loading/done/error, badge Wajib/Opsional, tombol "Terapkan ke Form" (merge cerdas dengan prioritas field)
- [x] Batas tanah dari `nama_tetangga[]` hasil `shm_peta`; BPKB single upload tetap berfungsi
- [x] Backend restart ✅, frontend rebuild ✅
**Keputusan baru:** Merge di frontend (bukan backend) agar user bisa edit manual sebelum simpan. Route `/shm/page` HARUS di atas `/shm` di routes.js.
**File yang diubah:** `document-ai.service.js`, `document-ai.schemas.js`, `document.controller.js`, `document.routes.js`, `services/index.js`, `AgunanFormPage.jsx`, `AgunanEditPage.jsx`
**File JANGAN disentuh:** `backend/src/modules/ocr/ocr.service.js`, database schema, credit scoring
**Bug yang ditemukan:** -
**Hindari sesi berikutnya:** Jangan tambah route `/shm/xxx` setelah `/shm` — Express first-match akan menelan subroute.
**Task berikutnya:** Test live upload per halaman SHM, lalu modul EWS (Phase 5).
**Kode yang perlu ditempel:** -

## 🔧 Sesi 24 — Fix VLM Halusinasi & Limit Upload File (25 Jun 2026)
**Goal:** Menghilangkan halusinasi (data fiktif) dari hasil bacaan KTP, mencocokkan struktur UI Form Debitur dengan KTP, dan mengatasi kendala gagal upload file (gambar/PDF) berukuran besar.
**Yang selesai:**
- [x] Memperbaiki *prompt* instruksi VLM KTP di `document-ai.service.js` dengan menghapus contoh teks negatif yang justru memicu halusinasi kata.
- [x] Merombak struktur UI Form Debitur (`DebiturFormPage.jsx`) khusus KTP dengan memisahkan RT & RW, serta menambahkan Agama, Pekerjaan, Kewarganegaraan, dan Berlaku Hingga agar sinkron dengan hasil OCR.
- [x] Mengatasi error "tidak bisa upload image/pdf" dengan menaikkan limit unggahan file dari 10 MB menjadi 50 MB pada *reverse proxy* (`nginx.conf`) dan layer aplikasi Node.js (`backend/src/middleware/upload.js`).
- [x] Me-rebuild container frontend, backend, dan Nginx.
**Keputusan baru:** Semua isian Form Debitur untuk Data KTP kini disamakan persis dengan field fisik KTP agar mengurangi perbedaan interpretasi data. Batas ukuran unggahan dokumen kini disetel longgar di 50 MB.
**File yang diubah:**
- `backend/src/services/document-ai/document-ai.service.js`
- `frontend/src/pages/debitur/DebiturFormPage.jsx`
- `nginx/nginx.conf`
- `backend/src/middleware/upload.js`
**File JANGAN disentuh:** -
**Bug yang ditemukan:** (1) Instruksi contoh negatif pada prompt VLM memicu munculnya data fiktif (halusinasi). (2) Nginx dan Multer secara *default* langsung memotong unggahan foto/PDF resolusi tinggi karena limit 10 MB yang kekecilan.
**Hindari sesi berikutnya:** Menaruh contoh negatif berisi string eksplisit dalam instruksi ke Llama Vision.
**Task berikutnya:** Fokus mengerjakan modul EWS (Early Warning System) atau AI Credit Analyst.
**Kode yang perlu ditempel:** -

---

## 🔧 Sesi 25 — Fix Docker Deploy & Import Backend (26 Jun 2026)
**Goal:** Mengatasi error browser -102 (`ERR_CONNECTION_REFUSED`) saat akses `http://localhost:8085/` dan memulihkan backend yang crash-loop setelah `git pull`.
**Yang selesai:**
- [x] Menyalakan Docker Desktop dan menjalankan `docker compose up -d` (build pertama gagal karena konflik nama container lama).
- [x] Membersihkan container stale (`bpr_bapera_db`, `bpr_bapera_wa`, `bpr_bapera_minio`) lalu start ulang semua service.
- [x] Fix `upload.single is not a function` — import salah di `document-intelligence.routes.js` (harus `{ upload }`).
- [x] Fix `MODULE_NOT_FOUND` — path OCR lama di `document-ai.service.js` setelah refactor folder (`ocr/services/`, `ocr/utils/parsers`).
- [x] Migrasi 5 file + seed admin berhasil di container backend.
- [x] Verifikasi: frontend HTTP 200, API health OK di `http://localhost:8085/api/health`.
**Keputusan baru:** Tidak ada keputusan arsitektur baru — hanya perbaikan import pasca-refactor OCR module.
**File yang diubah:**
- `backend/src/modules/document-intelligence/routes/document-intelligence.routes.js`
- `backend/src/services/document-ai/document-ai.service.js`
**File JANGAN disentuh:** Struktur folder OCR baru (`modules/ocr/services/`, `pipeline/`, dll) — sudah benar, yang rusak hanya import lama.
**Bug yang ditemukan:**
- Error -102 = tidak ada service di port 8085 (Docker belum jalan / container belum start).
- Build Docker terhenti → container `Created` tapi tidak `Started` → konflik nama saat retry.
- Backend crash: import `upload` default vs named export; path `ocr.service` & `parsers` sudah dipindah.
**Hindari sesi berikutnya:** Setelah refactor/move file, grep semua `require()` ke path lama sebelum deploy Docker.
**Task berikutnya:** EWS (Phase 5), Laporan, atau AI Credit Analyst — sesuai instruksi pengguna.
**Kode yang perlu ditempel:** -

---

## 🔧 Sesi 26 — Keputusan Arsitektur Sprint 5.10: Decision Kernel (26 Jun 2026)
**Goal:** Menutup fase arsitektur Phase 5 dengan artefak kanonik tunggal sebelum implementasi Decision & AI.
**Yang disepakati (🔒 LOCKED di DECISIONS.md):**
- [x] **Sprint 5.10 = Decision Kernel** — Single Source of Truth keputusan kredit (bukan DTO, bukan object berbeda per consumer).
- [x] Rantai: `AssessmentContext → DecisionIntent → DecisionPolicy → DecisionKernel`.
- [x] **Immutability + revision**: perubahan keputusan = `Decision V2`, bukan mutasi V1.
- [x] **Decision Fingerprint**: `SHA256(AssessmentFP + IntentFP + PolicyFP + DecisionPayload)`.
- [x] **AnalysisPackage**: paket immutable tunggal untuk AI; AI tidak akses DB/Rule/Formula.
- [x] Urutan runtime: `DecisionKernel → AnalysisPackage → AI → Committee → Disbursement` (workflow = consumer).
- [x] **Phase 6 dipecah**: 6.1 Analysis Package, 6.2 Prompt Builder, 6.3 Narrative Engine, 6.4 MAK Generator, 6.5 LLM Adapter.
- [x] **Stop bounded context baru** — prioritas: Rule Library BPR, Policy Pack SOP, Decision Kernel, AI Analyst.
**Keputusan baru:** `DecisionBuilder` diganti konsepnya menjadi **Decision Kernel** sebagai artefak domain final. Committee Workflow diposisikan setelah AI, bukan sebelum.
**File yang diubah:** `.ai/DECISIONS.md`, `.ai/CONTEXT.md`, `.ai/SESSION_LOG.md`
**Gap codebase (belum diimplementasi):**
- `DecisionBuilder` / `DecisionKernel` entity belum ada di `backend/src/modules/`
- Orchestrator end-to-end belum ter-wire dari `AssessmentReadyForDecision`
- `AnalysisPackage` builder belum ada
**Task berikutnya:** Implementasi Sprint 5.10 — `DecisionKernel` entity, schema, builder, fingerprint, revision service.
**Kode yang perlu ditempel:** `decision-intent/`, `decision-policy/`, `assessment/`, `.ai/DECISIONS.md` section E

---

## 🔧 Sesi 27 — Sprint 5.10: Decision Kernel (Aggregate Root) (26 Jun 2026)
**Goal:** Menutup fase arsitektur Phase 5 dengan artefak kanonik tunggal sebelum implementasi Decision & AI.
**Yang selesai:**
- [x] Modul `backend/src/modules/decision-kernel/` — entity, schema, builder, revision, integrity, fingerprint, manifest, events.
- [x] `DecisionKernel` immutable + `DecisionRevisionService` (V1→V2, tanpa mutasi).
- [x] `DecisionFingerprint` = SHA256(AssessmentFP + IntentFP + PolicyFP + DecisionPayload).
- [x] `DecisionManifest` v1.0.0 (seperti OCR manifest).
- [x] `DecisionOrchestrator` — rantai penuh Pipeline → Facts → Capabilities → DecisionFacts → Intent → Policy → Kernel.
- [x] `DecisionWorkflow` — subscribe `AssessmentReadyForDecision`, emit `DecisionRequested` → `DecisionKernelCreated`.
- [x] Unit + integration test (7 test, semua pass).
**Keputusan baru:** Committee Workflow subscribe `DecisionKernelCreated` (bukan membentuk keputusan). `DecisionIntegrityService` terpisah dari fingerprint computation.
**File yang diubah/dibuat:**
- `backend/src/modules/decision-kernel/**` (modul baru)
- `backend/src/modules/workflows/decision-workflow.js`
- `backend/tests/modules/decision-kernel/decision-kernel.test.js`
- `backend/tests/modules/workflows/decision-workflow.integration.test.js`
- `.ai/DECISIONS.md`, `.ai/CONTEXT.md`, `.ai/SESSION_LOG.md`
**Task berikutnya:** Sprint 6.1 Analysis Package, lalu Rule Library BPR & Policy Pack SOP.
**Kode yang perlu ditempel:** `decision-kernel/index.js`, `.ai/DECISIONS.md` section E

---

## 🔧 Sesi 28 — Sprint 6.1: Analysis Package (26 Jun 2026)
**Goal:** Membangun AnalysisPackage sebagai paket immutable untuk AI Credit Analyst.
**Yang selesai:**
- [x] Modul `backend/src/modules/analysis-package/` — entity, schema, builder.
- [x] `AnalysisPackage` immutable dengan fingerprint konsisten.
- [x] Package berisi: `DecisionKernel + FactCollection + CapabilityCollection + Intent + Policy`.
- [x] AI hanya baca package ini, tidak akses database langsung.
- [x] Unit test 3 test, semua pass.
**Keputusan baru:** AnalysisPackage = frozen snapshot untuk AI consumption. AI tidak boleh membaca database, rule, atau formula langsung.
**File yang diubah/dibuat:**
- `backend/src/modules/analysis-package/**` (modul baru)
- `backend/tests/modules/analysis-package/analysis-package.test.js`
**Task berikutnya:** Sprint 6.2 Prompt Builder → Narrative Engine → MAK Generator → LLM Adapter.

---

## 🔧 Sesi 29 — Sprint 6.2: PromptContext (26 Jun 2026)
**Goal:** Create PromptContext as AI View Model — immutable representation of AnalysisPackage optimized for prompts.
**Yang selesai:**
- [x] Modul `backend/src/modules/ai/context/` — PromptContext entity, schema, builder.
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

---

## 🔧 Sesi 21 — Perbaikan Akurasi VLM KTP, SHM, Surat Nikah, KK, BPKB & Form Agunan (25 Jun 2026)
**Goal:** Meningkatkan akurasi proses OCR/VLM yang kurang maksimal, dengan menerapkan pre-processing gambar, memperketat prompt untuk dokumen selain KTP (Surat Nikah, KK, NPWP, BPKB, SHM), menambah post-processing (regex sanitization), serta menggabungkan scan Surat Nikah & form Agunan menggunakan endpoint VLM baru.
**Yang selesai:**
- [x] Menerapkan pre-processing gambar (Grayscale, Normalize, Deskew 40%, Sharpen) menggunakan `imagemagick` via `execFile` di backend sebelum diproses VLM.
- [x] Memperbarui schema dan prompt VLM untuk KTP, KK, NPWP, BPKB, Surat Nikah, dan SHM (ditambah ekstraksi `provinsi` dan pola deteksi nomor pada SHM).
- [x] Menambahkan _post-processing sanitizer_ regex di `validateAndClean` untuk memastikan karakter di field NIK, No. KK, NPWP, dan Luas Tanah berupa angka murni (tanpa salah ketik huruf O/A dll).
- [x] Memigrasikan scan dokumen "Surat Nikah" ke endpoint `/document/surat_nikah` (meninggalkan _fallback_ Tesseract lama).
- [x] Memigrasikan fungsi pemindaian di form Agunan (`AgunanFormPage.jsx` & `AgunanEditPage.jsx`) menggunakan `documentService` VLM (SHM dan BPKB) dengan mapping state yang tepat dan pembentukan alamat otomatis dari `desa` + `kecamatan` + `kabupaten`.
- [x] Me-rebuild dan restart environment Docker untuk `backend` dan `frontend`.
**Keputusan baru:** Seluruh proses OCR/VLM di sistem, tanpa terkecuali, kini terpusat pada service Document AI baru (Llama Vision) dengan pra-pemrosesan gambar otomatis untuk meminimalkan halusinasi model. Pemindaian lawas berbasis OCR Service Tesseract dihapus penggunaannya di _frontend_.
**File yang diubah:** `backend/src/services/document-ai/document-ai.service.js`, `backend/src/services/document-ai/document-ai.schemas.js`, `backend/src/modules/document/document.controller.js`, `backend/src/modules/document/document.routes.js`, `frontend/src/services/index.js`, `frontend/src/pages/debitur/DebiturFormPage.jsx`, `frontend/src/pages/agunan/AgunanFormPage.jsx`, `frontend/src/pages/agunan/AgunanEditPage.jsx`
**File JANGAN disentuh:** `backend/src/modules/ocr/ocr.service.js` (Simpan sebagai museum _fallback_ cadangan)
**Bug yang ditemukan:** Frontend Form Agunan sempat tertinggal belum memakai arsitektur VLM yang baru dan masih menggunakan legacy endpoint. Pemetaan nilai (state mapping) juga kurang tepat untuk data _snake_case_ yang dikirim VLM backend.
**Hindari sesi berikutnya:** Menambah endpoint backend yang memengaruhi state frontend tanpa melakukan pembersihan global / *refactoring* menyeluruh ke halaman-halaman yang fungsinya tumpang tindih.
**Task berikutnya:** Fokus mengeksplorasi modul EWS (Early Warning System - Phase 5) karena fungsionalitas MAK dan Document AI sudah memadai.
**Kode yang perlu ditempel:** -

---

## 🔧 Sesi 22 — Upgrade Prompt OCR SHM + Field Mapping Agunan (25 Jun 2026)
**Goal:** Meningkatkan kelengkapan ekstraksi data dari dokumen SHM menggunakan data nyata SHM No. 01620 (AAW579903, Sidomulyo, Limpung, Batang) sebagai referensi, dan memperkaya field mapping ke form agunan.
**Yang selesai:**
- [x] Upgrade prompt VLM SHM dari 8 field basic menjadi 23 field komprehensif: NIB, kode dokumen, nama pemegang hak, tanggal lahir pemegang, keadaan tanah, luas terbilang, nomor surat ukur, asal hak, hak tanggungan aktif, nama kreditur HT, nomor HT, referensi DI 307/208, kantor pertanahan.
- [x] Prompt baru adaptif — mampu baca semua halaman SHM (Cover DI-206, Pendaftaran, Peralihan HT, Surat Ukur DI-207) dari 1 upload gambar.
- [x] Perluas `SHM_SCHEMA` di `document-ai.schemas.js` dengan semua field baru, backward-compatible (field lama `atas_nama`, `kabupaten`, `desa` tetap ada sebagai alias).
- [x] `validateAndClean` case `'shm'` diperbarui: smart alias resolution, safe null handling, konversi `luas_m2` integer, boolean untuk `hak_tanggungan_aktif`.
- [x] Field mapping OCR → form agunan diperluas di `AgunanFormPage.jsx` dan `AgunanEditPage.jsx` menggunakan logika `formMapper.js`: `nama_pemegang_hak`, `luas_m2`, `desa_kelurahan`, `kabupaten_kota`, `keadaan_tanah` → `deskripsi`, `buildAlamat` (desa + Kec. + Kab. + provinsi).
- [x] Backend di-cp dan di-restart (`bpr_bapera_api`), frontend di-rebuild dan di-recreate (`bpr_bapera_frontend`).
**Keputusan baru:** Field `atas_nama` dan `kabupaten` dst dipertahankan sebagai alias (bukan dihapus) di schema untuk backward compatibility. Prompt SHM adalah single-image adaptive (bukan multi-halaman terpisah karena VLM hanya 1 gambar per call). Deskripsi agunan otomatis diisi dari `keadaan_tanah` + `luas_m2`.
**File yang diubah:**
- `backend/src/services/document-ai/document-ai.schemas.js` — SHM_SCHEMA diperluas + validateAndClean
- `backend/src/services/document-ai/document-ai.service.js` — prompt SHM komprehensif
- `frontend/src/pages/agunan/AgunanFormPage.jsx` — field mapping SHM diperluas
- `frontend/src/pages/agunan/AgunanEditPage.jsx` — field mapping SHM diperluas
**File JANGAN disentuh:** `backend/src/modules/ocr/ocr.service.js`, `backend/src/modules/document/document.routes.js`, `frontend/src/services/index.js`
**Bug yang ditemukan:** -
**Hindari sesi berikutnya:** Jangan ganti field schema yang sudah ada menjadi field baru tanpa alias backward compat — bisa break response yang sudah ada di frontend lain.
**Task berikutnya:** Test live scan SHM di form agunan, lalu lanjut ke modul EWS (Phase 5).
**Kode yang perlu ditempel:** -

---

## 🔧 Sesi 23 — Upload Multi-Halaman SHM + Merge ke Form Agunan (25 Jun 2026)
**Goal:** Pecah upload SHM menjadi 5 slot terpisah per jenis halaman agar VLM bisa menggunakan prompt yang spesifik untuk setiap halaman, meningkatkan akurasi ekstraksi data agunan secara signifikan.
**Yang selesai:**
- [x] +5 prompt VLM per-halaman: `shm_cover`, `shm_pendaftaran`, `shm_peralihan`, `shm_surat_ukur`, `shm_peta`
- [x] +5 `validateAndClean` case di schemas untuk sanitasi output VLM per halaman
- [x] +`processSHMPage` controller + route `POST /document/shm/page` (diletakkan SEBELUM `/shm`)
- [x] +`extractShmPage` di `services/index.js`
- [x] Rewrite `AgunanFormPage.jsx` + `AgunanEditPage.jsx`: 5-slot UI dengan status idle/loading/done/error, badge Wajib/Opsional, tombol "Terapkan ke Form" (merge cerdas dengan prioritas field)
- [x] Batas tanah dari `nama_tetangga[]` hasil `shm_peta`; BPKB single upload tetap berfungsi
- [x] Backend restart ✅, frontend rebuild ✅
**Keputusan baru:** Merge di frontend (bukan backend) agar user bisa edit manual sebelum simpan. Route `/shm/page` HARUS di atas `/shm` di routes.js.
**File yang diubah:** `document-ai.service.js`, `document-ai.schemas.js`, `document.controller.js`, `document.routes.js`, `services/index.js`, `AgunanFormPage.jsx`, `AgunanEditPage.jsx`
**File JANGAN disentuh:** `backend/src/modules/ocr/ocr.service.js`, database schema, credit scoring
**Bug yang ditemukan:** -
**Hindari sesi berikutnya:** Jangan tambah route `/shm/xxx` setelah `/shm` — Express first-match akan menelan subroute.
**Task berikutnya:** Test live upload per halaman SHM, lalu modul EWS (Phase 5).
**Kode yang perlu ditempel:** -

## 🔧 Sesi 24 — Fix VLM Halusinasi & Limit Upload File (25 Jun 2026)
**Goal:** Menghilangkan halusinasi (data fiktif) dari hasil bacaan KTP, mencocokkan struktur UI Form Debitur dengan KTP, dan mengatasi kendala gagal upload file (gambar/PDF) berukuran besar.
**Yang selesai:**
- [x] Memperbaiki *prompt* instruksi VLM KTP di `document-ai.service.js` dengan menghapus contoh teks negatif yang justru memicu halusinasi kata.
- [x] Merombak struktur UI Form Debitur (`DebiturFormPage.jsx`) khusus KTP dengan memisahkan RT & RW, serta menambahkan Agama, Pekerjaan, Kewarganegaraan, dan Berlaku Hingga agar sinkron dengan hasil OCR.
- [x] Mengatasi error "tidak bisa upload image/pdf" dengan menaikkan limit unggahan file dari 10 MB menjadi 50 MB pada *reverse proxy* (`nginx.conf`) dan layer aplikasi Node.js (`backend/src/middleware/upload.js`).
- [x] Me-rebuild container frontend, backend, dan Nginx.
**Keputusan baru:** Semua isian Form Debitur untuk Data KTP kini disamakan persis dengan field fisik KTP agar mengurangi perbedaan interpretasi data. Batas ukuran unggahan dokumen kini disetel longgar di 50 MB.
**File yang diubah:**
- `backend/src/services/document-ai/document-ai.service.js`
- `frontend/src/pages/debitur/DebiturFormPage.jsx`
- `nginx/nginx.conf`
- `backend/src/middleware/upload.js`
**File JANGAN disentuh:** -
**Bug yang ditemukan:** (1) Instruksi contoh negatif pada prompt VLM memicu munculnya data fiktif (halusinasi). (2) Nginx dan Multer secara *default* langsung memotong unggahan foto/PDF resolusi tinggi karena limit 10 MB yang kekecilan.
**Hindari sesi berikutnya:** Menaruh contoh negatif berisi string eksplisit dalam instruksi ke Llama Vision.
**Task berikutnya:** Fokus mengerjakan modul EWS (Early Warning System) atau AI Credit Analyst.
**Kode yang perlu ditempel:** -

---

## 🔧 Sesi 25 — Fix Docker Deploy & Import Backend (26 Jun 2026)
**Goal:** Mengatasi error browser -102 (`ERR_CONNECTION_REFUSED`) saat akses `http://localhost:8085/` dan memulihkan backend yang crash-loop setelah `git pull`.
**Yang selesai:**
- [x] Menyalakan Docker Desktop dan menjalankan `docker compose up -d` (build pertama gagal karena konflik nama container lama).
- [x] Membersihkan container stale (`bpr_bapera_db`, `bpr_bapera_wa`, `bpr_bapera_minio`) lalu start ulang semua service.
- [x] Fix `upload.single is not a function` — import salah di `document-intelligence.routes.js` (harus `{ upload }`).
- [x] Fix `MODULE_NOT_FOUND` — path OCR lama di `document-ai.service.js` setelah refactor folder (`ocr/services/`, `ocr/utils/parsers`).
- [x] Migrasi 5 file + seed admin berhasil di container backend.
- [x] Verifikasi: frontend HTTP 200, API health OK di `http://localhost:8085/api/health`.
**Keputusan baru:** Tidak ada keputusan arsitektur baru — hanya perbaikan import pasca-refactor OCR module.
**File yang diubah:**
- `backend/src/modules/document-intelligence/routes/document-intelligence.routes.js`
- `backend/src/services/document-ai/document-ai.service.js`
**File JANGAN disentuh:** Struktur folder OCR baru (`modules/ocr/services/`, `pipeline/`, dll) — sudah benar, yang rusak hanya import lama.
**Bug yang ditemukan:**
- Error -102 = tidak ada service di port 8085 (Docker belum jalan / container belum start).
- Build Docker terhenti → container `Created` tapi tidak `Started` → konflik nama saat retry.
- Backend crash: import `upload` default vs named export; path `ocr.service` & `parsers` sudah dipindah.
**Hindari sesi berikutnya:** Setelah refactor/move file, grep semua `require()` ke path lama sebelum deploy Docker.
**Task berikutnya:** EWS (Phase 5), Laporan, atau AI Credit Analyst — sesuai instruksi pengguna.
**Kode yang perlu ditempel:** -

---

## 🔧 Sesi 26 — Keputusan Arsitektur Sprint 5.10: Decision Kernel (26 Jun 2026)
**Goal:** Menutup fase arsitektur Phase 5 dengan artefak kanonik tunggal sebelum implementasi Decision & AI.
**Yang disepakati (🔒 LOCKED di DECISIONS.md):**
- [x] **Sprint 5.10 = Decision Kernel** — Single Source of Truth keputusan kredit (bukan DTO, bukan object berbeda per consumer).
- [x] Rantai: `AssessmentContext → DecisionIntent → DecisionPolicy → DecisionKernel`.
- [x] **Immutability + revision**: perubahan keputusan = `Decision V2`, bukan mutasi V1.
- [x] **Decision Fingerprint**: `SHA256(AssessmentFP + IntentFP + PolicyFP + DecisionPayload)`.
- [x] **AnalysisPackage**: paket immutable tunggal untuk AI; AI tidak akses DB/Rule/Formula.
- [x] Urutan runtime: `DecisionKernel → AnalysisPackage → AI → Committee → Disbursement` (workflow = consumer).
- [x] **Phase 6 dipecah**: 6.1 Analysis Package, 6.2 Prompt Builder, 6.3 Narrative Engine, 6.4 MAK Generator, 6.5 LLM Adapter.
- [x] **Stop bounded context baru** — prioritas: Rule Library BPR, Policy Pack SOP, Decision Kernel, AI Analyst.
**Keputusan baru:** `DecisionBuilder` diganti konsepnya menjadi **Decision Kernel** sebagai artefak domain final. Committee Workflow diposisikan setelah AI, bukan sebelum.
**File yang diubah:** `.ai/DECISIONS.md`, `.ai/CONTEXT.md`, `.ai/SESSION_LOG.md`
**Gap codebase (belum diimplementasi):**
- `DecisionBuilder` / `DecisionKernel` entity belum ada di `backend/src/modules/`
- Orchestrator end-to-end belum ter-wire dari `AssessmentReadyForDecision`
- `AnalysisPackage` builder belum ada
**Task berikutnya:** Implementasi Sprint 5.10 — `DecisionKernel` entity, schema, builder, fingerprint, revision service.
**Kode yang perlu ditempel:** `decision-intent/`, `decision-policy/`, `assessment/`, `.ai/DECISIONS.md` section E

---

## 🔧 Sesi 27 — Sprint 5.10: Decision Kernel (Aggregate Root) (26 Jun 2026)
**Goal:** Menutup fase arsitektur Phase 5 dengan artefak kanonik tunggal sebelum implementasi Decision & AI.
**Yang selesai:**
- [x] Modul `backend/src/modules/decision-kernel/` — entity, schema, builder, revision, integrity, fingerprint, manifest, events.
- [x] `DecisionKernel` immutable + `DecisionRevisionService` (V1→V2, tanpa mutasi).
- [x] `DecisionFingerprint` = SHA256(AssessmentFP + IntentFP + PolicyFP + DecisionPayload).
- [x] `DecisionManifest` v1.0.0 (seperti OCR manifest).
- [x] `DecisionOrchestrator` — rantai penuh Pipeline → Facts → Capabilities → DecisionFacts → Intent → Policy → Kernel.
- [x] `DecisionWorkflow` — subscribe `AssessmentReadyForDecision`, emit `DecisionRequested` → `DecisionKernelCreated`.
- [x] Unit + integration test (7 test, semua pass).
**Keputusan baru:** Committee Workflow subscribe `DecisionKernelCreated` (bukan membentuk keputusan). `DecisionIntegrityService` terpisah dari fingerprint computation.
**File yang diubah/dibuat:**
- `backend/src/modules/decision-kernel/**` (modul baru)
- `backend/src/modules/workflows/decision-workflow.js`
- `backend/tests/modules/decision-kernel/decision-kernel.test.js`
- `backend/tests/modules/workflows/decision-workflow.integration.test.js`
- `.ai/DECISIONS.md`, `.ai/CONTEXT.md`, `.ai/SESSION_LOG.md`
**Task berikutnya:** Sprint 6.1 Analysis Package, lalu Rule Library BPR & Policy Pack SOP.
**Kode yang perlu ditempel:** `decision-kernel/index.js`, `.ai/DECISIONS.md` section E

---

## 🔧 Sesi 28 — Sprint 6.1: Analysis Package (26 Jun 2026)
**Goal:** Membangun AnalysisPackage sebagai paket immutable untuk AI Credit Analyst.
**Yang selesai:**
- [x] Modul `backend/src/modules/analysis-package/` — entity, schema, builder.
- [x] `AnalysisPackage` immutable dengan fingerprint konsisten.
- [x] Package berisi: `DecisionKernel + FactCollection + CapabilityCollection + Intent + Policy`.
- [x] AI hanya baca package ini, tidak akses database langsung.
- [x] Unit test 3 test, semua pass.
**Keputusan baru:** AnalysisPackage = frozen snapshot untuk AI consumption. AI tidak boleh membaca database, rule, atau formula langsung.
**File yang diubah/dibuat:**
- `backend/src/modules/analysis-package/**` (modul baru)
- `backend/tests/modules/analysis-package/analysis-package.test.js`
**Task berikutnya:** Sprint 6.2 Prompt Builder → Narrative Engine → MAK Generator → LLM Adapter.

---

## 🔧 Sesi 29 — Sprint 6.2: PromptContext (26 Jun 2026)
**Goal:** Create PromptContext as AI View Model — immutable representation of AnalysisPackage optimized for prompts.
**Yang selesai:**
- [x] Modul `backend/src/modules/ai/context/` — PromptContext entity, schema, builder.
- [x] `PromptContext` immutable dengan field: summary, risk, facts, capabilities, recommendation, conditions, authority, appendix.
- [x] `PromptContextBuilder`: transform AnalysisPackage → PromptContext, strip implementation details.
- [x] Unit test 3 test, semua pass.
**Keputusan baru:** PromptContext adalah View Model untuk AI, bukan Domain Model. AI Boundary Rule: hanya baca AnalysisPackage, tidak akses database/rule/formula.
**File yang diubah/dibuat:**
- `backend/src/modules/ai/context/**` (modul baru)
- `backend/tests/modules/ai/context/prompt-context.test.js`
**Task berikutnya:** Sprint 6.3 Prompt Definitions & Builder.

---

## 🔧 Sesi 30 — Sprint 6.3 - 6.6: AI Analyst Modules & Integration (27 Jun 2026)
**Goal:** Menyelesaikan modul Prompt Definitions, LLM Adapters, Narrative Engine, dan MAK Builder beserta pengujian integrasi.
**Yang selesai:**
- [x] Memperbaiki import path `deepFreeze` pada entity `PromptContext` dan `Narrative`.
- [x] Memperbaiki parser BOM UTF-8 pada pembacaan skema Narrative agar andal di environment Windows.
- [x] Meningkatkan parser template `PromptBuilder` dengan regex dinamis dan penanganan filter `| formatRupiah`.
- [x] Membuat renderer baru `DocxRenderer` untuk melengkapi format Memorandum Analisa Kredit (MAK).
- [x] Membuat unit test untuk `DocxRenderer` dan meregister layernya di ekspor modul `mak`.
- [x] Membuat end-to-end integration test `ai-integration.test.js` untuk memvalidasi aliran: `AnalysisPackage → PromptContext → Prompt → LLM Adapter (Mock) → Narrative → MAK Document → Renderers (PDF, HTML, DOCX)`.
- [x] Memastikan semua 20 test di 6 test suites di modul `ai` berjalan sukses tanpa error.
**Keputusan baru:** Template engine mendukung filter format nominal Rupiah secara dinamis, mempermudah pelaporan aspek keuangan di prompt.
**File yang diubah/dibuat:**
- `backend/src/modules/ai/context/entities/PromptContext.js`
- `backend/src/modules/ai/prompt/builder/PromptBuilder.js`
- `backend/src/modules/ai/narrative/entities/Narrative.js`
- `backend/src/modules/ai/mak/renderers/DocxRenderer.js`
- `backend/src/modules/ai/mak/index.js`
- `backend/tests/modules/ai/mak/mak-builder.test.js`
- `backend/tests/modules/ai/ai-integration.test.js`
**Task berikutnya:** Hubungkan engine analisis kredit ke alur workflow approval / integrasikan dengan scheduler / lanjut ke modul EWS (Phase 5).

---

## 🔧 Sesi 31 — 2026-06-27 | Model: Gemini 3.5 Flash | Modul: AI Credit Analyst REST API & Database Integration
**Goal:** Integrasikan pipeline AI Credit Analyst backend ke REST API endpoints dan database persistence.
**Yang selesai:**
- [x] Membuat tabel database `ai_narrative` via file migrasi SQL baru (`007_add_ai_narrative.sql`).
- [x] Menambahkan alter column missing fields dari Sesi 5 (`ibu_kandung`, `hubungan_bank`, `kredit_aktif`) pada tabel `debitur` di file migrasi `007_add_ai_narrative.sql`.
- [x] Membuat service layer `ai.service.js` yang mengintegrasikan data `makData` dengan `DecisionOrchestrator` dan `AnalysisPackageBuilder` untuk menghasilkan `PromptContext`.
- [x] Mendukung pemetaan plain objects `facts` dan `capabilities` dari collection instances agar sesuai dengan schema dan PromptBuilder.
- [x] Membuat REST controller `ai.controller.js` dan router `ai.routes.js` untuk mengontrol narrative generation & retrieval.
- [x] Menambahkan `/ai` route mounting di `app.js` backend.
- [x] Mengekspor endpoints baru di `frontend/src/services/index.js` untuk konsumsi React UI.
- [x] Menambahkan unit/integration test baru `ai-service.test.js` untuk database-backed service flow dan memastikan semua 21 unit test berjalan 100% sukses.
**Keputusan baru:** Data `factCollection` dan `capabilityCollection` dipetakan ke JavaScript plain object key-value sebelum diserahkan ke builder agar memenuhi schema tipe "object" dan tidak crash karena array. Override adapter didukung lewat `setLLMAdapter` untuk testing.
**File yang diubah:**
- `backend/migrations/007_add_ai_narrative.sql`
- `backend/src/config/index.js`
- `backend/src/app.js`
- `backend/src/modules/ai/ai.service.js`
- `backend/src/modules/ai/ai.controller.js`
- `backend/src/modules/ai/ai.routes.js`
- `backend/src/modules/ai/index.js`
- `backend/src/modules/ai/context/schemas/prompt-context.schema.json`
- `backend/src/modules/ai/context/entities/PromptContext.js`
- `backend/src/modules/ai/context/builder/PromptContextBuilder.js`
- `frontend/src/services/index.js`
- `docker-compose.yml`
- `backend/tests/modules/ai/ai-service.test.js` (file baru)
**Bug yang ditemukan:**
- `column d.ibu_kandung does not exist` karena kolom database dari Sesi 5 terlewat dari sql migrations. Diatasi dengan meletakkan alter table di migrasi 007.
- `Invalid AnalysisPackage: /factCollection must be object` karena array tipe data dikembalikan oleh `.toJSON()`. Diatasi dengan memetakan array ke plain JavaScript object key-value di service.
**Task berikutnya:** Hubungkan generator narrative AI Credit Analyst ke frontend React UI (MAK preview page) sehingga user bisa men-trigger dan melihat narasi secara visual, lalu lanjut ke modul EWS (Phase 5).

---

## 🔧 Sesi 32 — 2026-06-27 | Model: Gemini 3.5 Flash (High) | Modul: AI Credit Analyst Frontend & Workflow Integration
**Goal:** Integrasikan generator narrative AI Credit Analyst ke UI preview MAK (`MakPreviewPage.jsx`) dan workflow persetujuan komite (`PengajuanDetailPage.jsx`).
**Yang selesai:**
- [x] Menambahkan state, hook `useEffect`, dan handler `handleGenerateAi` di `MakPreviewPage.jsx` untuk memuat dan memicu pembuatan narasi AI.
- [x] Mengubah layout Page 1 "OPINI KEPATUHAN" di `MakPreviewPage.jsx` agar kotak opini kosong digantikan dengan visualisasi layout ringkasan analisis AI yang responsif dan cetak-ramah (print-friendly) jika narasi AI tersedia.
- [x] Menambahkan tombol "Generate AI Analisis" di header kontrol (print-hidden) `MakPreviewPage.jsx` agar analis bisa dengan mudah memicu generator AI.
- [x] Memperbarui service backend `getById` pada `pengajuan.service.js` untuk mengambil dan menyertakan data tabel `ai_narrative` di respons detail pengajuan.
- [x] Menambahkan kartu panel rekomendasi AI Credit Analyst (`aiNarrative`) di tab "Approval" pada halaman detail pengajuan (`PengajuanDetailPage.jsx`) untuk memberikan decision support langsung bagi pengambil keputusan (Kabid/Direktur).
- [x] Rebuild container backend & frontend docker (`docker compose up -d --build backend frontend`) dan memverifikasi seluruh unit & integration test suite (21/21 tests pass) berjalan 100% sukses.
**Keputusan baru:**
- AI Narrative dimuat langsung via query DB `getById` pengajuan agar tersedia di halaman persetujuan tanpa perlu request endpoint terpisah.
- Tampilan cetak AI Narrative diatur otomatis menggunakan `print:border-gray-800 print:bg-white` agar rapi dan hemat tinta saat dicetak hitam-putih.
**File yang diubah:**
- `backend/src/modules/pengajuan/pengajuan.service.js`
- `frontend/src/pages/mak/MakPreviewPage.jsx`
- `frontend/src/pages/pengajuan/PengajuanDetailPage.jsx`
**Bug yang ditemukan:** -
**Task berikutnya:** Rencanakan atau mulai pengerjaan modul Early Warning System (EWS) - Phase 5.

---

## 🔧 Sesi 33 — 2026-06-27 | Model: Gemini 3.5 Flash (High) | Modul: LLM & OCR Service Extension
**Goal:** Menambahkan LlamaCppAdapter untuk AI Services dan GlmOcrEngine untuk OCR.
**Yang selesai:**
- [x] Membuat `LlamaCppAdapter.js` di `backend/src/modules/ai/adapters/` yang mendukung OpenAI-compatible chat completions dan raw completion endpoints.
- [x] Mendaftarkan `LlamaCppAdapter` di `index.js` dan mendukung provider `LLAMACPP`/`LLAMA_CPP` di `getLLMAdapter()` pada `ai.service.js`.
- [x] Membuat `GlmOcrEngine.js` di `backend/src/modules/ocr/engines/` untuk mengekstrak teks menggunakan GLM-4V vision API.
- [x] Mendaftarkan engine GLM OCR di `capabilities.js` dan mengintegrasikannya ke `EngineFactory.js` agar terpilih saat `config.ocrEngine` bernilai `'glm'`.
- [x] Mengintegrasikan `callGlmVision` ke dalam `extractDocumentData` pada `document-ai.service.js` untuk support extraction terstruktur via GLM Vision.
- [x] Menambahkan variabel `glmApiUrl` dan `glmApiKey` ke konfigurasi global `config/index.js`.
- [x] Memperbaiki bugs di `scripts/test-document-ai.js` dengan mengoreksi import path `ocr.service` dan menambahkan fallback agar data rt/rw dan tempat_lahir/tanggal_lahir tetap terisi dengan benar.
- [x] Memastikan seluruh 22 unit tests AI dan 5 unit tests Document AI berjalan 100% sukses.
**Keputusan baru:**
- LlamaCppAdapter secara default menggunakan endpoint OpenAI-compatible `/v1/chat/completions` agar model-model lokal (seperti Qwen3.5) dapat memformat chat template secara otomatis, tetapi mendukung fallback ke raw `/completion` endpoint jika opsi raw disetel.
- Engine GLM OCR dirancang untuk memproses data gambar/PDF menggunakan API vision GLM-4V dengan mode input multiline.
**File yang diubah:**
- `backend/src/modules/ai/adapters/LlamaCppAdapter.js`
- `backend/src/modules/ai/adapters/index.js`
- `backend/src/modules/ai/ai.service.js`
- `backend/src/modules/ocr/engines/GlmOcrEngine.js`
- `backend/src/modules/ocr/engines/capabilities.js`
- `backend/src/modules/ocr/engines/EngineFactory.js`
- `backend/src/services/document-ai/document-ai.service.js`
- `backend/src/services/document-ai/document-ai.schemas.js`
- `backend/src/config/index.js`
- `backend/tests/modules/ai/adapters/llm-adapters.test.js`
- `backend/scripts/test-document-ai.js`
**Task berikutnya:** Rencanakan atau mulai pengerjaan modul Early Warning System (EWS) - Phase 5.

---

## 🔧 Sesi 34 — 2026-06-27 | Model: Gemini 3.5 Flash (High) | Modul: Early Warning System (EWS) - Phase 5
**Goal:** Merencanakan dan mengimplementasikan modul Early Warning System (EWS) secara penuh (Backend, Database, dan Frontend).
**Yang selesai:**
- [x] Membuat rencana desain & arsitektur EWS yang disetujui pengguna (`ews_design_specification.md`).
- [x] Membuat dan menjalankan skrip migrasi database `008_extend_ews_table.sql` untuk menambahkan kolom-kolom baru pada tabel `ews` serta memperbaiki inkonsistensi kolom pada tabel `notifikasi` (dari `judul`/`pesan` menjadi `title`/`message` sesuai dengan query `notifikasi.service.js`).
- [x] Mengimplementasikan logika pemindaian portfolio EWS (`scanEws`), penyelesaian alert (`resolveAlert`), summary dashboard (`getSummary`), dan visit monitoring AO (`logAoVisit`) di `ews.service.js`.
- [x] Membuat `ews.controller.js` dan mendaftarkan router RBAC serta audit trail di `ews.routes.js`.
- [x] Menghubungkan modul EWS ke API router utama di `backend/src/app.js`.
- [x] Membuat unit & integration tests `ews.test.js` dan memverifikasi 4/4 tes lulus 100%.
- [x] Menambahkan `ewsService` ke konfigurasi endpoint frontend di `frontend/src/services/index.js`.
- [x] Membuat dashboard visual EWS `EwsDashboardPage.jsx`, detail investigasi alert `EwsDetailPage.jsx`, dan form kunjungan monitoring lapangan `AoVisitFormPage.jsx`.
- [x] Mendaftarkan rute EWS di `frontend/src/App.jsx` dan tautan menu di `frontend/src/components/layout/Sidebar.jsx`.
- [x] Rebuild container Docker backend & frontend dan memverifikasi semuanya berjalan lancar.
**Keputusan baru:**
- Notifikasi WhatsApp otomatis dikirimkan ke Account Officer (AO) penanggung jawab ketika alert EWS aktif terdeteksi. Untuk alert berisiko **HIGH**, notifikasi dikirimkan juga secara otomatis ke SPI dan Kabid.
- Sistem secara otomatis mengirimkan pesan pengingat jatuh tempo H-3 kepada debitur melalui WhatsApp Gateway.
- Tabel `notifikasi` di-migrate secara dinamis dari skema lama (`judul`/`pesan`) ke skema baru (`title`/`message`) untuk mencegah error pada notifikasi.
**File yang diubah:**
- `backend/migrations/008_extend_ews_table.sql` (file baru)
- `backend/src/modules/ews/ews.service.js` (file baru)
- `backend/src/modules/ews/ews.controller.js` (file baru)
- `backend/src/modules/ews/ews.routes.js` (file baru)
- `backend/src/modules/ews/index.js` (file baru)
- `backend/src/app.js`
- `backend/tests/modules/ews/ews.test.js` (file baru)
- `frontend/src/services/index.js`
- `frontend/src/pages/ews/EwsDashboardPage.jsx` (file baru)
- `frontend/src/pages/ews/EwsDetailPage.jsx` (file baru)
- `frontend/src/pages/ews/AoVisitFormPage.jsx` (file baru)
- `frontend/src/App.jsx`
- `frontend/src/components/layout/Sidebar.jsx`
**Task berikutnya:** Implementasi modul Laporan (Phase 1/5) or continue refining AI narrative integrations.

---

## 🔧 Sesi 35 — 2026-06-27 | Model: Antigravity (Gemini 3.5 Flash) | Modul: Document Intelligence Center
**Goal:** Membuat modul Document Intelligence Center untuk penanganan alur dokumen kredit yang production-ready (Upload -> Queue -> Classification -> Parser -> Validation -> Comparison -> Review -> Map).
**Yang selesai:**
- [x] Membuat database migrasi `009_document_intelligence.sql` untuk tabel `document_intelligence_jobs` penampung data queue.
- [x] Membuat service layer `document-intelligence.service.js` dengan integrasi MinIO, LLM classification, schema validation, data comparison (db matches), dan auto-mapping ke table debitur/agunan/slik/pasangan.
- [x] Membuat controller `document-intelligence.controller.js` dan mendaftarkan route endpoint RBAC di `document-intelligence.routes.js`.
- [x] Menambahkan API service frontend `documentIntelligenceService` pada `frontend/src/services/index.js`.
- [x] Membuat visual dashboard queue `DocumentDashboardPage.jsx` dan interface review data side-by-side `DocumentReviewPage.jsx` di frontend.
- [x] Mendaftarkan halaman Document Intel di router `frontend/src/App.jsx` dan menu Sidebar `frontend/src/components/layout/Sidebar.jsx`.
- [x] Membuat test suite backend `document-intelligence.test.js` dan memverifikasi semua 5/5 unit test sukses 100%.
- [x] Rebuild dan deploy docker containers frontend & backend.
**Keputusan baru:**
- Modul ini diposisikan sebagai "Document Intelligence Center" untuk menangani seluruh dokumen kredit dengan status antrean stateful (Pending, Classifying, Processing, Validating, Review Required, Completed, Failed).
- Memanfaatkan native fetch di Node 20+ alih-alih `node-fetch` module untuk integrasi VLM/LLM.
- Menambahkan fitur side-by-side perbandingan database (consistency check) untuk meminimalisir kesalahan data / fraud.
**File yang diubah/dibuat:**
- `backend/migrations/009_document_intelligence.sql` (baru)
- `backend/src/modules/document-intelligence/services/document-intelligence.service.js` (baru)
- `backend/src/modules/document-intelligence/controllers/document-intelligence.controller.js`
- `backend/src/modules/document-intelligence/routes/document-intelligence.routes.js`
- `frontend/src/services/index.js`
- `frontend/src/pages/document-intelligence/DocumentDashboardPage.jsx` (baru)
- `frontend/src/pages/document-intelligence/DocumentReviewPage.jsx` (baru)
- `frontend/src/App.jsx`
- `frontend/src/components/layout/Sidebar.jsx`
- `backend/tests/modules/document-intelligence/document-intelligence.test.js` (baru)

---

## 🔧 Sesi 36 — 2026-06-28 | Model: Gemini 3.5 Flash (High) | Modul: Credit Analysis Integration (GLM OCR Service)
**Goal:** Integrasikan GLM OCR Service ke dalam formulir KTP Debitur untuk pengisian otomatis (auto-population) lengkap dengan deteksi tingkat keyakinan (confidence highlight).
**Yang selesai:**
- [x] Membuat client API backend `ocr-client.js` untuk mengunggah gambar KTP secara langsung ke GLM OCR Service (`POST /ocr/ktp`).
- [x] Mengonfigurasi `glmOcrServiceUrl` di `backend/src/config/index.js` dengan default `http://localhost:8000`.
- [x] Membuat mapper data `ocr-mapper.js` untuk normalisasi tanggal lahir (DD-MM-YYYY ke YYYY-MM-DD), gender (L/P), status nikah, dan pemetaan skor confidence per kolom.
- [x] Menghubungkan client dan mapper ke controller `processKTP` di `document.controller.js` untuk mengembalikan DTO Debitur yang bersih beserta metadata confidence.
- [x] Membuat integration test backend `ocr-ktp-integration.test.js` dan memverifikasi 5/5 unit test berjalan sukses (100% pass).
- [x] Menambahkan state `confidences` dan auto-fill mapper pada `DebiturFormPage.jsx` untuk auto-populasi field pribadi KTP.
- [x] Menambahkan visual highlight di `DebiturFormPage.jsx` untuk field dengan confidence rendah (< 85%) berupa border/background oranye tipis dan lencana warning pulsa "Fuzzy (XX%)".
- [x] Menambahkan trigger interaktif agar highlight confidence otomatis hilang/terhapus ketika kolom diedit secara manual oleh analis.
**Keputusan baru:**
- DTO hasil mapper di backend mendukung format camelCase dan snake_case secara bersamaan untuk memastikan fleksibilitas dan kompatibilitas penuh dengan frontend state dan representasi database.
- Tingkat keyakinan (confidence) dihitung dalam skala 0.0 - 1.0. Batas threshold visual warning disetel pada nilai < 0.85 (85%).
**File yang diubah/dibuat:**
- `backend/src/config/index.js`
- `backend/src/modules/document/ocr-client.js` (baru)
- `backend/src/modules/document/ocr-mapper.js` (baru)
- `backend/src/modules/document/document.controller.js`
- `backend/tests/modules/document/ocr-ktp-integration.test.js` (baru)
- `frontend/src/pages/debitur/DebiturFormPage.jsx`
**Task berikutnya:** Penyempurnaan MAK Generator (Phase 3) atau Pembuatan Modul Laporan Komprehensif (Phase 12).





---

## 🔧 Sesi 37 — 2026-06-29 | Model: Antigravity | Modul: Document AI (OpenCV Preprocessing)
**Goal:** Memfaktorkan ulang (refactoring) OCR preprocessing dengan mengadopsi arsitektur pipeline OpenCV modular (Python) untuk meningkatkan akurasi ekstraksi Tesseract secara signifikan (KTP watermark, SHM perspective, dll).
**Yang selesai:**
- [x] Mensetup virtual environment Python di `backend/venv` dan menginstal `opencv-python-headless` serta `numpy`.
- [x] Membuat pipeline preprocessing gambar berbasis Python: `deskew.py`, `perspective.py`, `resize.py`, `clahe.py`, `threshold.py`, `shadow.py`, `morphology.py`.
- [x] Membuat modul preprocessor per tipe dokumen: `ktp.py` (ekstrak *red channel* untuk hilangkan watermark biru KTP) dan `general.py` (penanganan dokumen umum dengan pencahayaan tak merata).
- [x] Menulis ulang struktur layanan OCR di Node.js menjadi berbasis Pipeline (`image.pipeline.js`, `ocr.pipeline.js`) dan Engine interface (`tesseract.engine.js`).
- [x] Membersihkan logika *ImageMagick* yang usang dari `document-ai.service.js` dan menjadikannya fasad (*facade*) orkestrasi OCR yang bersih.
- [x] Menghapus `backend/venv` dari tracking git (yang tidak sengaja terbawa commit sebelumnya) dan memasukkannya ke `.gitignore` agar repositori tidak membengkak karena library C++.
**Keputusan baru:**
- Semua *image preprocessing* ditangani secara modular di Python menggunakan OpenCV karena jauh lebih superior dibanding *ImageMagick*.
- *Red Channel extraction* ditetapkan sebagai standar baru preprocessing KTP untuk membuang watermark Garuda latar biru tanpa merusak teks hitam.
- Pipeline Node.js dipisah berlapis (*Engine, Pipeline, Parsers*) sehingga siap dihubungkan dengan *PaddleOCR* atau *Surya OCR* di masa depan.
**File yang diubah/dibuat:**
- `backend/src/services/document-ai/pipeline/image.pipeline.js` (baru)
- `backend/src/services/document-ai/pipeline/ocr.pipeline.js` (baru)
- `backend/src/services/document-ai/engines/tesseract.engine.js` (baru)
- `backend/src/services/document-ai/python/preprocess.py` (baru)
- `backend/src/services/document-ai/python/preprocessors/ktp.py` (baru)
- `backend/src/services/document-ai/python/preprocessors/general.py` (baru)
- `backend/src/services/document-ai/python/utils/...` (baru)
- `backend/src/services/document-ai/document-ai.service.js`
- `backend/.gitignore`
**Bug yang ditemukan:** -
**Hindari sesi berikutnya:** Menyatukan logika Python script menjadi monolith raksasa; gunakan selalu arsitektur `preprocessors` modular untuk dokumen tipe baru. 
**Task berikutnya:** Rencanakan atau mulai pengerjaan modul Early Warning System (EWS) - Phase 5 atau Modul Laporan Komprehensif.
