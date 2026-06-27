# EARLY_WARNING_SYSTEM.md

# Modul Early Warning System (EWS)

## Gambaran Umum
Modul Early Warning System (EWS) adalah komponen yang bertanggung jawab untuk mendeteksi dini tanda-tanda potensi masalah pada kredit yang sudah dicairkan, sebelum masalah tersebut menjadi kredit macet atau klasikasi yang lebih parah. EWS bertujuan untuk memberikan peringatan awal sehingga tindak lanjut dapat dilakukan lebih awal untuk mencegah atau mengurangi kerugian.

## Tujuan Utama
1. Mendeteksi indikator dini potensi masalah kredit sebelum menjadi NPL (Non Performing Loan)
2. Memberikan peringatan awal kepada bagian terkait untuk tindak lanjut yang tepat waktu
3. Mengurangi tingkat kredit macet melalui intervensi dini
4. Menyediakan wawasan mengenai faktor-faktor yang berkontribusi pada risiko kredit
5. Mengoptimasi alokasi sumber daya untuk monitoring dan pemulihan kredit
6. Meningkatkan efektivitas proses restrukturisasi dan penyelesaian kredit bermasalah
7. Memenuhi persyaratan regulator mengenai monitoring kredit dan manajemen risiko

## Prinsip Dasar
- **Deteksi Dini**: Fokus pada identifikasi masalah sebelum terjadi default yang signifikan
- **Berbasis Data**: Menggunakan data kuantitatif dan kualitatif yang tersedia dalam sistem
- **Multi-Dimensional**: Mempertimbangkan berbagai aspek risiko (keuangan, operasia, lingkungan, perilaku pembayaran)
- **Dinamis dan Adaptive**: Menyesuaikan ambang batas dan bobot berdasarkan kondisi yang berubah
- **Action-Oriented**: Hasil EWS harus mengarah pada rekomendasi tindakan yang jelas dan spesifik
- **Transparansi dan Explainable**: Setiap peringatan harus bisa dijelaskan dengan jelas
- **Integrasi dengan Workflow**: Peringatan EWS harus terintegrasi dengan sistem approval dan tindak lanjut

## Jenis Indikator Risiko yang Dipantau

### 1. Indikator Pembayaran (Payment Indicators)
- **Terlambat Bayar (Late Payment)**: Jumlah hari keterlambatan pembayaran angsuran
- **Frekuensi Terlambat**: Seberapa sering nasabah terlambat membayar
- **Parsial Payment: Pembayaran yang kurang dari jumlah angsuran yang seharusnya
- **Skip Payment**: Pembayaran yang sepenuhnya tidak dilakukan
- **Payment Pattern Changes**: Perubahan pola pembayaran yang mencurigakan
- **Early Delinquency**: Tanda-tanda awal dari potensi macet

### 2. Indikator Keuangan (Financial Indicators)
- **Penurunan Omzet**: Penjualan atau pendapatan yang menurun secara signifikan
- **Penurunan Laba**: Profitabilitas yang menurun
- **Cash Flow Problems**: Masalah arus kas yang terdeteksi dari transaksi bank
- **Increasing Leverage**: Kenaikan utang terhadap ekuitas atau aset
- **Liquidity Deterioration**: Penurunan likuiditas yang mengancam kemampuan pembayaran
- **Working Capital Crisis**: Masalah modal kerja yang berat

### 3. Indikator Usaha dan Operasional (Business & Operational Indicators)
- **Perubahan Struktur Kepemilikan**: Pengalihan kepemilikan yang signifikan
- **Perubahan Manajemen**: Pergantian kunci pelaksana atau direksi
- **Penurunan Aktivitas Usaha**: Penjualan, produksi, atau layanan yang menurun
- **Masalah Supply Gangguan**: Masalah dalam rantai pasokan bahan baku atau distribusi
- **Komplain Pelanggan**: Keluhan yang meningkat dari pelanggan atau mitra usaha
- **Legal Issues**: Gugatan, masalah hukum, atau sanksi regulasi
- **Asset Deterioration**: Penurunan nilai atau kondisi aset yang signifikan

### 4. Indikator Agunan dan Jaminan (Collateral Indicators)
- **Penurunan Nilai Agunan**: Penjualan aset jaminan atau penurunan nilai pasaran
- **Physical Damage**: Kerusakan fisik pada aset jaminan
- **Legal Status Changes**: Perubahan status hukum agunan (gadai, pertengkaban, dll.)
- **Environmental Issues**: Kontaminasi atau masalah lingkungan pada tanah jaminan
- **Accessibility Issues**: Kesulitan mengakses atau mempertahankan aset jaminan

### 5. Indikator Lingkungan dan Industri (Environmental & Industry Indicators)
- **Industry Downturn**: Penurunan sektoral yang memengaruhi usaha nasabah
- **Regulatory Changes**: Perubahan peraturan yang berdampak negatif pada usaha
- **Supply Chain Disruption**: Masalah dalam rantai pasokan global atau lokal
- **Technological Obsolescence**: Teknologi yang usang membuat produkt tidak kompetitif
- **Market Saturation**: Pasar yang sudah penuh dengan pesaing
- **Price Pressure**: Tekanan harga yang mengurangi margin laba

