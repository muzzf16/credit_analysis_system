# DOMAIN_MODEL.md

# Domain Model - Sistem Analisa Kredit PT BPR BAPERA BATANG

## Overview
This document defines the core domain model for the Credit Analysis System, encompassing the key entities, relationships, and business concepts that form the foundation of the system.

## Core Domains

### 1. Customer Management
Entities that represent the individuals and entities seeking credit.

#### Debitur (Borrower)
- **Attributes**: id, nik, nama, tanggal_lahir, jenis_kelamin, alamat, telepon, email, pekerjaan, pendapatan_perbulan, status_pernikahan, jumlah_tanggungan
- **Relationships**: 
  - One-to-Many with Pengajuan (a debtor can have multiple loan applications)
  - One-to-Many with Pasangan (if married)
  - One-to-Many with Pekerjaan (employment history)
  - One-to-Many with Usaha (business information)

#### Pasangan (Spouse)
- **Attributes**: id, debitur_id, nik, nama, tanggal_lahir, pekerjaan, pendapatan_perbulan
- **Relationships**: Many-to-One with Debitur

#### Pekerjaan (Employment)
- **Attributes**: id, debitur_id, nama_perusahaan, jabatan, masa_kerja, alamat, telepon
- **Relationships**: Many-to-One with Debitur

#### Usaha (Business)
- **Attributes**: id, debitur_id, nama_usaha, jenis_usaha, alamat_usaha, luas_usaha, lama_berdiri, omzet_perbulan, laba_perbulan
- **Relationships**: Many-to-One with Debitur

### 2. Loan Application
Entities representing credit applications and their processing.

#### Pengajuan (Loan Application)
- **Attributes**: id, debitur_id, produk_id, jumlah_pinjaman, tenor, tujuan, tanggal_pengajuan, status, nilai_tukar (if applicable)
- **Relationships**: 
  - Many-to-One with Debitur
  - Many-to-One with Produk (Loan Product)
  - One-to-Many with Survey
  - One-to-Many with Dokumen
  - One-to-Many with Analisa (various analysis types)
  - One-to-Many with Approval
  - One-to-One with CreditScoring

#### Produk (Loan Product)
- **Attributes**: id, kode, nama, deskripsi, bunga_min, bunga_maks, tenor_min, tenor_maks, jumlah_min, jumlah_maks, jenis (konsumtif/produktif), aktif
- **Relationships**: 
  - One-to-Many with Pengajuan
  - Many-to-Many with KebijakanPolicy (through policy mapping)

### 3. Survey and Verification
Field verification data collected by Account Officers.

#### Survey
- **Attributes**: id, pengajuan_id, ao_id, tanggal_survey, jenis_survey (umum/usaha/lingkungan), status
- **Relationships**: 
  - Many-to-One with Pengajuan
  - Many-to-One with AO (Account Officer)
  - One-to-One with SurveyLingkungan
  - One-to-One with SurveyUsaha

#### SurveyLingkungan (Environmental Survey)
- **Attributes**: id, survey_id, kondisi_lingkungan, kondisi_keamanan, aksesibilitas, fasilitas_umum
- **Relationships**: One-to-One with Survey

#### SurveyUsaha (Business Survey)
- **Attributes**: id, survey_id, lokasi_usaha, kondisi_tempat_usaha, lama_berdiri_usaha, jenis_usaha_detail, skala_usaha, omzet_perhari_estimasi, jumlah_karyawan
- **Relationships**: One-to-One with Survey

### 4. Document Management
Handling of documents submitted by applicants.

#### Dokumen
- **Attributes**: id, pengajuan_id, jenis_dokumen (ktp/kk/npwp/slip_gaji/tabungan/etc), nama_file, path_file, ukuran_file, tipe_file, tanggal_upload, status_verifikasi
- **Relationships**: Many-to-One with Pengajuan

#### Agunan (Collateral)
- **Attributes**: id, pengajuan_id, jenis_agunan, deskripsi, nilai_agamas, nilai_pasar, rasio_pinjam_nilai, lokasi, status
- **Relationships**: Many-to-One with Pengajuan
- **Related**: AgunanFoto (photos of collateral)

#### AgunanFoto
- **Attributes**: id, agunan_id, nama_file, path_file, keterangan
- **Relationships**: Many-to-One with Agunan

### 5. Financial Analysis
Analysis of financial statements and financial health.

#### AnalisaKonsumtif (Consumer Credit Analysis)
- **Attributes**: id, pengajuan_id, total_penghasilan, total_pengeluaran, pendapatan_bersih, depreciasi, dsr, rpc, keterangan
- **Relationships**: One-to-One with Pengajuan

#### AnalisaProduktif (Productive Credit Analysis)
- **Attributes**: id, pengajuan_id, omzet, hpp, laba_kotor, laba_bersih, gpm, npm, dscr, arus_kas, working_capital, keterangan
- **Relationships**: One-to-One with Pengajuan

