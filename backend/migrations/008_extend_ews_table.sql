-- Migration: 008_extend_ews_table.sql
-- Add EWS extensions for Phase 5 requirements

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Fix notifikasi columns if they are still using the old schema from 001_initial_schema.sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifikasi' AND column_name='judul') THEN
    ALTER TABLE notifikasi RENAME COLUMN judul TO title;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifikasi' AND column_name='pesan') THEN
    ALTER TABLE notifikasi RENAME COLUMN pesan TO message;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifikasi' AND column_name='tipe') THEN
    ALTER TABLE notifikasi RENAME COLUMN tipe TO type;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifikasi' AND column_name='referensi_id') THEN
    ALTER TABLE notifikasi RENAME COLUMN referensi_id TO reference_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifikasi' AND column_name='referensi_tipe') THEN
    ALTER TABLE notifikasi RENAME COLUMN referensi_tipe TO reference_type;
  END IF;
END $$;

ALTER TABLE notifikasi ADD COLUMN IF NOT EXISTS wa_sent BOOLEAN DEFAULT false;

ALTER TABLE ews ADD COLUMN IF NOT EXISTS monitoring_id UUID REFERENCES monitoring(id);
ALTER TABLE ews ADD COLUMN IF NOT EXISTS dpd INTEGER DEFAULT 0;
ALTER TABLE ews ADD COLUMN IF NOT EXISTS kolektibilitas INTEGER DEFAULT 1;
ALTER TABLE ews ADD COLUMN IF NOT EXISTS penurunan_omzet BOOLEAN DEFAULT false;
ALTER TABLE ews ADD COLUMN IF NOT EXISTS penurunan_cashflow BOOLEAN DEFAULT false;
ALTER TABLE ews ADD COLUMN IF NOT EXISTS kondisi_agunan VARCHAR(100);
ALTER TABLE ews ADD COLUMN IF NOT EXISTS kunjungan_ao_terakhir DATE;
ALTER TABLE ews ADD COLUMN IF NOT EXISTS risk_score VARCHAR(20) DEFAULT 'LOW'; -- LOW, MEDIUM, HIGH
ALTER TABLE ews ADD COLUMN IF NOT EXISTS rekomendasi TEXT;
ALTER TABLE ews ADD COLUMN IF NOT EXISTS catatan TEXT;
ALTER TABLE ews ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
ALTER TABLE ews ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES users(id);
ALTER TABLE ews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_ews_monitoring ON ews(monitoring_id);
CREATE INDEX IF NOT EXISTS idx_ews_status_alert ON ews(status_alert);
CREATE INDEX IF NOT EXISTS idx_ews_risk_score ON ews(risk_score);