### 6. Indikator Perilaku dan Kredibilitas (Behavioral & Credibility Indicators)
- **Frekuensi Kontakt AO**: Kurangnya koordinasi atau komunikasi dengan AO
- **Refusal to Provide Data**: Penolakan untuk menyediakan informasi yang diminta
- **Inconsistent Information**: Informasi yang tidak konsisten atau berubah-ubah
- **Relocation Without Notice**: Pindah lokasi usaha atau domisili tanpa pemberitahuan
- **Lifestyle Changes**: Perubahan gaya hidup yang tidak sesuai dengan pendapatan laporkan
- **Association with High-Risk Entities**: Keterkaitan dengan individu atau usaha berisiko tinggi

## Alur Kerja EWS

### 1. Pengumpulan Data
EWS mengumpulkan data dari berbagai sumber dalam sistem:
- **Pembayaran**: Data dari tabel pembayaran (tanggal, jumlah, status)
- **Keuangan**: Data laporan keuangan yang diperbarui secara periodik
- **Survey**: Hasil survey lapangan terkini (jika ada survei berulang)
- **Dokumen**: Perubahan atau pembaruan dokumen penting
- **Agunan**: Pembaruan nilai atau kondisi aset jaminan
- **Monitoring**: Catatan monitoring rutin dari AO atau sistem
- **External Data**: Data dari sistem eksternal seperti SLIK, news feed, dll. (jika terintegrasi)

### 2. Pemrosesan dan Analisis
Data yang dikumpulkan diproses melalui beberapa tahap:

#### a. Data Normalisasi dan Pembersihan
- Mengonversi data ke dalam format yang konsisten
- Mengisi data yang hilang dengan imputasi yang sesuai (jika memungkinkan)
- Mendeteksi dan memperbaiki anomali atau outlier
- Menstandarkan satuan dan periode pelaporan

#### b. Perhitungan Indikator
- Menghitung metrik-metrik khusus untuk setiap jenis indikator
- Membandingkan nilai aktual dengan ambang batas yang ditetapkan
- Menghitung skor kontribusi dari setiap indikator
- Menerapkan bobot berdasarkan signifikansi prediktif masing-masing indikator

#### c. Analisis Tren dan Pola
- Menganalisis perubahan seiring waktu (trend analysis)
- Mendeteksi pola yang tidak biasa (anomaly detection)
- Membandingkan dengan performa historis nasabah atau kelompok serupa
- Menganalisis korelasi antara berbagai indikator

#### d. Pembuatan Skor Risiko
- Menggabungkan kontribusi dari berbagai indikator menjadi skor risiko komposit
- Menerapkan fungsi agregasi yang sesuai (weighted average, logistic regression, etc.)
- Menormalisasi skor ke skala yang dapat dipahami (misal: 0-100)
- Mengklasifikasikan tingkat risiko berdasarkan skor (rendah, sedang, tinggi, kritis)

### 3. Pembuatan Peringatan
Berdasarkan hasil analisis:
- **Threshold-Based Alerts**: Alert ketika melebihi ambang batas yang ditetapkan
- **Trend-Based Alerts**: Alert ketika menunjukkan penurunan yang mencurigakan
- **Anomaly-Based Alerts**: Alert ketika menunjukkan perilaku yang sangat berbeda dari historis
- **Composite Score Alerts**: Alert ketika skor risiko komposit melebihi ambang batas tertentu
- **Cluster-Based Alerts**: Alert ketika nasabah termasuk dalam kelompok yang teridentifikasi berisiko tinggi

### 4. Penyampaian Peringatan
Peringatan dikirimkan melalui beberapa saluran:
- **In-App Notification**: Notifikasi di dashboard sistem
- **Email**: Notifikasi melalui email kepada pihak yang berwenang
- **SMS/WhatsApp**: Notifikasi singkat untuk pertentangan segera
- **Task Assignment**: Pembuatan tugas secara otomatis dalam sistem workflow
- **Escalation**: Pengeskalan ke tingkat manajemen yang lebih tinggi jika tidak ada tanggapan
- **Reporting**: Inklusikan dalam laporan monitoring harian, mingguan, atau bulanan

### 5. Tindak Lanjut dan Resolusi
Setelah peringatan diterima:
- **Initial Review**: Tinjauan awal oleh pihak yang bersangkutan (AO, analis, atau spesialis EWS)
- **Data Collection**: Pengumpulan informasi tambahan yang diperlukan
- **Root Cause Analysis**: Analisis mendalam untuk menemukan penyebab indikator risiko
- **Action Planning**: Pengembangan rencana tindak lanjut yang sesuai
- **Intervention**: Pelaksanaan tindak lanjut (penagihan, restrukturisasi, kunjungan, dll.)
- **Follow-Up Monitoring**: Pemantauan efektivitas tindak lanjut yangambil
- **Resolution**: Penyelesaian masalah melalui perbaikan, restrukturisasi, atau pengurangan risiko

## Implementasi Teknis

### Basis Data Skema

