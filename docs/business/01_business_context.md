# 01_business_context.md

# Konteks Bisnis Sistem Analisa Kredit

## Latar Belakang
PT BPR BAPERA BATANG adalah Bank Perkreditan Rakyat yang beroperasi di wilayah [wilayah operasi]. Sebagai lembaga keuangan yang berfokus pada pemberian kredit kepada UMKM dan konsumtif, BPR BAPERA BATANG menghadapi tantangan dalam proses analisa kredit yang masih konvensional dan memakan waktu.

## Tantangan Bisnis Saat Ini
1. **Proses yang Lama**: Dari pengajuan hingga pencairan rata-rata memakan waktu [X] hari kerja
2. **Konsistensi Keputusan**: Variasi dalam penilaian kredit antar analis karena faktor subjektif
3. **Beban Administrasi**: Besarnya waktu yang dihabiskan untuk dokumentasi dan administrasi
4. **Keterbatasan Analisis**: Keterbatasan dalam menganalisis data kompleks seperti pola arus kas atau tren industri
5. **Risiko Kredit**: Tingkat NPL yang masih di atas target internasional
6. **Keterbatasan Sumber Daya**: Terbatasnya jumlah analis senior yang berpengalaman

## Tujuan Bisnis Sistem
Sistem Analisa Kredit dirancang untuk mengatasi tantangan di atas dengan tujuan:

1. **Mempercepat Proses Analisa Kredit**
   - Target: Mengurangi waktu proses dari [X] hari menjadi [Y] hari (reduksi [Z]%)
   - Otomatisasi tugas-tugas rutin dan ripetitif
   - Alur kerja yang lebih terstruktur dan terintegrasi

2. **Meningkatkan Konsistensi dan Kualitas Keputusan**
   - Penerapan rule engine yang terstandarisasi sebagai sumber keputusan
   - Pengurangan variasi subjektif dalam penilaian
   - Penerapan kebijakan kredit yang konsisten seluruh cabang dan tim

3. **Mengurangi Beban Administrasi**
   - Otomatisasi pembuatan dokumen seperti Memorandum Analisa Kredit (MAK)
   - Pengelolaan dokumen yang terintegrasi dengan sistem penyimpanan
   - Pengurangan duplikasi data dan upaya masuk data berulang

4. **Menyediakan Analisis yang Lebih Mendalam**
   - Analisis arus kas yang lebih sophisticated
   - Analisis tren industri dan pasar
   - Analisis sensitif terhadap perubahan kondisi ekonomi
   - Analisis scenario dan what-if

5. **Mengurangi Risiko Kredit**
   - Deteksi dini potensi masalah melalui early warning system
   - Penerapan model scoring yang lebih akurat
   - Monitoring aktif setelah pencairan
   - Analisis kekuatan agunan yang lebih komprehensif

6. **Meningkatkan Produktivitas Sumber Daya Manusia**
   - Memperbolehkan analis fokus pada aspek yang membutuhkan penilaian profesional
   - Pengurangan beban administratif
   - Akses lebih mudah ke informasi dan analisis yang relevan
   - Dukungan besluit yang lebih baik melalui decision support system

## Cakupan Fungsional
Sistem akan mendukung seluruh siklus kredit mulai dari pencarian nasabah baru hingga pemulihan piutang, dengan fokus khusus pada:

### 1. Pra-pengajuan
- Identifikasi dan pencarian nasabah potensial
- Pra-pengisian formulir aplikasi
- Pra-verifikasi kelengkapan dokumen

### 2. Pengajuan dan Administrasi
- Pendaftaran nasabah baru dan pembaruan data nasabah existentes
- Pembuatan dan pengajuan formulir permohonan kredit
- Pengunggah dan verifikasi dokumen pendukung
- Validasi kelengkapan administrasi

### 3. Survey dan Verifikasi
- Pengelolaan jadwal survey terenak
- Pengumpulan data survey lapangan (usaha, domicile, lingkungan)
- Verifikasi data melalui telesurvey atau verifikasi telepon
- Integrasi dengan hasil survey ke dalam analisis kredit

