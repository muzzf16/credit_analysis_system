# DISBURSEMENT.md

# Modul Disbursement (Pencairan Dana)

## Gambaran Umum
Modul Disbursement mengelola seluruh proses pencairan dana kredit setelah aplikasi disetujui. Proses ini merupakan tahapan kritis yang menghubungkan keputusan kredit dengan realisasi pembayaran kepada debitur, sekaligus memastikan bahwa semua syarat dan ketentuan terpenuhi sebelum dana diterbitkan.

## Tujuan Utama
1. Mengelola persiapan dan validasi sebelum pencairan
2. Melaksanakan pencairan dana secara aman dan terpercaya
3. Mengintegrasikan dengan sistem perbankan inti (core banking system)
4. Mencatat seluruh transaksi pencairan dengan audit trail lengkap
5. Memastikan kepatuhan terhadap prosedur dan regulasi
6. Mengelola konfirmasi dan dokumentasi pencairan
7. Mendukung proses monitoring pasca-pencairan

## Prinsip Dasar
- **Segregation of Duties**: Pemisahan fungsi antara approval, preparation, dan eksekusi pencairan
- **Dual Control**: Kontrol ganda untuk transaksi pencairan
- **Pre-Disbursement Validation**: Validasi menyeluruh sebelum dana diterbitkan
- **Audit Trail**: Pencatatan lengkap setiap tahapan pencairan
- **Reconciliation**: Rekonsiliasi dengan sistem perbankan inti
- **Security**: Keamanan tinggi untuk proses pencairan dana
- **Compliance**: Kepatuhan terhadap prosedur operasional dan regulasi

## Tahapan Pencairan

### 1. Pre-Disbursement Validation
Validasi menyeluruh sebelum pencairan dilaksanakan.

#### Validasi Dokumen:
- [ ] Akad kredit telah ditandatangani oleh debitur
- [ ] Agunan telah di-_appraise_ dan nilai terverifikasi
- [ ] Dokumen agunan (SKMHT, APHT, dll.) sudah dibuat dan disetujui
- [ ] Asuransi agunan telah aktif (jika diperlukan)
- [ ] Bukti pembayaran premi asuransi
- [ ] Foto agunan telah diambil dan di-upload
- [ ] Surat kuasa (jika diperlukan)

#### Validasi Syarat:
- [ ] Semua syarat pembiayaan telah terpenuhi
- [ ] Kontribusi sendiri debitur telah masuk
- [ ] Izin lingkungan (jika diperlukan) telah diperoleh
- [ ] Verifikasi legalitas usaha/agunan
- [ ] Setoran margin untuk transaksi valuta asing (jika applicable)

#### Validasi Sistem:
- [ ] Status aplikasi adalah DISETUJUI
- [ ] Approval komite (jika diperlukan) telah tercatat
- [ ] Batas wewenang tidak terlampaui
- [ ] Tidak ada notasi atau kecelakaan
- [ ] Sufficient liquidity di treasury
- [ ] Plafon kredit masih tersedia

### 2. Disbursement Preparation
Persiapan eksekusi pencairan.

#### Pembuatan Akad:
- Generate draft akad kredit
- Review dan finalisasi oleh legal
- Tandatangani oleh debitur dan saksi
- Scan dan upload salinan akad

#### Pembuatan Rekening:
- Buka rekening pinjaman baru (jika belum ada)
- Buka rekening angsuran
- Set instruksi pembayaran otomatis (jika applicable)

#### Persiapan Dana:
- Alokasi dana dari treasury
- Proses transfer ke rekening debitur
- Konfirmasi dengan treasury dan accounting

### 3. Disbursement Execution
Eksekusi pencairan dana.

#### Metode Pencairan:
- **Transfer ke Rekening Debitur**: Langsung ke rekening yang tercantum
- **Cek/BG**: Untuk debitur yang tidak memiliki rekening
- **Payroll Deduction**: Potongan gaji (jika applicable)
- **Direct Payment**: Pembayaran langsung ke supplier/penjual agunan

#### Proses Eksekusi:
1. Validasi ulang sebelum eksekusi
2. Authorisasi oleh pejabat yang berwenang
3. Eksekusi transaksi melalui core banking
4. Konfirmasi transaksi ke sistem
5. Pencatatan dalam general ledger

