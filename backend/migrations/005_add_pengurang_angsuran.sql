ALTER TABLE analisa_konsumtif ADD COLUMN IF NOT EXISTS pengurang_angsuran DECIMAL(15,2) DEFAULT 0;
ALTER TABLE analisa_produktif ADD COLUMN IF NOT EXISTS pengurang_angsuran DECIMAL(15,2) DEFAULT 0;