### 4. Analisis Kredit
- Ekstraksi data dari dokumen melalui OCR dan document intelligence
- Analisis data keuangan (laba rugi, neraca, arus kas)
- Analisis kelayakan usaha dan prospects
- Analisis jaminan dan nilai agunan
- Analisis risiko dan mitigasi
- Analisis 5C (Character, Capacity, Capital, Collateral, Condition)
- Analisis SWOT
- Perhitungan scoring kredit menggunakan model 5C dan lainnya

### 5. Pengambilan Keputusan
- Penerapan rule engine untuk otomatisasi penerapan aturan kredit
- Penerapan policy engine untuk penerapan kebijakan produk
- Rekomendasi dari AI Credit Analyst (pendapat, bukan keputusan)
- Proses approval workflow berbasis ruolo dan tingkat otoritas
- Keputusan komite kredit untuk limit di atas authority level tertentu

### 6. Dokumentasi dan Administrasi
- Pembuatan otomatis Memorandum Analisa Kredit (MAK)
- Pembuatan surat keputusan dan dokumen pendukung lainnya
- Pengarsipan elektronik dokumen dengan integrasi ke sistem manajemen dokumen
- Pencetakan dan distribusi dokumen yang diperlukan

### 7. Pencairan dan Adminisrasi Pasca-pencairan
- Persiapan dan validasi sebelum pencairan
- Koordinasi dengan sistem inti perbankan untuk pencairan dana
- Konfirmasi penerimaan dana oleh nasabah
- Administrasi pasca-pencairan (pembuatan jadwal angsuran, pencatatan terutang, etc.)

### 8. Monitoring dan Pemantauan
- Monitoring harian, mingguan, dan bulanan kredit yang aktif
- Early warning system untuk terdeteksi dini masalah
- Penjelajahan dan tindak lanjut sesuai dengan tingkat risiko
- Restrukturisasi dan penyelesaian jika diperlukan
- Pelaporan kinerja portofolio

## Struktur Organisasi dan Peran dalam Sistem

### 1. Account Officer (AO)
**Peran dalam sistem:**
- Input data nasabah dan permohonan kredit
- Upload dan verifikasi dokumen pendukung
- Koordinasi survey lapangan
- Monitoring nasabah setelah pencairan
- Identifikasi potensi nasabah baru

**Akses dalam sistem:**
- Modul pengajuan kredit (create, read, update own data)
- Modul survey (input hasil survey)
- Modul dokumen (upload, view own uploaded documents)
- Modul monitoring (view nasabah yang ditangani)
- Modul nasabah (create, read, update own nasabah data)
- Tidak memiliki akses untuk approve/reject atau melihat keputusan final

### 2. Analis Kredit
**Peran dalam sistem:**
- Melakukan analisis kredit mendalam
- Menginterpretasikan hasil OCR dan document analysis
- Menerapkan analisis finansial dan non-finansial
- Menyusun rekomendasi awal
- Membuat draft Memorandum Analisa Kredit (MAK)

**Akses dalam sistem:**
- Full access ke modul analisis kredit
- Full access ke modul dokumentasi dan MAK generation
- View access ke data nasabah dan pengajuan
- View access ke hasil survey dan OCR
- Input ke dalam sistem untuk analisis dan rekomendasi
- Tidak memiliki akses untuk approve/reject keputusan final
- Akses kepada rekomendasi AI sebagai input, bukan sebagai keputusan akhir

### 3. Kepala Bagian Kredit (KABID) / Kepala Cabang
**Peran dalam sistem:**
- Review dan approval untuk aplikasi dalam batas wewenang
- Review kerja analis dan memberikan feedback
- Monitoring kinerja tim analis
- Penanganan escalasi dari analis

**Akses dalam sistem:**
- Approve/reject dalam batas wewenang yang ditetapkan
- View semua data yang diakses oleh analis
- Input komentar dan rekomendasi pada aplikasi
- Monitoring dan rekapitulasi kinerja tim
- Akses ke laporan tingkat cabang atau unit kerja