### 4. Post-Disbursement
Aktivitas setelah pencairan.

#### Konfirmasi:
- Kirim notifikasi pencairan kepada debitur
- Konfirmasi penerimaan dana oleh debitur
- Dokumentasi bukti pencairan

#### Dokumentasi:
- Arsipkan seluruh dokumen pencairan
- Update status aplikasi menjadi AKTIF
- Generate jadwal angsuran
- Kirimkan copy akad dan jadwal angsuran kepada debitur

#### Monitoring Handover:
- Transfer ke modul monitoring untuk tracking
- Set first monitoring date
- Inisialisasi early warning system

## Jenis Pencairan

### Berdasarkan Jenis Produk
1. **Kredit Konsumtif**:
   - Pencairan langsung ke rekening debitur
   - Seringkali dalam bentuk tunai atau transfer
   - Relatif cepat (1-2 hari kerja)

2. **Kredit Produktif**:
   - Pencairan bisa langsung ke supplier (cash collateral)
   - Atau secara bertahap sesuai progress proyek
   - Perlu monitoring penggunaan dana

3. **Kredit Modal Kerja**:
   - Pencairan dalam bentuk revolving credit
   - Bisa dilakukan berkali-kali sesuai kebutuhan
   - Seringkali melalui rekening giro khusus

4. **Kredit Investasi**:
   - Pencairan bertahap (tranche)
   - Berdasarkan milestone proyek
   - Perlu verifikasi penggunaan dana

### Berdasarkan Metode
1. **Lumpsum**: Seluruh jumlah diberikan sekaligus
2. **Tranche**: Diberikan secara bertahap
3. **Revolving**: Dapat ditarik kembali setelah dilunasi
4. **Overdraft**: Batas pinjaman yang bisa digunakan sesuai kebutuhan

## Implementasi Teknis

### Basis Data Skema

#### Tabel Pencairan
```sql
CREATE TABLE disbursements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES pengajuan(id) ON DELETE CASCADE,
    akad_id UUID NOT NULL REFERENCES akad(id) ON DELETE CASCADE,
    disbursement_type VARCHAR(50) NOT NULL,  -- FULL, TRANCHE, REVOLVING, OVERDRAFT
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'IDR',
    exchange_rate NUMERIC(10, 6),  -- Jika valuta asing
    amount_idr NUMERIC(15, 2),  -- Nilai dalam IDR
    disbursement_method VARCHAR(50) NOT NULL,  -- TRANSFER, CASH, CHEQUE, DIRECT_PAYMENT
    recipient_type VARCHAR(50) NOT NULL,  -- DEBITUR, SUPPLIER, CONTRACTOR, etc.
    recipient_id UUID,  -- ID recipient (debitur_id atau vendor_id)
    recipient_account VARCHAR(50),  -- Nomor rekening
    recipient_bank VARCHAR(100),
    purpose TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    scheduled_date DATE,
    actual_date TIMESTAMP,
    processed_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    reference_number VARCHAR(100),
    core_banking_ref VARCHAR(100),
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_disbursements_application ON disbursements(application_id);
CREATE INDEX idx_disbursements_akad ON disbursements(akad_id);
CREATE INDEX idx_disbursements_status ON disbursements(status);
CREATE INDEX idx_disbursements_date ON disbursements(scheduled_date, actual_date);
CREATE INDEX idx_disbursements_recipient ON disbursements(recipient_type, recipient_id);
```

#### Tabel Tranche Pencairan
```sql
CREATE TABLE disbursement_tranches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disbursement_id UUID NOT NULL REFERENCES disbursements(id) ON DELETE CASCADE,
    tranche_number INTEGER NOT NULL,
    total_tranches INTEGER NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    release_condition TEXT,
    milestone_date DATE,
    actual_release_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RELEASED', 'CANCELLED')),
    release_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_disbursement_tranches_disbursement ON disbursement_tranches(disbursement_id);
CREATE INDEX idx_disbursement_tranches_status ON disbursement_tranches(status);
```

### Layanan Utama
1. **DisbursementValidationService**:
   - Melakukan validasi pra-pencairan
   - Memeriksa kelengkapan dokumen dan syarat
   - Verifikasi dengan berbagai sistem (agunan, legal, treasury)
   - Approval untuk melanjutkan pencairan

