-- ============================================================
-- Phase 3 Tables: Monitoring, Pembayaran, Notifikasi, Audit, MAK
-- ============================================================

-- MONITORING (Post-disbursement loan tracking)
CREATE TABLE IF NOT EXISTS monitoring (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pengajuan_id UUID REFERENCES pengajuan(id),
  debitur_id UUID REFERENCES debitur(id),
  plafon_disetujui DECIMAL(15,2),
  tanggal_pencairan DATE,
  jangka_waktu_bulan INTEGER,
  tanggal_jatuh_tempo DATE,
  sisa_bulan INTEGER,
  angsuran_perbulan DECIMAL(15,2),
  total_angsuran_dibayar DECIMAL(15,2) DEFAULT 0,
  total_tunggakan DECIMAL(15,2) DEFAULT 0,
  kolektibilitas INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'AKTIF', -- AKTIF/LUNAS/MACET/RESTRUKTUR
  catatan TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- PEMBAYARAN ANGSURAN (Installment payment records)
CREATE TABLE IF NOT EXISTS pembayaran (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monitoring_id UUID REFERENCES monitoring(id),
  angsuran_ke INTEGER,
  tanggal_jatuh_tempo DATE,
  tanggal_bayar DATE,
  jumlah_angsuran DECIMAL(15,2),
  jumlah_dibayar DECIMAL(15,2),
  denda DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'BELUM', -- BELUM/TEPAT_WAKTU/TERLAMBAT/TUNGGAK
  catatan TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- NOTIFIKASI (In-app + WA notifications)
CREATE TABLE IF NOT EXISTS notifikasi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  message TEXT,
  type VARCHAR(30), -- PENGAJUAN/APPROVAL/SURVEY/SCORING/MONITORING/SYSTEM
  reference_id UUID,
  reference_type VARCHAR(30),
  is_read BOOLEAN DEFAULT false,
  wa_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AUDIT LOG (Full audit trail for SPI)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  user_name VARCHAR(100),
  action VARCHAR(50) NOT NULL, -- CREATE/UPDATE/DELETE/LOGIN/LOGOUT/APPROVE/REJECT/GENERATE_MAK
  module VARCHAR(50),
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- MAK (Memorandum Analisa Kredit)
CREATE TABLE IF NOT EXISTS mak (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pengajuan_id UUID REFERENCES pengajuan(id),
  nomor_mak VARCHAR(50) UNIQUE NOT NULL,
  generated_by UUID REFERENCES users(id),
  generated_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'FINAL',
  data_snapshot JSONB, -- full snapshot of all credit analysis data at generation time
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_monitoring_pengajuan ON monitoring(pengajuan_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_debitur ON monitoring(debitur_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_status ON monitoring(status);
CREATE INDEX IF NOT EXISTS idx_monitoring_kolektibilitas ON monitoring(kolektibilitas);
CREATE INDEX IF NOT EXISTS idx_pembayaran_monitoring ON pembayaran(monitoring_id);
CREATE INDEX IF NOT EXISTS idx_pembayaran_status ON pembayaran(status);
CREATE INDEX IF NOT EXISTS idx_notifikasi_user ON notifikasi(user_id);
CREATE INDEX IF NOT EXISTS idx_notifikasi_is_read ON notifikasi(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_module ON audit_log(module);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_mak_pengajuan ON mak(pengajuan_id);
