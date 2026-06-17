-- ============================================================
-- BPR BAPERA BATANG - Sistem Analisa Kredit
-- Initial Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: roles
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role_id INTEGER REFERENCES roles(id),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: debitur
-- ============================================================
CREATE TABLE IF NOT EXISTS debitur (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nik VARCHAR(255) NOT NULL,
  nik_hash VARCHAR(64),
  nama VARCHAR(100) NOT NULL,
  tempat_lahir VARCHAR(100),
  tanggal_lahir DATE,
  gender VARCHAR(10),
  status_nikah VARCHAR(20),
  pendidikan VARCHAR(20),
  agama VARCHAR(20),
  alamat TEXT,
  kelurahan VARCHAR(100),
  kecamatan VARCHAR(100),
  kabupaten VARCHAR(100),
  kode_pos VARCHAR(10),
  no_hp VARCHAR(255),
  no_telp VARCHAR(255),
  email VARCHAR(100),
  ao_id UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: pasangan
-- ============================================================
CREATE TABLE IF NOT EXISTS pasangan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debitur_id UUID REFERENCES debitur(id) ON DELETE CASCADE,
  nik VARCHAR(255),
  nama VARCHAR(100),
  tempat_lahir VARCHAR(100),
  tanggal_lahir DATE,
  pendidikan VARCHAR(20),
  pekerjaan VARCHAR(100),
  no_hp VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: pekerjaan
-- ============================================================
CREATE TABLE IF NOT EXISTS pekerjaan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debitur_id UUID REFERENCES debitur(id) ON DELETE CASCADE,
  jenis_pekerjaan VARCHAR(50),
  nama_instansi VARCHAR(200),
  jabatan VARCHAR(100),
  masa_kerja_tahun INTEGER,
  alamat_kantor TEXT,
  no_telp_kantor VARCHAR(20),
  gaji_pokok DECIMAL(15,2),
  tunjangan DECIMAL(15,2),
  penghasilan_lain DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: usaha
-- ============================================================
CREATE TABLE IF NOT EXISTS usaha (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debitur_id UUID REFERENCES debitur(id) ON DELETE CASCADE,
  nama_usaha VARCHAR(200),
  jenis_usaha VARCHAR(100),
  lama_usaha_tahun INTEGER,
  alamat_usaha TEXT,
  kelurahan_usaha VARCHAR(100),
  kecamatan_usaha VARCHAR(100),
  omset_bulanan DECIMAL(15,2),
  omset_tahunan DECIMAL(15,2),
  jumlah_karyawan INTEGER,
  status_tempat_usaha VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: pengajuan
-- ============================================================
CREATE TABLE IF NOT EXISTS pengajuan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nomor_pengajuan VARCHAR(50) UNIQUE NOT NULL,
  debitur_id UUID REFERENCES debitur(id),
  jenis_kredit VARCHAR(20) NOT NULL,
  tujuan_kredit TEXT,
  plafon_diajukan DECIMAL(15,2) NOT NULL,
  jangka_waktu_bulan INTEGER NOT NULL,
  suku_bunga DECIMAL(5,2),
  angsuran_perbulan DECIMAL(15,2),
  status VARCHAR(30) DEFAULT 'DRAFT',
  ao_id UUID REFERENCES users(id),
  analis_id UUID REFERENCES users(id),
  catatan TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: survey
-- ============================================================
CREATE TABLE IF NOT EXISTS survey (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pengajuan_id UUID REFERENCES pengajuan(id),
  ao_id UUID REFERENCES users(id),
  tanggal_survey DATE,
  status VARCHAR(20) DEFAULT 'DRAFT',
  kesimpulan TEXT,
  rekomendasi TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: survey_lingkungan
-- ============================================================
CREATE TABLE IF NOT EXISTS survey_lingkungan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID REFERENCES survey(id) ON DELETE CASCADE,
  karakter_debitur INTEGER CHECK (karakter_debitur BETWEEN 1 AND 5),
  karakter_keterangan TEXT,
  hubungan_sosial INTEGER CHECK (hubungan_sosial BETWEEN 1 AND 5),
  hubungan_keterangan TEXT,
  status_kepemilikan_rumah VARCHAR(50),
  kondisi_rumah VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  alamat_survey TEXT,
  foto_rumah JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: survey_usaha
-- ============================================================
CREATE TABLE IF NOT EXISTS survey_usaha (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID REFERENCES survey(id) ON DELETE CASCADE,
  jenis_usaha VARCHAR(100),
  lama_usaha_tahun INTEGER,
  jam_operasional VARCHAR(100),
  jumlah_karyawan INTEGER,
  omset_harian DECIMAL(15,2),
  omset_bulanan DECIMAL(15,2),
  hpp_bulanan DECIMAL(15,2),
  biaya_operasional DECIMAL(15,2),
  laba_bersih_bulanan DECIMAL(15,2),
  supplier TEXT,
  pelanggan_utama TEXT,
  kompetitor TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  foto_usaha JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: agunan
-- ============================================================
CREATE TABLE IF NOT EXISTS agunan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pengajuan_id UUID REFERENCES pengajuan(id),
  jenis_agunan VARCHAR(50),
  deskripsi TEXT,
  nomor_sertifikat VARCHAR(100),
  atas_nama VARCHAR(100),
  luas_tanah DECIMAL(10,2),
  luas_bangunan DECIMAL(10,2),
  nilai_pasar DECIMAL(15,2),
  nilai_njop DECIMAL(15,2),
  nilai_taksasi DECIMAL(15,2),
  nilai_likuidasi DECIMAL(15,2),
  ltv DECIMAL(5,2),
  coverage_ratio DECIMAL(5,2),
  alamat_agunan TEXT,
  kecamatan VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: agunan_foto
-- ============================================================
CREATE TABLE IF NOT EXISTS agunan_foto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agunan_id UUID REFERENCES agunan(id) ON DELETE CASCADE,
  file_path VARCHAR(500),
  file_name VARCHAR(200),
  keterangan VARCHAR(200),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timestamp_foto TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: slik
-- ============================================================
CREATE TABLE IF NOT EXISTS slik (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pengajuan_id UUID REFERENCES pengajuan(id),
  debitur_id UUID REFERENCES debitur(id),
  tanggal_slik DATE,
  kolektibilitas_tertinggi INTEGER,
  total_fasilitas INTEGER,
  total_plafon DECIMAL(15,2),
  total_baki_debet DECIMAL(15,2),
  detail_slik JSONB DEFAULT '[]',
  catatan TEXT,
  input_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: analisa_konsumtif
-- ============================================================
CREATE TABLE IF NOT EXISTS analisa_konsumtif (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pengajuan_id UUID REFERENCES pengajuan(id) UNIQUE,
  gaji_pokok DECIMAL(15,2) DEFAULT 0,
  tunjangan DECIMAL(15,2) DEFAULT 0,
  bonus_rata DECIMAL(15,2) DEFAULT 0,
  usaha_sampingan DECIMAL(15,2) DEFAULT 0,
  pendapatan_pasangan DECIMAL(15,2) DEFAULT 0,
  total_penghasilan DECIMAL(15,2),
  listrik DECIMAL(15,2) DEFAULT 0,
  air DECIMAL(15,2) DEFAULT 0,
  transportasi DECIMAL(15,2) DEFAULT 0,
  pendidikan DECIMAL(15,2) DEFAULT 0,
  cicilan_existing DECIMAL(15,2) DEFAULT 0,
  kebutuhan_rumah_tangga DECIMAL(15,2) DEFAULT 0,
  pengeluaran_lain DECIMAL(15,2) DEFAULT 0,
  total_pengeluaran DECIMAL(15,2),
  disposable_income DECIMAL(15,2),
  angsuran_diajukan DECIMAL(15,2),
  dsr DECIMAL(5,2),
  rpc DECIMAL(5,2),
  max_kredit DECIMAL(15,2),
  status_kelayakan VARCHAR(20),
  catatan TEXT,
  analis_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: analisa_produktif
-- ============================================================
CREATE TABLE IF NOT EXISTS analisa_produktif (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pengajuan_id UUID REFERENCES pengajuan(id) UNIQUE,
  omset_bulan1 DECIMAL(15,2), omset_bulan2 DECIMAL(15,2), omset_bulan3 DECIMAL(15,2),
  rata_omset DECIMAL(15,2),
  hpp_bulan1 DECIMAL(15,2), hpp_bulan2 DECIMAL(15,2), hpp_bulan3 DECIMAL(15,2),
  rata_hpp DECIMAL(15,2),
  biaya_op_bulan1 DECIMAL(15,2), biaya_op_bulan2 DECIMAL(15,2), biaya_op_bulan3 DECIMAL(15,2),
  rata_biaya_op DECIMAL(15,2),
  laba_kotor DECIMAL(15,2),
  laba_bersih DECIMAL(15,2),
  gross_profit_margin DECIMAL(5,2),
  net_profit_margin DECIMAL(5,2),
  dscr DECIMAL(5,2),
  working_capital DECIMAL(15,2),
  break_even_point DECIMAL(15,2),
  roi DECIMAL(5,2),
  laba_bersih_stress_10 DECIMAL(15,2),
  laba_bersih_stress_20 DECIMAL(15,2),
  laba_bersih_stress_30 DECIMAL(15,2),
  dscr_stress_10 DECIMAL(5,2),
  dscr_stress_20 DECIMAL(5,2),
  dscr_stress_30 DECIMAL(5,2),
  status_kelayakan VARCHAR(20),
  catatan TEXT,
  analis_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: credit_scoring
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_scoring (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pengajuan_id UUID REFERENCES pengajuan(id) UNIQUE,
  char_slik INTEGER,
  char_reputasi INTEGER,
  char_karakter_ao INTEGER,
  char_score DECIMAL(5,2),
  char_bobot DECIMAL(5,2) DEFAULT 25,
  cap_dsr INTEGER,
  cap_dscr INTEGER,
  cap_penghasilan INTEGER,
  cap_score DECIMAL(5,2),
  cap_bobot DECIMAL(5,2) DEFAULT 30,
  capital_aset INTEGER,
  capital_equity INTEGER,
  capital_score DECIMAL(5,2),
  capital_bobot DECIMAL(5,2) DEFAULT 15,
  coll_coverage INTEGER,
  coll_marketability INTEGER,
  coll_ltv INTEGER,
  coll_score DECIMAL(5,2),
  coll_bobot DECIMAL(5,2) DEFAULT 20,
  cond_sektor INTEGER,
  cond_prospek INTEGER,
  cond_score DECIMAL(5,2),
  cond_bobot DECIMAL(5,2) DEFAULT 10,
  total_score DECIMAL(5,2),
  grade VARCHAR(2),
  rekomendasi VARCHAR(30),
  keterangan TEXT,
  analis_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: approval
-- ============================================================
CREATE TABLE IF NOT EXISTS approval (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pengajuan_id UUID REFERENCES pengajuan(id),
  level INTEGER NOT NULL,
  approver_id UUID REFERENCES users(id),
  status VARCHAR(20),
  plafon_disetujui DECIMAL(15,2),
  jangka_waktu_disetujui INTEGER,
  catatan TEXT,
  kondisi TEXT,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: komite
-- ============================================================
CREATE TABLE IF NOT EXISTS komite (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pengajuan_id UUID REFERENCES pengajuan(id),
  tanggal_komite DATE,
  pemimpin_komite UUID REFERENCES users(id),
  anggota JSONB DEFAULT '[]',
  keputusan VARCHAR(20),
  plafon_disetujui DECIMAL(15,2),
  syarat_pencairan TEXT,
  risalah TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: mak
-- ============================================================
CREATE TABLE IF NOT EXISTS mak (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pengajuan_id UUID REFERENCES pengajuan(id),
  nomor_mak VARCHAR(50),
  tanggal_mak DATE,
  file_path VARCHAR(500),
  generated_by UUID REFERENCES users(id),
  generated_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'DRAFT',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: dokumen
-- ============================================================
CREATE TABLE IF NOT EXISTS dokumen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referensi_id UUID NOT NULL,
  referensi_tipe VARCHAR(50),
  jenis_dokumen VARCHAR(100),
  file_name VARCHAR(200),
  file_path VARCHAR(500),
  file_size INTEGER,
  mime_type VARCHAR(100),
  is_verified BOOLEAN DEFAULT false,
  catatan TEXT,
  upload_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: notifikasi
-- ============================================================
CREATE TABLE IF NOT EXISTS notifikasi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  judul VARCHAR(200),
  pesan TEXT,
  tipe VARCHAR(50),
  referensi_id UUID,
  referensi_tipe VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: ews (Early Warning System)
-- ============================================================
CREATE TABLE IF NOT EXISTS ews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pengajuan_id UUID REFERENCES pengajuan(id),
  trigger_type VARCHAR(50),
  tanggal_jatuh_tempo DATE,
  jumlah_tunggakan DECIMAL(15,2),
  status_alert VARCHAR(20),
  alert_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50),
  tabel_name VARCHAR(100),
  record_id UUID,
  data_before JSONB,
  data_after JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_debitur_nik ON debitur(nik);
CREATE INDEX IF NOT EXISTS idx_debitur_nama ON debitur(nama);
CREATE INDEX IF NOT EXISTS idx_pengajuan_status ON pengajuan(status);
CREATE INDEX IF NOT EXISTS idx_pengajuan_debitur ON pengajuan(debitur_id);
CREATE INDEX IF NOT EXISTS idx_pengajuan_ao ON pengajuan(ao_id);
CREATE INDEX IF NOT EXISTS idx_pengajuan_nomor ON pengajuan(nomor_pengajuan);
CREATE INDEX IF NOT EXISTS idx_approval_pengajuan ON approval(pengajuan_id);
CREATE INDEX IF NOT EXISTS idx_approval_approver ON approval(approver_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(tabel_name);
CREATE INDEX IF NOT EXISTS idx_notifikasi_user ON notifikasi(user_id);
CREATE INDEX IF NOT EXISTS idx_notifikasi_read ON notifikasi(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_dokumen_ref ON dokumen(referensi_id, referensi_tipe);
CREATE INDEX IF NOT EXISTS idx_survey_pengajuan ON survey(pengajuan_id);
CREATE INDEX IF NOT EXISTS idx_agunan_pengajuan ON agunan(pengajuan_id);
CREATE INDEX IF NOT EXISTS idx_slik_pengajuan ON slik(pengajuan_id);