#### Tabel Indikator Risiko
```sql
CREATE TABLE ews_risk_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    akad_id UUID NOT NULL REFERENCES akad(id) ON DELETE CASCADE,
    indicator_type VARCHAR(50) NOT NULL,  -- e.g., 'LATE_PAYMENT', 'REVENUE_DECLINE', 'COLLATERAL_DEPRECIATION'
    indicator_name VARCHAR(100) NOT NULL,
    description TEXT,
    value NUMERIC(20, 6),  -- Nilai numerik indikator
    value_text TEXT,       -- Nilai teks jika berlaku
    unit VARCHAR(20),      -- Satuan nilai (hari, persen, jumlah, dll.)
    reference_value NUMERIC(20, 6),  -- Ambang batas atau nilai referensi
    reference_text TEXT,   -- Referensi teks jika berlaku
    threshold_breached BOOLEAN NOT NULL,  -- Apakah nilai melebihi ambang batas
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    confidence_score NUMERIC(3, 2) DEFAULT 0.50 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB  -- Informasi tambahan spesifik untuk tipe indikator
);

-- Indexes
CREATE INDEX idx_ews_indicators_akad ON ews_risk_indicators(akad_id);
CREATE INDEX idx_ews_indicators_type ON ews_risk_indicators(indicator_type);
CREATE INDEX idx_ews_indicators_detected_at ON ews_risk_indicators(detected_at);
CREATE INDEX idx_ews_indicators_active ON ews_risk_indicators(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_ews_indicators_severity ON ews_risk_indicators(severity);
CREATE INDEX idx_ews_indicators_threshold ON ews_risk_indicators(threshold_breached);
```

#### Tabel Skor Risiko Komposit
```sql
CREATE TABLE ews_risk_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    akad_id UUID NOT NULL REFERENCES akad(id) ON DELETE CASCADE,
    overall_score NUMERIC(5, 2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    risk_category VARCHAR(20) NOT NULL CHECK (risk_category IN ('VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH')),
    score_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    calculation_method VARCHAR(50),  -- Metode yang digunakan untuk menghitung skor
    contributing_factors JSONB,      -- Detail kontribusi dari setiap indikator
    metadata JSONB,
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexes
CREATE INDEX idx_ews_scores_akad ON ews_risk_scores(akad_id);
CREATE INDEX idx_ews_scores_timestamp ON ews_risk_scores(score_timestamp);
CREATE INDEX idx_ews_scores_category ON ews_risk_scores(risk_category);
CREATE INDEX idx_ews_scores_active ON ews_risk_scores(is_active) WHERE is_active = TRUE;
```

#### Tabel Peringatan dan Notifikasi
```sql
CREATE TABLE ews_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    akad_id UUID NOT NULL REFERENCES akad(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,  -- e.g., 'THRESHOLD_BREACH', 'TREND_ALERT', 'ANOMALY_DETECTED'
    alert_title VARCHAR(200) NOT NULL,
    alert_description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'FALSE_POSITIVE')),
    triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    triggered_by UUID,  -- Sistem atau pengguna yang memicu peringatan
    acknowledged_by UUID REFERENCES users(id),
    resolved_by UUID REFERENCES users(id),
    resolution_notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ews_alerts_akad ON ews_alerts(akad_id);
CREATE INDEX idx_ews_alerts_status ON ews_alerts(status);
CREATE INDEX idx_ews_alerts_severity ON ews_alerts(severity);
CREATE INDEX idx_ews_alerts_triggered_at ON ews_alerts(triggered_at);
CREATE INDEX idx_ews_alerts_acknowledged ON ews_alerts(acknowledged_at) WHERE acknowledged_at IS NOT NULL;
```

#### Tabel Tindak Lanjut dan Tugas
```sql
CREATE TABLE ews_follow_up_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES ews_alerts(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,  -- e.g., 'PHONE_CALL', 'FIELD_VISIT', 'RESTRUCTURE_PROPOSAL', 'LEGAL_ACTION'
    action_description TEXT NOT NULL,
    assigned_to UUID REFERENCES users(id),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    outcome VARCHAR(200),  -- Hasil tindak lanjut
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ews_followup_alert ON ews_follow_up_actions(alert_id);
CREATE INDEX idx_ews_followup_status ON ews_follow_up_actions(status);
CREATE INDEX idx_ews_followup_assigned ON ews_follow_up_actions(assigned_to);
CREATE INDEX idx_ews_followup_due ON ews_follow_up_actions(due_date);
```

### Layanan Utama
1. **DataCollectorService**:
   - Mengumpulkan data dari berbagai sumber dalam sistem
   - Menjadwalkan pengumpulan data berkala (harian, mingguan, bulanan)
   - Mengintegrasikan dengan sistem eksternal jika diperlukan
   - Menyediakan data yang telah dinormalisasi untuk pemrosesan lanjutan

2. **IndicatorCalculatorService**:
   - Menghitung indikator risiko individu berdasarkan data yang tersedia
   - Menerapkan logika khusus untuk setiap tipe indikator
   - Mendeteksi pelanggaran ambang batas
   - Menyediakan nilai indikator dan metadata terkait

3. **TrendAnalyzerService**:
   - Menganalisis perubahan seiring waktu untuk setiap indikator
   - Mendeteksi pola yang tidak biasa atau mencurigakan
   - Membandingkan dengan historis nasabah atau kelompok serupa
   - Menyediakan skor tren dan indikator momentum

4. **RiskScorerService**:
   - Menggabungkan kontribusi dari berbagai indikator menjadi skor komposit
   - Menerapkan model penilaian risiko yang dikonfigurasi
   - Menormalisasi dan mengkategorikan skor risiko
   - Menyediakan penjelasan tentang kontribusi masing-masing faktor