### 4. Komite Kredit
**Peran dalam sistem:**
- Keputusan akhir untuk aplikasi yang melebihi batas wewenang KABID
- Review kebijakan dan strategi kredit
- Evaluasi performa portofolio kredit
- Pengambilan keputusan tentang restructure atau penyelesaian

**Akses dalam sistem:**
- Approve/reject aplikasi yang melebihi batas wewenang operational
- Access to lengkap application package untuk review
- Voting dan pencatatan keputusan
- Akses ke laporan portofolio dan analisis risiko
- Tools untuk simulasi dan analisis portfolio

### 5. Direksi
**Peran dalam sistem:**
- Pengambilan keputusan strategis terkait kebijakan kredit
- Monitoring kesehatan keseluruhan portofolio kredit
- Approval kebijakan besar dan perubahan strategis
- Pengawasan atas penerapan prinsip perbankan yang sehat

**Akses dalam sistem:**
- View access ke semua laporan strategis dan kalkulasi risiko
- Approval kebijakan tingkat strategis dan perubahan besar
- Monitoring KPI dan indikator kinerja kunci
- Akses ke dashboard eksekutif
- Peringatan dini tentang isu-isu strategis

### 6. Sistem dan Operasional (IT/Spv Operasional)
**Peran dalam sistem:**
- Pengelolaan infrastruktur teknis
- Monitoring kinerja sistem dan ketersediaan layanan
- Pengelolaan keamanan dan backup
- Pengelolaan update dan pemeliharaan sistem
- Support teknis kepada pengguna akhir

**Akses dalam sistem:**
- Administrative access untuk konfigurasi sistem
- Monitoring akses dan penggunaan sistem
- Manajemen pengguna dan peran
- Konfigurasi integrasi dengan sistem eksternal
- Akses ke log sistem dan audit trail
- Tools untuk troubleshooting dan diagnosa

## Alur Informasi Utama

### Alur Data Nasabah
1. AO menginput data nasabah baru atau memperbarui data nasabah existing
2. Data disimpan ke dalam tabel nasabah dengan status verification
3. Sistem melakukan validasi dasar (format NIK, duplikasi, etc.)
4. Data yang telah diverifikasi dapat digunakan dalam proses pengajuan
5. Perubahan data nasabah tercatat dalam audit log
6. Data nasabah dapat diakses oleh seluruh modul yang terkait dengan persetujuan kredit

### Alur Dokumen
1. AO mengunggah dokumen pendukung melalui antarmuka sistem
2. Dokumen disimpan di MinIO dengan metadata yang sesuai
3. OCR service secara otis memproses dokumen yang baru diunggah
4. Hasil OCR disimpan ke dalam tabel terkait (slik, dokumen, finansial, dll.)
5. Document service mengelola assosiasi dokumen dengan aplikasi nasabah
6. Dokumen dapat diakses untuk verifikasi, analisis, dan tujuan audit
7. Retensi dan penghapusan dokumen mengikuti kebijakan arsip dan peraturan

### Alur Data Keuangan
1. Data keuangan diperoleh dari:
   - Input manual oleh analis (dari laporan yang diberikan nasabah)
   - Hasil OCR dari dokumen keuangan (bank statement, laporan laba rugi, dll.)
   - Integrasi dengan sistem akuntasi (jika tersedia dan diizinkan oleh nasabah)
2. Data diproses dan disimpan ke dalam tabel analisa_konsumtif atau analisa_produktif
3. Sistem menghitung rasio keuangan yang relevan (DSR, RPC, GPM, NPM, DSCR, dll.)
4. Hasil analisis digunakan dalam proses scoring dan keputusan kredit
5. Data keuangan terkait dengan aplikasi tertentu dan dapat diakses untuk review

