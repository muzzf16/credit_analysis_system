-- ============================================================
-- Add sistem_angsuran column to pengajuan table
-- ============================================================
ALTER TABLE pengajuan ADD COLUMN IF NOT EXISTS sistem_angsuran VARCHAR(20) DEFAULT 'FLAT';