5. **AlertGeneratorService**:
   - Membuat peringatan berdasarkan indikator, tren, dan skor risiko
   - Menerapkan aturan peringatan yang dikonfigurasi
   - Menentukan tingkat keparahan dan saluran notifikasi
   - Menyediakan informasi kontekstual untuk setiap peringatan

6. **NotificationService**:
   - Mengirimkan peringatan melalui berbagai saluran (email, SMS, in-app, dll.)
   - Mengelola template pesan untuk berbagai tipe peringatan
   - Menyediakan mekanisme konfirmasi dan pengakuan peringatan
   - Melacak status peringatan dan tindak lanjut

7. **FollowUpManagerService**:
   - Membuat dan mengelola tugas tindak lanjut berdasarkan peringatan
   - Menugaskan tugas kepada pihak yang sesuai
   - Melacak progres dan penyelesaian tugas
   - Menyediakan laporan tentang efektivitas tindak lanjut

### API Endpoints
```
GET   /api/v1/ews/indicators/{akadId}           # Dapatkan indikator risiko untuk akad tertentu
GET   /api/v1/ews/score/{akadId}                # Dapatkan skor risiko untuk akad tertentu
GET   /api/v1/ews/alerts                        # Daftar peringatan EWS (dengan filter dan paginasi)
GET   /api/v1/ews/alerts/{alertId}              # Dapatkan detail peringatan tertentu
POST  /api/v1/ews/alerts/{alertId}/acknowledge  # Konfirmasi penerimaan peringatan
POST  /api/v1/ews/alerts/{alertId}/resolve      # Tandai peringatan sebagai terselesaikan
GET   /api/v1/ews/follow-up/{alertId}           # Dapatkan tindak lanjut untuk peringatan tertentu
POST  /api/v1/ews/follow-up                     # Buat tindak lanjut baru
GET   /api/v1/ews/statistics                    # Dapatkan statistik EWS
POST  /api/v1/ews/process/{akadId}              # Proses EWS untuk akad tertentu (on-demand)
POST  /api/v1/ews/process-batch                 # Proses EWS untuk beberapa akad sekaligus
```

## Konfigurasi dan Pengaturan

### Indicator Configuration
Setiap tipe indikator memiliki konfigurasi yang mencakup:
- **Data Sources**: Dari mana data diambil untuk menghitung indikator
- **Calculation Formula**: Cara menghitung nilai indikator dari data mentah
- **Reference Values**: Nilai referensi atau ambang batas normal
- **Threshold Values**: Nilai yang ketika melampaui dianggap sebagai indikator risiko
- **Severity Mapping**: Cara memetakan nilai indikator kepada tingkat keparahan
- **Weight**: Kontribusi relatif indikator ini terhadap skor risiko komposit
- **Calculation Frequency**: Seberapa sering indikator ini harus dihitung
- **Data Freshness Requirement**: Seberapa baru data harus untuk indikator valid

### Risk Scoring Model Configuration
Konfigurasi untuk model penilaian risiko komposit mencakup:
- **Method**: Metode agregasi (weighted average, logistic regression, decision tree, dll.)
- **Weights**: Bobot relatif untuk setiap kategori indikator
- **Normalization**: Cara menormalisasi skor individu sebelum aggregasi
- **Category Thresholds**: Ambang batas untuk setiap kategori risiko (RENDAH, SEDANG, TINGGI, dll.)
- **Time Decay**: Apakah dan seberapa lama pengaruh data historis menurun seiring waktu
- **Industry Adjustment**: Penyesuaian berdasarkan sektor atau industri nasabah
- **Seasonal Adjustment**: Penyesuaian berdasarkan pola musiman jika berlaku

### Alert Configuration
Konfigurasi untuk peringatan mencakup:
- **Alert Rules**: Kondisi ketika peringatan harus dipicu
- **Severity Mapping**: Cara memetakan kondisi ke tingkat keparahan
- **Notification Channels**: Saluran mana yang digunakan untuk setiap tingkat keparahan
- **Escalation Rules**: Ketika dan bagaimana peringatan harus dieskalasi
- **Auto-Resolution Rules**: Kondisi ketika peringatan dapat ditandai sebagai terselesaikan secara otomatis
- **Frequency Limits**: Batas seberapa sering peringatan serupa dapat dipicu untuk akad yang sama

## Integrasi dengan Komponen Lainnya

### 1. Dengan Akad dan Pembayaran
- Menerima data pembayaran untuk menghitung indikator keterlambatan dan pola pembayaran
- Menggunakan status akad untuk menentukan apakah EWS aktif (hanya untuk akad yang masih aktif)
- Memberikan umpan balik ke sistem pembayaran tentang pola yang terdeteksi

### 2. Dengan Financial Service dan Analisa
- Menerima data keuangan yang diperbarui untuk menghitung indikator keuangan
- Mengintegrasikan dengan hasil analisa konsumtif/produktif untuk indikator terkini
- Memberikan indikator risiko sebagai input untuk analisis keuangan yang lebih lanjut

### 3. Dengan Survey dan Monitoring Service
- Menerima hasil survey lapangan terkini untuk indikator usaha dan lingkungan
- Mengintegrasikan dengan catatan monitoring rutin dari AO
- Menggunakan data survey sebagai validasi untuk indikator yang diduga dari data transaksi

