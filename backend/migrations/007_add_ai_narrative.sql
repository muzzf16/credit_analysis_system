-- ============================================================
-- Alter table debitur to add fields from Sesi 5 if they don't exist
-- ============================================================
ALTER TABLE debitur ADD COLUMN IF NOT EXISTS ibu_kandung VARCHAR(255);
ALTER TABLE debitur ADD COLUMN IF NOT EXISTS hubungan_bank VARCHAR(100) DEFAULT 'Nasabah Baru';
ALTER TABLE debitur ADD COLUMN IF NOT EXISTS kredit_aktif VARCHAR(100) DEFAULT 'Tidak Ada';

-- ============================================================
-- TABLE: ai_narrative
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_narrative (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pengajuan_id UUID REFERENCES pengajuan(id) ON DELETE CASCADE UNIQUE,
  narrative_data JSONB NOT NULL,
  prompt_context_fingerprint VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_ai_narrative_pengajuan ON ai_narrative(pengajuan_id);
