-- ============================================================
-- TABLE: rule_library
-- ============================================================
CREATE TABLE IF NOT EXISTS rule_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id VARCHAR(20) UNIQUE NOT NULL,
  nama_rule VARCHAR(255) NOT NULL,
  kategori VARCHAR(100),
  produk VARCHAR(100),
  severity VARCHAR(20),
  priority INTEGER,
  expression TEXT,
  operator VARCHAR(20),
  threshold DECIMAL(15,2),
  message TEXT,
  recommendation TEXT,
  version VARCHAR(20) DEFAULT '1.0',
  status VARCHAR(20) DEFAULT 'active',
  effective_date DATE,
  expired_date DATE,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: policy_pack
-- ============================================================
CREATE TABLE IF NOT EXISTS policy_pack (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id VARCHAR(20) UNIQUE NOT NULL,
  nama_policy VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  versi VARCHAR(20) DEFAULT '1.0',
  status VARCHAR(20) DEFAULT 'active',
  effective_date DATE,
  expired_date DATE,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: policy_pack_rule (junction)
-- ============================================================
CREATE TABLE IF NOT EXISTS policy_pack_rule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_pack_id UUID REFERENCES policy_pack(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES rule_library(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rule_library_rule_id ON rule_library(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_library_kategori ON rule_library(kategori);
CREATE INDEX IF NOT EXISTS idx_rule_library_produk ON rule_library(produk);
CREATE INDEX IF NOT EXISTS idx_rule_library_status ON rule_library(status);
CREATE INDEX IF NOT EXISTS idx_policy_pack_policy_id ON policy_pack(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_pack_rule_policy ON policy_pack_rule(policy_pack_id);
CREATE INDEX IF NOT EXISTS idx_policy_pack_rule_rule ON policy_pack_rule(rule_id);