### 4. Dengan Collateral dan Agunan Service
- Menerima pembaruan nilai dan kondisi aset jaminan untuk indikator agunan
- Mengintegrasikan dengan hasil preseshapen atau nilai pasar aset jaminan
- Menggunakan data agunan untuk mengukur perubahan risiko jaminan

### 5. Dengan Knowledge Service
- Menerapkan SOP dan pedoman untuk indikator risiko dan ambang batas yang sesuai
- Menggunakan basis pengetahuan untuk menjelaskan makna dan dampak masing-masing indikator
- Menyediakan referensi untuk tindak lanjut yang sesuai berdasarkan jenis indikator

### 6. Dengan Workflow Engine
- Membuat tugas tindak lanjut dalam sistem workflow ketika peringatan dikonfirmasi
- Mengintegrasikan dengan sistem approval untuk tindak lanjut yang perlu keputusan
- Memberikan konteks EWS sebagai bagian dari berkas yang ditinjau dalam workflow
- Mengalirkan informasi hasil tindak lanjut kembali ke EWS untuk pembelajaran

### 7. Dengan Reporting dan Dashboard
- Menyediakan data untuk laporan monitoring kredit risiko
- Membangkitkan indikator untuk dashboard early warning
- Menyediakan data historis untuk analisis efektivitas EWS
- Membangkitkan laporan tentang tren risiko portofolio

## Contoh Implementasi Indikator Risiko

### Indikator Keterlambatan Pembayaran (Late Payment)
```javascript
// Fungsi untuk menghitung indikator keterlambatan pembayaran
function calculateLatePaymentIndicator(paymentHistory, akadDetails) {
    // Ambil histori pembayaran
    const payments = paymentHistory
        .filter(p => p.akadId === akadDetails.id && p.status !== 'CANCELLED')
        .sort((a, b) => new Date(b.tanggalJatuhTempo) - new Date(a.tanggalJatuhTempo));
    
    if (payments.length === 0) {
        return {
            value: 0,
            unit: 'hari',
            thresholdBreached: false,
            severity: 'LOW',
            confidenceScore: 0.9
        };
    }
    
    // Hitung keterlambatan maksimum dalam histori terbaru
    const recentPayments = payments.slice(0, Math.min(3, payments.length)); // 3 pembayaran terakhir
    let maxDaysLate = 0;
    let totalLateDays = 0;
    let latePaymentCount = 0;
    
    for (const payment of recentPayments) {
        const daysLate = Math.max(0, 
            (new Date(payment.tanggalBayar || new Date()) - 
             new Date(payment.tanggalJatuhTempo)) / (1000 * 60 * 60 * 24)
        );
        
        if (daysLate > 0) {
            maxDaysLate = Math.max(maxDaysLate, daysLate);
            totalLateDays += daysLate;
            latePaymentCount++;
        }
    }
    
    const avgDaysLate = latePaymentCount > 0 ? totalLateDays / latePaymentCount : 0;
    
    // Tentukan ambang batas berdasarkan produk dan histori nasabah
    let thresholdDays = 15; // Default 15 hari
    if (akadDetails.jenisProduk === 'KONSUMTIF') {
        thresholdDays = 15;
    } else if (akadDetails.jenisProduk === 'PRODUKTIF') {
        thresholdDays = 30; // Lebih lama untuk produktif
    }
    
    // Sesuaikan berdasarkan histori nasabah (jika ada data historis baik, ambang batas bisa lebih tinggi)
    // Ini akan diimplementasikan dalam versi yang lebih kompleks
    
    const thresholdBreached = maxDaysLate > thresholdDays;
    
    // Tentukan keparahan
    let severity = 'LOW';
    if (maxDaysLate > thresholdDays * 2) {
        severity = 'HIGH';
    } else if (maxDaysLate > thresholdDays * 1.5) {
        severity = 'MEDIUM';
    } else if (maxDaysLate > thresholdDays) {
        severity = 'LOW';
    }
    
    // Confidence score berdasarkan konsistensi data
    const confidenceScore = payments.length >= 3 ? 0.95 : 
                           payments.length >= 2 ? 0.8 : 0.6;
    
    return {
        value: maxDaysLate,
        unit: 'hari',
        thresholdValue: thresholdDays,
        thresholdBreached: thresholdBreached,
        severity: severity,
        confidenceScore: confidenceScore,
        metadata: {
            recentPaymentCount: recentPayments.length,
            latePaymentCount: latePaymentCount,
            avgDaysLate: avgDaysLate,
            paymentHistoryLength: payments.length
        }
    };
}
```