### Alur Keputusan Kredit
1. Aplikasi masuk ke sistem melalui AO
2. Data lengkap terkumpul (nasabah, dokumen, survey, finansial, dll.)
3. Sistem melakukan analisis awal (format dan kelengkapan data)
4. Data dikirim ke financial service untuk analisis keuangan
5. Data dikirim ke document service untuk analisis dokumen
6. Hasil analisis dikumpulkan dan disiapkan untuk decision making
7. Rule engine memproses aplikasi berdasarkan aturan yang aktif
8. Policy engine menerapkan kebijakan produk yang relevan
9. AI Credit Analyst memberikan rekomendasi dan analisis mendalam
10. Hasil decision making masuk ke workflow approval sesuai dengan wewenang
11. Jika melebihi batas wewenang, dialihkan ke komite kredit untuk keputusan akhir
12. Keputusan akhir dicatat dan nasabah serta pihak terkait diberitahu
13. Jika disetujui, proses melanjutkan ke tahapan pencairan
14. Semua langkah dalam proses keputusan tercatat secara detail dalam audit trail

### Alur Pascakecunan
1. Setelah pencairan, aplikasi berstatus "active"
2. Sistem memulai monitoring rutin sesuai dengan jadwal yang ditetapkan
3. Data monitoring (pembayaran, transaksi, informasi luar) dikumpulkan secara berkala
4. Early warning system menganalisis data untuk mendeteksi indikator masalah dini
5. Jika terdeteksi masalah, sistem memberikan peringatan kepada pihak yang relevan
6. Follow-up dilakukan sesuai dengan prosedur yang telah ditetapkan
7. Dalam kasus kerugian, proses penyelesaian dilakukan sesuai dengan prosedur
8. Seluruh aktivitas monitoring dan tindak lanjut dicatat dalam sistem

## Metode Penilaian Keberhasilan
Keberhasilan sistem akan diukur melalui beberapa metrik kunci:

### Efisiensi Operasional
- Rata-rata waktu dari pengajuan ke pencairan
- Jumlah aplikasi yang dapat diproses per analis per hari
- Persentase otomatisasi dari tugas administratif
- Pengurangan kesalahan administratif dan duplikasi upaya

### Kualitas Keputusan
- Konsistensi keputusan untuk aplikasi yang serupa
- Persentase keputusan yang sesuai dengan kebijakan yang ditetapkan
- Akurasi prediksi sistem dibandingkan dengan hasil aktual (setelah cukup lama)
- Pengurangan variasi dalam penilaian antar analis

### Manajemen Risiko
- Tingkat NPL (Non Performing Loan) sebelum dan sesudah implementasi
- Deteksi dini masalah melalui early warning system
- Efektivitas mitigasi risiko yang diusulkan oleh sistem
- Kepatuhan terhadap limit eksposur dan kebijakan risiko

### Kepatuhan dan Standar
- Kepatuhan terhadap peraturan OJK, BI, dan peraturan perbankan lainnya
- Kelengkapan dan keajiban dokumentasi untuk tujuan audit
- Sistem audit trail yang lengkap dan tidak dapat diubah
- Keamanan data sesuai dengan standar perindustrian

### Kepuasan Pengguna
- Tingkat kepuasan AO, analis, dan manajer terhadap sistem
- Pengurangan keluhan terkait sistem dan proses
- Tingkat adopsi sistem oleh pengguna akhir
- Feedback kualitatif dari pengguna tentang manfaat dan kesulitan penggunaan

### Dampak Bisnis
- Pertumbuhan portofolio kredit yang sehat
- Optimasi kombinasi risiko dan retour
- Peningkatan efisiensi biaya operasional per dana yang Dialokasikan
- Peningkatan daya saing melalui layanan yang lebih cepat dan responsif

## Prasyarat Keberhasilan
Untuk memastikan keberhasilan implementasi sistem, beberapa prasyarat harus dipenuhi:

### 1. Kesiangan Organisasi
- Komitmen dari pimpinan atas untuk transformasi digital
- Siapnya perubahan budaya menuju lebih data-driven dan kurang berbasis intuisi
- Ketersediaan sumber daya untuk pelatihan dan perubahan proses
- Dukungan dari semua level organisasi, termasuk union karyawan jika berlaku

### 2. Kualitas Data
- Kelengkapan dan konsistensi data master (nasabah, produk, agunan, dll.)
- Keacuratan data historis yang akan digunakan untuk training dan validasi model
- Proses ingres data yang baik untuk menjamin kualitas data masuk ke sistem
- Praktik pembersihan dan pemeliharaan data secara reguler

