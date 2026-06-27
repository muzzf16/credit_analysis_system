-- ============================================================
-- TABLE: document_intelligence_jobs
-- ============================================================
CREATE TABLE IF NOT EXISTS document_intelligence_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pengajuan_id UUID REFERENCES pengajuan(id) ON DELETE SET NULL,
  debitur_id UUID REFERENCES debitur(id) ON DELETE SET NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  document_type VARCHAR(50) DEFAULT 'UNKNOWN', -- KTP, KK, NPWP, SHM, BPKB, SURAT_NIKAH, SLIK, SURVEY, UNKNOWN
  status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, CLASSIFYING, PROCESSING_OCR, PARSING, VALIDATING, REVIEW_REQUIRED, COMPLETED, FAILED
  extracted_data JSONB DEFAULT '{}',
  validation_results JSONB DEFAULT '{"is_valid": true, "errors": [], "warnings": []}',
  comparison_results JSONB DEFAULT '{}',
  mapping_status VARCHAR(50) DEFAULT 'UNMAPPED', -- UNMAPPED, MAPPED, SKIPPED
  mapped_entity_type VARCHAR(50), -- debitur, pasangan, agunan, slik, dll
  mapped_entity_id UUID,
  logs JSONB DEFAULT '[]', -- array of logs: [{"timestamp": "...", "status": "...", "message": "..."}]
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_doc_intel_pengajuan ON document_intelligence_jobs(pengajuan_id);
CREATE INDEX IF NOT EXISTS idx_doc_intel_debitur ON document_intelligence_jobs(debitur_id);
CREATE INDEX IF NOT EXISTS idx_doc_intel_status ON document_intelligence_jobs(status);
CREATE INDEX IF NOT EXISTS idx_doc_intel_type ON document_intelligence_jobs(document_type);