### Indikator Penurunan Omzet (Revenue Decline)
```javascript
// Fungsi untuk menghitung indikator penurunan omzet
function calculateRevenueDeclineIndicator(financialHistory, akadDetails) {
    // Ambil histori laporan keuangan
    const financialReports = financialHistory
        .filter(f => f.akadId === akadDetails.id && f.jenisLaporan === 'BULANAN')
        .sort((a, b) => new Date(b.periodeAkhir) - new Date(a.periodeAkhir));
    
    if (financialReports.length < 2) {
        return {
            value: 0,
            unit: 'persen',
            thresholdBreached: false,
            severity: 'LOW',
            confidenceScore: 0.5
        };
    }
    
    // Bandingkan omzet dua periode terbaru
    const latest = financialReports[0];
    const previous = financialReports[1];
    
    if (!latest.omzet || !previous.omzet) {
        return {
            value: 0,
            unit: 'persen',
            thresholdBreached: false,
            severity: 'LOW',
            confidenceScore: 0.3  // Low confidence karena data tidak lengkap
        };
    }
    
    const omzetChange = ((latest.omzet - previous.omzet) / previous.omzet) * 100;
    const omzetDecline = -Math.min(0, omzetChange); // Nilai positif jika omzet menurun
    
    // Tentukan ambang batas berdasarkan jenis usaha dan kondisi pasar
    let thresholdPercent = 20; // Default 20% penurunan
    // Ini bisa disesuaikan berdasarkan industri nasabah dari data usaha
    
    const thresholdBreached = omzetDecline > thresholdPercent;
    
    // Tentukan keparahan
    let severity = 'LOW';
    if (omzetDecline > thresholdPercent * 2) {
        severity = 'HIGH';
    } else if (omzetDecline > thresholdPercent * 1.5) {
        severity = 'MEDIUM';
    } else if (omzetDecline > thresholdPercent) {
        severity = 'LOW';
    }
    
    // Confidence score berdasarkan keterkatan dan konsistensi data
    const confidenceScore = financialReports.length >= 3 ? 0.9 :
                           financialReports.length === 2 ? 0.7 : 0.5;
    
    return {
        value: omzetDecline,
        unit: 'persen',
        thresholdValue: thresholdPercent,
        thresholdBreached: thresholdBreached,
        severity: severity,
        confidenceScore: confidenceScore,
        metadata: {
            latestOmzet: latest.omzet,
            previousOmzet: previous.omzet,
            latestPeriod: latest.periodeAkhir,
            previousPeriod: previous.periodeAkhir,
            financialReportsCount: financialReports.length
        }
    };
}
```

## Prosedur Operasional Standar (SOP)

### 1. Pengaturan dan Konfigurasi Awal
- Menentukan daftar indikator risiko yang akan dipantau
- Menetapkan ambang batas dan bobot untuk setiap indikator
- Mengonfigurasi model penilaian risiko komposit
- Menyiapkan aturan peringatan dan saluran notifikasi
- Menetapkan jadwal pemrosesan EWS (harian, mingguan, bulanan)

### 2. Pemrosesan Rutin
#### Pemrosesan Harian
- Mengumpulkan data pembayaran hari ini
- Memperbarui indikator berbasis pembayaran
- Memeriksa peringatan berbasis ambang batas yang terlampaui
- Mengirimkan notifikasi peringatan kritis segera

#### Pemrosesan Mingguan
- Mengumpulkan dan memproses data keuangan mingguan (jika tersedia)
- Memperbarui indikator keuangan dan operasia
- Menganalisis tren mingguan untuk indikator utama
- Menghitung skor risiko komposit mingguan
- Membangkitkan laporan mingguan untuk tim manajemen

#### Pemrosesan Bulanan
- Mengumpulkan data komprehensif dari semua sumber
- Menghitung semua indikator risiko
- Menganalisis tren bulanan dan musiman
- Menghitung dan membandingkan skor risiko komposit
- Membangkitkan laporan bulanan untuk direksi dan komisaris
- Melakukan backtesting model terhadap hasil aktual

### 3. Penanganan Peringatan
#### Penerimaan Peringatan
- Menerima notifikasi melalui saluran yang dikonfigurasi
- Mencatat waktu penerimaan dan mengubah status menjadi 'DITERIMA'
- Mengalirkan peringatan kepada pihak yang sesuai berdasarkan keparahan dan tipe

#### Tinjauan Awal
- Melakukan review awal dalam jangka waktu yang ditetapkan (misal: 4 jam untuk kritis, 24 horas untuk tinggi)
- Memverifikasi kebenaran peringatan (false positive check)
- Mengumpulkan data tambahan yang diperlukan untuk analisis lebih lanjut

#### Analisis Akar Masalah
- Melakukan analisis mendalam untuk menemukan penyebab indikator
- Menggunakan teknik seperti 5 Whys, fishbone diagram, atau analisis regresi
- Mengidentifikasi apakah indikator menunjukkan masalah sementara atau struktural

#### Rencana Tindak Lanjut
- Mengembangkan rencana tindak lanjut yang sesuai berdasarkan jenis dan keparahan indikator
- Menentukan siapa yang bertanggung jawab untuk setiap tindak lanjut
- Menyetujui jadwal dan alokasi sumber daya untuk tindak lanjut

#### Pelaksanaan dan Follow-Up
- Melaksanakan rencana tindak lanjut sesuai jadwal
- Memantau efektivitas tindak lanjut melalui perubahan indikator
- Menyesuaikan rencana jika diperlukan berdasarkan respons
- Menyelesaikan peringatan ketika masalah telah diatasi atau diketahui sebagai false positive

### 4. Evaluasi dan Peningkatan Berkala
#### Evaluasi Mingguan
- Meninjau akurasi peringatan (true positive vs false positive)
- Menganalisis pola peringatan yang sering terjadi
- Mengevaluasi efektivitas tindak lanjut yang telah diambil

#### Evaluasi Bulanan
- Meninjau kinerja model penilaian risiko
- Mengukur korelasi antara skor EWS dan hasil aktual kredit
- Menyesuaikan ambang batas dan bobot berdasarkan hasil evaluasi
- Mengupdate daftar indikator jika diperlukan