### 6. Credit Scoring and Risk Assessment
Evaluation of creditworthiness and risk levels.

#### CreditScoring
- **Attributes**: id, pengajuan_id, skor_karakter, skor_kapasitas, skor_modal, skor_jaminan, skor_condisi, total_score, rating, rekomendasi
- **Relationships**: One-to-One with Pengajuan

#### SLIK (Sistem Informasi Layanan Kredit)
- **Attributes**: id, nik, nama, riwayat_pinjaman, riwayat_tunggakan, tanggal_laporan, status
- **Relationships**: One-to-One with Debitur (through NIK)

### 7. Decision and Approval
Workflow for credit approval decisions.

#### Approval
- **Attributes**: id, pengajuan_id, approver_id, level_approvan, beslut, catatan, tanggal_keputusan
- **Relationships**: Many-to-One with Pengajuan, Many-to-One with User (approver)

#### Komite (Credit Committee)
- **Attributes**: id, nama, deskripsi, aktif
- **Relationships**: Many-to-Many with Pengajuan (through KomiteApproval)

#### KomiteApproval
- **Attributes**: id, pengajuan_id, komite_id, keputusan, tanggal_rapat, catatan
- **Relationships**: Many-to-One with Pengajuan, Many-to-One with Komite

### 8. Policy and Rule Management
Business rules and credit policies that govern decisions.

#### Rule
- **Attributes**: id, kode_rule, nama_rule, deskripsi, kategori, produk_id, prioritas, operator, nilai_ambang, rekomendasi, penjelasan, versi, tanggal_efektif, tanggal_ekspirasi, status
- **Relationships**: 
  - Many-to-One with Produk
  - Many-to-Many with KebijakanPolicy (through policy mapping)

#### KebijakanPolicy (Policy)
- **Attributes**: id, kode_kebijakan, nama_kebijakan, deskripsi, jenis_kebijakan, produk_ids, segmen_pelanggan_ids, tanggal_efektif, tanggal_ekspirasi, status, versi, kebijakan_induk_id
- **Relationships**:
  - Many-to-Many with Produk
  - Many-to-Many with SegmenPelanggan
  - Self-referencing (hierarchical policies)
  - Many-to-Many with Rule (through policy mapping)

### 9. Disbursement and Administration
Post-approval processes for loan disbursement and management.

#### Akad (Credit Agreement)
- **Attributes**: id, pengajuan_id, nomor_akad, tanggal_akad, bunga_aktual, angsuran_perbulan, total_pembayaran, tanggal_tempo, status
- **Relationships**: One-to-One with Pengajuan

#### Pembayaran (Repayment)
- **Attributes**: id, akad_id, nomor_angsuran, tanggal_jatuh_tempo, tanggal_bayar, jumlah_angsuran, denda, saldo
- **Relationships**: Many-to-One with Akad

#### Pencairan (Disbursement)
- **Attributes**: id, akad_id, jumlah_pencairan, tanggal_pencairan, metode_pencairan, status
- **Relationships**: One-to-One with Akad

### 10. Monitoring and Early Warning
Ongoing tracking of loan performance and risk detection.

#### Monitoring
- **Attributes**: id, akad_id, tanggal_monitoring, status_pembayaran, keterlambatan, catatan
- **Relationships**: Many-to-One with Akad

#### EWS (Early Warning System)
- **Attributes**: id, akad_id, indikator_risiko, nilai_indikator, threshold, status_alert, tanggal_deteksi
- **Relationships**: Many-to-One with Akad

### 11. Knowledge Management
Organizational knowledge and policies that inform decisions.

#### DokumenKnowledge
- **Attributes**: id, judul, kategori, nomor_dokumen, versi, tanggal_efektif, file_path, deskripsi
- **Relationships**: Standalone (referenced by various processes)

### 12. Reporting and Analytics
Business intelligence and reporting capabilities.

#### Laporan
- **Attributes**: id, jenis_laporan, periode, parameter, tanggal_generate, file_path, status
- **Relationships**: Standalone (generated from various entities)

#### Dashboard
- **Attributes**: id, nama, deskripsi, konfigurasi_widget, aktif
- **Relationships**: Standalone

### 13. Audit and Compliance
Tracking of all system activities for compliance and security.

#### AuditLog
- **Attributes**: id, entitas, entitas_id, operasi, nilai_sebelum, nilai_sesudah, pengguna_id, timestamp, alamat_ip
- **Relationships**: 
  - Polymorphic to various entities (entitas, entitas_id)
  - Many-to-One with User (pengguna_id)

## Value Objects

### Alamat (Address)
- Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten, Provinsi, KodePos

### Kontak (Contact)
- TeleponRumah, TeleponSeluler, Email, MediaSosial

