-- ============================================================
-- BPR BAPERA BATANG - Initial Seed Data
-- ============================================================

-- Roles
INSERT INTO roles (name, description, permissions) VALUES
('ADMIN', 'Administrator Sistem', '{"all": true}'),
('DIREKSI', 'Direktur BPR', '{"dashboard": true, "approval": true, "monitoring": true, "reports": true, "pengajuan": true}'),
('KABID', 'Kepala Bidang Kredit', '{"pengajuan": true, "approval": true, "scoring": true, "reports": true, "dashboard": true}'),
('ANALIS', 'Analis Kredit', '{"pengajuan": true, "analisa": true, "scoring": true, "agunan": true, "slik": true, "dashboard": true}'),
('AO', 'Account Officer', '{"debitur": true, "pengajuan": true, "survey": true, "dokumen": true, "dashboard": true}'),
('SPI', 'Satuan Pengawas Internal', '{"audit": true, "reports": true, "monitoring": true, "dashboard": true}')
ON CONFLICT (name) DO NOTHING;

-- Default Admin User
-- Password: Admin@123 (hashed with bcrypt rounds=12)
INSERT INTO users (username, email, password_hash, full_name, role_id)
SELECT 'admin', 'admin@bprbapera.co.id', '$2a$12$XylsFsrek/ba2wDG0FWcZu27A4F0gEL.q76E1VIO8H0fOPD4N8gB.', 'Administrator', r.id
FROM roles r WHERE r.name = 'ADMIN'
ON CONFLICT (username) DO NOTHING;

-- Default DIREKSI User
-- Password: Direksi@123
INSERT INTO users (username, email, password_hash, full_name, role_id)
SELECT 'direksi', 'direksi@bprbapera.co.id', '$2a$12$2VL.2IGNVUIDo3mJfcgHEeMFUdrlgj/Oyb.33W2I3dF1IzETG9kbi', 'Direktur BPR BAPERA', r.id
FROM roles r WHERE r.name = 'DIREKSI'
ON CONFLICT (username) DO NOTHING;

-- Default KABID User
-- Password: Kabid@123
INSERT INTO users (username, email, password_hash, full_name, role_id)
SELECT 'kabid.kredit', 'kabid@bprbapera.co.id', '$2a$12$JLkhY9M5jwG2P3NJU/y5QeM51Q3ffwWoD6ou1MKuSYsVoQQMo21rO', 'Kepala Bidang Kredit', r.id
FROM roles r WHERE r.name = 'KABID'
ON CONFLICT (username) DO NOTHING;

-- Default ANALIS User
-- Password: Analis@123
INSERT INTO users (username, email, password_hash, full_name, role_id)
SELECT 'analis01', 'analis01@bprbapera.co.id', '$2a$12$0JodXLy6FhRUbGzo9nffkeMicbqRb35DiNNDyumQq424G6i8AqR9y', 'Analis Kredit 01', r.id
FROM roles r WHERE r.name = 'ANALIS'
ON CONFLICT (username) DO NOTHING;

-- Default AO User
-- Password: Ao@123456
INSERT INTO users (username, email, password_hash, full_name, role_id)
SELECT 'ao01', 'ao01@bprbapera.co.id', '$2a$12$vqhv.4rLrdh0XldKM3ij5uZZ7b3AiR5SjRqCEgEmvdN4.xtZ7RGSm', 'Account Officer 01', r.id
FROM roles r WHERE r.name = 'AO'
ON CONFLICT (username) DO NOTHING;