#### Evaluasi Kuartalan
- Meninjau relevansi industri dan makroekonomi pada konfigurasi EWS
- Menilai kebutuhan untuk indikator baru berdasarkan perubahan pasar
- Mengukur ROI dari EWS melalui penurunan NPL dan biaya pemulihan
- Melakukan review komprehensif dan rekomendasi perubahan besar

## Kepatuhan dan Standar Regulator

### Persyaratan OJK
EWS harus memenuhi persyaratan OJK mengenai:
- **Pendeteksian Masalah Kredit**: Sistem yang mampu mendeteksi masalah kredit sebelum menjadi klasikasi yang parah
- **Laporan Risiko**: Kemampuan untuk menghasilkan laporan risiko kredit yang sesuai dengan format OJK
- **Cadangan Cadangan Kerugian**: Informasi yang dapat digunakan untuk penetapan cadangan kerugian
- **Strategi Pulih**: Informasi yang mendukung pengembangan strategi pulih kredit bermasalah

### Standar Internal
- **Akuntabilitas**: Setiap peringatan dan tindak lanjut harus dapat dilacak
- **Transparansi**: Metode dan dasar peringatan harus dapat dijelaskan
- **Konsistensi**: Penerapan EWS harus konsisten sesuai seluruh cabang dan produk
- **Peningkatan Berkelanjutan**: Sistem harus terus belajar dan meningkat dari pengalaman

## Testing dan Validasi

### Jenis Pengujian
1. **Unit Testing**:
   - Menguji fungsi individual seperti perhitungan indikator, analisis tren, dan penilaian risiko
   - Menggunakan data uji yang mencakup berbagai skenario dan edge cases

2. **Integration Testing**:
   - Menguji alur lengkap dari pengumpulan data hingga pembuatan peringatan
   - Menguji integrasi dengan komponen lain seperti sistem pembayaran dan keuangan

3. **Scenario Testing**:
   - Membuat skenario kredit yang mewakili berbagai kondisi (sehat, memburuk, pulih)
   - Memastikan bahwa EWS memberikan peringatan yang sesuai dan tepat waktu
   - Menguji deteksi dini berbagai jenis masalah kredit

4. **Backtesting dengan Data Historis**:
   - Menguji performa EWS menggunakan data historis yang sudah ada hasilnya
   - Membandingkan peringatan EWS dengan klasikasi kredit aktual
   - Mengukur metrik seperti waktu advance warning dan akurasi prediksi

5. **False Positive/Negative Analysis**:
   - Menganalisis kasus ketika EWS memberikan peringatan yang tidak berdasar (false positive)
   - Menganalisis kasus ketika EWS gagal mendeteksi masalah yang sebenarnya ada (false negative)
   - Menyesuaikan konfigurasi berdasarkan hasil analisis

### Metrik Efektivitas
- **Lead Time Warning**: Rata-rata waktu antara peringatan EWS dan terjadinya masalah nyata
- **True Positive Rate**: Persentase peringatan yang benar-benar menunjukkan masalah yang memerlukan perhatian
- **False Positive Rate**: Persentase peringatan yang tidak menunjukkan masalah signifikan
- **False Negative Rate**: Persentase masalah yang tidak terdeteksi oleh EWS sebelum menjadi parah
- **Accuracy**: Akurasi keseluruhan sistem dalam memprediksi masalah kredit
- **Cost of Avoidance**: Pengurangan biaya kerugian akibat intervensi dini
- **Resource Efficiency**: Rasio antara upaya yang ditransaksikan dan manfaat yang diperoleh

## Dokumen dan Pelatihan

### Dokumen Pengguna
1. **Panduan Pengguna EWS untuk Analis dan Spesialis Risiko**:
   - Cara membaca dan memahami peringatan EWS
   - Cara melakukan tinjauan awal dan analisis akar masalah
   - Cara mengembangkan dan melaksanakan rencana tindak lanjut
   - Cara memberikan umpan balik untuk meningkatkan sistem EWS

2. **Panduan Teknis untuk Tim Pengembang**:
   - Arsitektur dan komponen EWS
   - Panduan untuk menambah tipe indikator risiko baru
   - Panduan untuk optimasi kinerja dan skalarbility
   - Panduan untuk troubleshooting masalah umum

3. **Panduan Manajemen untuk Kepala dan Direksi**:
   - Cara membaca laporan EWS dan memahami implikasinya strategis
   - Cara menggunakan data EWS untuk pengambilan keputusan portofolio
   - Cara mengevaluasi efektivitas sistem EWS secara keseluruhan

### Materi Pelatihan
1. **Pelatihan Dasar EWS**:
   - Konsep dan prinsip dasar early warning system
   - Memahami hubungan antara indikator risiko, skor komposit, dan peringatan
   - Pemahaman dasar tentang deteksi dini dan intervensi

2. **Pelatihan Lanjutan Analisis Indikator**:
   - Cara menginterpretasikan setiap tipe indikator risiko
   - Teknik untuk melakukan analisis akar masalah yang efektif
   - Metode untuk mengembangkan rencana tindak lanjut yang sesuai

3. **Pelatihan Pemecahan Masalah dan Pengambilan Keputusan**:
   - Cara menggunakan hasil EWS dalam proses pengambilan keputusan
   - Teknik untuk menyeimbangkan risiko dan biaya dalam menentukan tindak lanjut
   - Metode untuk melacak dan mengevaluasi efektivitas intervensi