2. **DisbursementExecutionService**:
   - Eksekusi pencairan melalui core banking
   - Manajemen transaksi dan konfirmasi
   - Handling error dan retry
   - Reconciliation dengan core banking

3. **DisbursementTrackingService**:
   - Tracking status pencairan
   - Monitoring transaksi
   - Handling inquiry dan masalah

4. **DisbursementReconciliationService**:
   - Rekonsiliasi dengan core banking
   - Rekonsiliasi dengan general ledger
   - Matching dan exception handling

### API Endpoints
```
# Disbursement Management
GET    /api/v1/applications/{applicationId}/disbursement    # Dapatkan info pencairan untuk aplikasi
POST   /api/v1/applications/{applicationId}/disbursement/initiate # Inisiasi pencairan
GET    /api/v1/disbursements                               # Daftar pencairan
GET    /api/v1/disbursements/{disbursementId}              # Detail pencairan
POST   /api/v1/disbursements/{disbursementId}/execute      # Eksekusi pencairan
POST   /api/v1/disbursements/{disbursementId}/cancel       # Batalkan pencairan
POST   /api/v1/disbursements/{disbursementId}/confirm      # Konfirmasi pencairan

# Tranche Management
GET    /api/v1/disbursements/{disbursementId}/tranches     # Daftar tranche
POST   /api/v1/disbursements/{disbursementId}/tranches     # Tambah tranche
PUT    /api/v1/tranches/{trancheId}                        # Update tranche
POST   /api/v1/tranches/{trancheId}/release                # Release tranche

# Reconciliation
GET    /api/v1/disbursements/reconciliation                # Status rekonsiliasi
POST   /api/v1/disbursements/reconciliation/match          # Match transaksi
```

## Integrasi dengan Komponen Lainnya

### 1. Dengan Core Banking System
- Get customer dan account information
- Create loan account dan Disbursement account
- Posting journal entries
- Process fund transfer
- Generate account statements

### 2. Dengan Treasury Management
- Check fund availability
- Allocate funds for disbursement
- Monitor liquidity
- Fund transfer instructions

### 3. Dengan Collateral Management
- Verify collateral status
- Record lien on collateral
- Generate collateral documents
- Track collateral insurance

### 4. Dengan Document Management
- Store disbursement documents
- Archive signed agreements
- Generate payment vouchers

### 5. Dengan Accounting
- Post journal entries
- Generate accounting entries
- Track accrued interest
- Amortization schedules

## Keamanan dan Kontrol

### Segregation of Duties
- **Preparer**: Mempersiapkan disbursement
- **Approver**: Menyetujui disbursement
- **Executor**: Mengeksekusi disbursement (dalam core banking)
- **Reconciler**: Melakukan rekonsiliasi

### Approval Matrix
| Amount Range | Preparer | Approver Level 1 | Approver Level 2 | Executor |
|-------------|----------|-------------------|-------------------|----------|
| < Rp 100 Jt | AO | KABID | - | Treasury |
| Rp 100 Jt - 500 Jt | Analis | KABID | - | Treasury |
| Rp 500 Jt - 1 Miliar | Analis | Direktur Keuangan | - | Treasury + Director |
| > Rp 1 Miliar | Analis | Direktur Keuangan | Direktur Utama | Treasury + Dual Control |

### Dual Control
- Large disbursements require two authorizations
- Split knowledge for high-value transactions
- Independent verification for critical disbursements

## Monitoring dan Reporting

### Real-Time Monitoring
- Dashboard status pencairan
- Alert untuk anomaly
- Limit monitoring
- Fraud detection

### Reporting
- **Daily**: Disbursement register
- **Weekly**: Disbursement summary by product
- **Monthly**: Reconciliation report, aging analysis
- **Ad-hoc**: Specific investigation reports

## Kesimpulan
Modul Disbursement memastikan bahwa pencairan dana kredit dilaksanakan dengan aman, akurat, dan sesuai dengan prosedur yang telah ditetapkan. Proses yang terkontrol dengan baik ini melindungi bank dari risiko kerugian dan memastikan kepatuhan terhadap regulasi yang berlaku.