### 3. Infrastruktur Teknis
- Cukupnya sumber daya komputasi untuk menjalankan layanan AI/ML
- Stabilitas jaringan untuk komunikasi antar service dan dengan sistem eksternal
- Cukupnya kapasitas penyimpanan untuk dokumen, log, dan backup
- Redundansi dan failover untuk komponen kritis sesuai dengan kebutuhan availability

### 4. Kepatuhan dan Keamanan
- Pengawasan terhadap kepatuhan dengan peraturan perbankan yang relevan
- Implementasi kontrol keamanan yang sesuai dengan risiko
- Audit keamanan berkala dan penetest jika diperlukan
- Kedatangan sumber daya yang memahami baik teknologi maupun peraturan perbankan

### 5. Manajemen Perubahan
- Rencana pelatihan yang comprehensif untuk semua grup pengguna
- Strategi komunikasi yang jelas mengenai manfaat dan perubahan yang akan terjadi
- Mekanisme umpan balik yang efektif untuk memperbaiki sistem dan proses
- Dukungan selama periode transisi dan pasca-implementasi

## Hubungan dengan Inisiatif Lainnya
Sistem Analisa Kredit tidak berdiri sendiri, tetapi merupakan bagian dari transformasi digital yang lebih luas di BPR BAPERA BATANG, yang mungkin mencakup:

1. **Modernisasi Infrastruktura Teknologi**
   - Pembaruan infrastruktur server dan jaringan
   - Implementasi cloud atau hibrid infrastructure jika sesuai dengan strategi
   - Modernisasi sistem inti perbankan (core banking system)
   - Integrasi dengan sistem layanan tambahan (wealth management, bancassurance, etc.)

2. **Transformasi Digital Seluruh Nilai Rantai**
   - Digitalisasi proses pembukaan rekening
   - Otomatisasi transaksi harian dan layanan teller
   - Digitalisasi layanan nasabah melalui mobile dan internet banking
   - Otomatisasi proses back office dan administrasi

3. **Peningkatan Kapasitas Analisis dan Kecerdasan Bisnis**
   - Implementasi data warehouse dan analytical platform
   - Pengembangan kemampuan prediktif dan preskriptif analytics
   - Implementasi sistem manajemen performa (performance management)
   - Pengembangan kapabilitas untuk big data dan advanced analytics

4. **Pengalaman Nasabah yang Ditingkatkan**
   - Omnichannel experience untuk nasabah
   - Self-service portal untuk layanan rutin
   - Personalisasi layanan berdasarkan kebutuhan dan perilaku nasabah
   - Peningkatan aksesibilitas layanan melalui digital channel

5. **Manajemen Risiko dan Kepatuhan yang Ditingkatkan**
   - Enterprise Risk Management (ERM) terintegrasi
   - Real-time monitoring dan reporting risiko
   - Advanced risk modeling dan stress testing capability
   - Regulatory technology (RegTech) untuk kepatuhan yang lebih efisien

## Kesimpulan
Sistem Analisa Kredit bukan sekadar alat bantu teknis, tetapi merupakan transformasi dasar dalam cara BPR BAPERA BATANG mengelola risiko kredit dan membuat keputusan pinjaman. Dengan menggabungkan kekuatan otomatisasi, analisis data, dan kecerdasan buatan dengan pengawasan dan penilaian manusia yang tetap penting, sistem ini bertujuan untuk menciptakan proses kredit yang lebih efisien, konsisten, dan menguntungkan bagi zowel bank sebagai nasabahnya.

Implementasi sistem ini merupakan investasi strategis yang akan memberikan manfaat jangka panjang melalui peningkatan efisiensi operasional, manajemen risiko yang lebih baik, dan peningkatan layanan kepada nasabah. Suksesnya bergantung tidak hanya pada kualitas teknis solusi yang diimplementasikan, tetapi juga pada kesiangan organisasi untuk berevolusi dan mengadopsi cara baru bekerja yang lebih berbasis data dan teknologi.