## Pendekatan Implementasi dan Pengembangan

### Fase 1: Fondasi EWS
- Implementasi model data dasar untuk indikator, skor, dan peringatan
- Pengembangan layanan pengumpulan data dari sistem pembayaran dan keuangan
- Implementasi perhitungan indikator dasar (pembayaran, sederhana keuangan)
- Pengembangan sistem peringatan dasar dan notifikasi
- Pembuatan integrasi dengan sistem monitoring dan workflow dasar

### Fase 2: Fitur Lanjutan
- Implementasi indikator risiko kompleks (usaha, lingkungan, agunan)
- Pengembangan analisis tren dan pola yang lebih canggih
- Implementasi model penilaian risiko komposit yang konfigurasi
- Pengembangan sistem pengecualian false positive dan manual override
- Peningkatan integrasi dengan sistem eksternal (SLIK, news feed, dll.)

### Fase 3: Fitur Enterprise
- Implementasi machine learning untuk peningkatan indikator dan prediksi
- Pengembangan dashboard visualisasi risiko yang interaktif
- Integrasi dengan sistem strategi dan perencanaan untuk pengambilan keputusan portofolio
- Implementasi sistem pembelajaran berkelanjutan dari hasil aktual

## Pertimbangan untuk Masa Depan

### Integrasi dengan Kecerdasan Buatan
1. **Predictive Risk Modeling**:
   - Menggunakan machine learning untuk memproyeksikan risiko masa depan
   - Mengidentifikasi pola kompleks yang tidak dapat dideteksi dengan statistika tradisional
   - Menyesuaikan model secara kontinu berdasarkan hasil aktual

2. **Anomaly Detection Lanjutan**:
   - Sistem yang menggunakan teknik seperti isolation forest, autoencoder, atau One-Class SVM
   - Deteksi perilaku yang sangat berbeda dari normal tanpa perlu mendefinisikan spesifik indikator
   - Adaptasi otomatis ke perubahan pola perilaku nasabah

3. **Natural Language Processing for Unstructured Data**:
   - Analisis berita, media sosial, dan dokumen teks untuk indikator lingkungan dan industri
   - Ekstraksi sentensi dan topik dari teks yang tidak terstruktur
   - Integrasi hasil NLP sebagai indikator tambahan dalam model risiko

### Enhanced Visualization dan Interaction
1. **Interactive Risk Dashboard**:
   - Dashboard yang memungkinkan drill-down dari portofolio ke nasabah individu
   - Visualisasi kontribusi masing-masing indikator terhadap skor risiko
   - Simulasi what-if untuk melihat dampak perubahan indikator atau upaya tindak lanjut

2. **Geospatial Risk Mapping**:
   - Pemetaan risiko berdasarkan lokasi geografis nasabah atau agunan
   - Identifikasi klaster risiko geografis
   - Visualisasi eksposur sektoral dan geografis

3. **Real-Time Monitoring dan Alerting**:
   - Pemrosesan data secara real-time untuk indikator yang mendukungnya
   - Peringatan instan untuk indikator kritis yang terdeteksi
   - Dashboard yang memperbarui secara real-time berdasarkan data masuk

### Kolaborasi dan Berbasis Komunitas
1. **Shared Risk Intelligence**:
   - Berbagi indikator risiko dan pola dengan lembaga perbankan lain (melalui saluran yang aman dan sesuai peraturan)
   - Pembelajaran kolektif dari kebangkrutan dan masalah kredit sektor-wide
   - Standarisasi indikator risiko untuk perbandingan antarlembaga

2. **Customer Feedback Loop**:
   - Mengumpulkan umpan balik dari nasabah yang mendapat peringatan EWS
   - Memahami persepsi nasabah terhadap sistem early warning
   - Menyesuaikan pendekatan berdasarkan umpan balik untuk meningkatkan efektivitas dan penerimaan

## Kesimpulan
Early Warning System merupakan komponen krusial dalam manajemen risiko kredit yang berfokus pada deteksi dini dan intervensi preventif. Dengan menggabungkan berbagai jenis indikator risiko dari pembayaran, keuangan, usaha, agunan, dan faktor lingkungan, EWS memberikan peringatan yang tepat waktu sehingga tindak lanjut dapat dilakukan sebelum masalah kredit menjadi parah dan sulit diobati.

Implementasi EWS yang efektif tidak hanya mengurangi kerugian melalui deteksi dini, tetapi juga meningkatkan efisiensi operasional dengan mengalihkan fokus dari pemulihan kredit yang mahal ke pencegahan yang lebih ekonomis. Sistem EWS yang baik memberikan kepercayaan kepada pemangku kepentingan bahwa lembaga memiliki kemampuan untuk mengidentifikasi dan mengatasi risiko kredit secara proaktif, bukan hanya reaktif.

Sebagai bagian dari Sistem Analisa Kredit yang lengkap, EWS bekerja sinkron dengan komponen lain seperti Rule Engine, Policy Engine, Decision Engine, dan AI Credit Analyst untuk menciptakan sistem manajemen kredit yang holistik, responsif, dan efektif dalam menyeimbangkan pertumbuhan portofolio dengan preservasi nilai dan manajemen risiko yang sehat.