### PeriodeTanggal (Date Range)
- TanggalMulai, TanggalSelesai

### JumlahUang (Monetary Amount)
- Nilai, MataUang (default: IDR)

### Persentase (Percentage)
- Nilai, Desimal

## Enumerations

### JenisKelamin
- LAKI_LAKI, PEREMPUAN

### StatusPerkawinan
- BELUM_KAWIN, KAWIN, CERAI_HIDUP, CERAI_MATI

### JenisProduk
- KONSUMTIF, PRODUKTIF

### StatusPengajuan
- DRAFT, DIAJUKAN, DIVERIFIKASI, DI_SURVEY, DI_ANALIS, DI_UNDERWRITING, DI_KOMITE, DISETUJUI, DITOLAK, DICABUT

### JenisSurvey
- UMUM, USAHA, LINGKUNGAN

### JenisDokumen
- KTP, KK, NPWP, SLIP_GAJI, TABUNGAN, REKENING_KORANTA, AKTA, SERTIFIKAT, SKU, SIUP, NPWP_USHA, etc.

### JenisAgunan
- TANAH, BANGUNAN, KENDERAAN, PERALATAN_PERKANTORAN, PERKAKASAN_USHA, SERTIFIKAT, DEPOSITO, GOLD, ASURANSI

### RatingKredit
- A (90-100), B (80-89), C (70-79), D (60-69), E (<60)

### Keputusan
- SETUJUI, TOLAK, PERLU_TINJAUAN, PERLU_REVISI

### StatusAktif
- AKTIF, TIDAK_AKTIF, SEDANG_DIREVIEW

## Business Rules and Constraints

### 1. Borrower Eligibility
- Minimum age: 17 years (with parental consent) or 21 years (independent)
- Maximum age: 65 years at loan maturity
- Minimum income: Based on product type and regional minimum wage
- Maximum debt-to-income ratio: 40% for consumer, varies for productive

### 2. Loan Limits
- Minimum and maximum loan amounts defined per product
- Maximum tenor defined per product
- Loan-to-value (LTV) ratios vary by collateral type:
  - Property: max 70-80%
  - Vehicle: max 70-80%
  - Equipment/machinery: max 50-70%
  - Gold: max 70-80%
  - Savings/deposits: max 90-95%

### 3. Documentation Requirements
- Identity documents (KTP, KK) always required
- Income proof required for all loans
- Business documents required for productive loans
- Collateral documents required for secured loans
- Spousal consent required for married applicants (if applicable)

### 4. Approval Hierarchy
- Approval limits based on loan amount and product type
- Joint approval required for amounts exceeding individual limits
- Committee approval required for amounts above management limits
- Final approval by Board of Directors for exceptionally large exposures

### 5. Risk Limits
- Single borrower exposure limit: % of bank capital
- Sector concentration limits
- Product portfolio limits
- Geographic concentration limits

## Relationships Summary

```
Debitur 
  ├─ HasOne ←→ Pengajuan (many)
  ├─ HasOne ←→ Pasangan (many)
  ├─ HasOne ←→ Pekerjaan (many)
  ├─ HasOne ←→ Usaha (many)
  └─ HasOne ←→ SLIK (one)

Pengajuan
  ├─ BelongsTo → Debitur
  ├─ BelongsTo → Produk
  ├─ HasMany ←→ Survey
  ├─ HasMany ←→ Dokumen
  ├─ HasMany ←→ Agunan
  ├─ HasOne ←→ AnalisaKonsumtif
  ├─ HasOne ←→ AnalisaProduktif
  ├─ HasOne ←→ CreditScoring
  ├─ HasMany ←→ Approval
  ├─ HasOne ←→ Akad
  └─ HasMany ←→ Komite (via KomiteApproval)

Survey
  ├─ BelongsTo → Pengajuan
  ├─ BelongsTo → AO
  ├─ HasOne ←→ SurveyLingkungan
  └─ HasOne ←→ SurveyUsaha

Dokumen
  └─ BelongsTo → Pengajuan

Agunan
  └─ BelongsTo → Pengajuan
  └─ HasMany ←→ AguanFoto

AnalisaKonsumtif
  └─ BelongsTo → Pengajuan

AnalisaProduktif
  └─ BelongsTo → Pengajuan

CreditScoring
  └─ BelongsTo → Pengajuan

Akad
  ├─ BelongsTo → Pengajuan
  ├─ HasMany ←→ Pembayaran
  └─ HasOne ←→ Pencairan

Pembayaran
  └─ BelongsTo → Akad

Pencairan
  └─ BelongsTo → Akad

Monitoring
  └─ BelongsTo → Akad

EWS
  └─ BelongsTo → Akad

Approval
  ├─ BelongsTo → Pengajuan
  └─ BelongsTo → User

KomiteApproval
  ├─ BelongsTo → Pengajuan
  └─ BelongsTo → Komite

Rule
  ├─ BelongsTo → Produk
  └─ HasMany ←→ KebijakanPolicy (via policy mapping)

KebijakanPolicy
  ├─ HasMany ←→ Produk
  ├─ HasMany ←→ SegmenPelanggan
  ├─ Self-referencing (parent/child)
  └─ HasMany ←→ Rule (via policy mapping)

AuditLog
  ├─ MorphTo → Various entities (polymorphic)
  └─ BelongsTo → User
```

## Domain Events

Significant business occurrences that trigger side effects or notifications:

1. **PengajuanDiajukan** - When a loan application is submitted
2. **SurveySelesai** - When field survey is completed
3. **AnalisaSelesai** - When financial/business analysis is completed
4. **ScoringSelesai** - When credit scoring is completed
5. **KeputusanDisetujui** - When loan application is approved
6. **KeputusanDitolak** - When loan application is rejected
7. **AkadDitetapkan** - When credit agreement is signed
8. **PencairanDilakukan** - When loan is disbursed
9. **PembayaranJatuhTempo** - When payment is due
10. **PembayaranDiterima** - When payment is received
11. **TerjadiTerlambat** - When payment becomes late
12. **StatusBerubah** - When account status changes
13. **LimitMelebihi** - When exposure exceeds established limits
14. **IndikatorResikoTerDeteksi** - When EWS detects risk indicators

## Integration Points

### Internal Systems
- **Core Banking System**: For customer master data, account opening, and ledger posting
- **Accounting System**: For financial posting of loans, interest, and fees
- **Card Management System**: For credit card products (if applicable)
- **Treasury System**: For fund transfer and liquidity management

### External Systems
- **SLIK (OJK)**: For credit inquiry and reporting
- **BI Checking**: For bank Indonesia checks
- **Civil Registry (Disdukcapil)**: For identity verification
- **Tax Authority**: For NPWP validation
- **Land Agency (BPN)**: For land title verification
- **Notary**: For deed creation and validation
- **Insurance Companies**: For collateral insurance verification
- **Auction Services**: For collateral liquidation (if needed)
- **Credit Bureau**: For additional credit information
- **Tax Court**: For tax lien checking
- **General Court**: For civil/criminal case checking

## Security Considerations

### Data Classification
- **Public**: Product information, general bank information
- **Internal**: Operational procedures, internal guidelines
- **Confidential**: Customer personal data, financial information
- **Strictly Confidential**: Credit reports, detailed financial statements, collateral valuations

### Access Control
- Role-based access control (RBAC) implemented at entity and field level
- Field-level encryption for sensitive data (NIK, account numbers, etc.)
- Audit trail for all access to sensitive data
- Data loss prevention (DLP) controls for export/restriction of sensitive data

### Data Retention
- Active loan data: Retained for life of loan + 7 years after closure
- Archived loan data: Retained for 10 years after closure per OJK requirements
- Application data (rejected/withdrawn): Retained for 5 years
- Operational logs: Retained for 2 years
- Security logs: Retained for 1 year

## Performance Characteristics

### Data Volume Expectations
- New loan applications per month: 1,000-5,000
- Active loan portfolio: 10,000-50,000 accounts
- Documents per application: 5-20
- Survey records per application: 1-3
- Analysis records per application: 2-4
- Payment transactions per active loan: 12-60 per year
- Monitoring records per active loan: 1-12 per year

### Peak Load Conditions
- Month-end processing: 3x normal volume
- Quarterly reporting: 5x normal volume
- Annual financial closing: 10x normal volume
- Promotional periods: 2-4x normal volume

### Response Time Requirements
- Application submission: < 2 seconds
- Document upload: < 5 seconds
- Survey data entry: < 3 seconds
- Analysis computation: < 10 seconds
- Credit scoring: < 15 seconds
- Rule evaluation: < 2 seconds
- Policy determination: < 2 seconds
- Dashboard refresh: < 5 seconds

## Evolution and Extensibility

### Extension Points
- **Product Types**: New loan products can be added via configuration
- **Risk Models**: Alternative scoring models can be plugged in
- **Decision Engines**: Additional decision criteria can be added via rules
- **Reporting Templates**: New report formats can be added via template management
- **Integration Adapters**: New external system connections can be added via adapter pattern

### Versioning Strategy
- **Semantic Versioning**: MAJOR.MINOR.PATCH for API and database changes
- **Backward Compatibility**: MINOR and PATCH releases must be backward compatible
- **Migration Scripts**: All database changes require forward and backward migration scripts
- **API Versioning**: URL versioning (/api/v1/, /api/v2/, etc.) for breaking changes

---
*Document ini adalah bagian dari Living Specification untuk Sistem Analisa Kredit PT BPR BAPERA BATANG. 
Diperbarui terakhir: 2026-06-27*