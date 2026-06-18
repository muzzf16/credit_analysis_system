-- Fix numeric field overflow for analytical percentage and ratio fields

ALTER TABLE analisa_konsumtif ALTER COLUMN dsr TYPE DECIMAL(15,2);
ALTER TABLE analisa_konsumtif ALTER COLUMN rpc TYPE DECIMAL(15,2);

ALTER TABLE analisa_produktif ALTER COLUMN gross_profit_margin TYPE DECIMAL(15,2);
ALTER TABLE analisa_produktif ALTER COLUMN net_profit_margin TYPE DECIMAL(15,2);
ALTER TABLE analisa_produktif ALTER COLUMN dscr TYPE DECIMAL(15,2);

ALTER TABLE analisa_produktif ALTER COLUMN dscr_stress_10 TYPE DECIMAL(15,2);
ALTER TABLE analisa_produktif ALTER COLUMN dscr_stress_20 TYPE DECIMAL(15,2);
ALTER TABLE analisa_produktif ALTER COLUMN dscr_stress_30 TYPE DECIMAL(15,2);

ALTER TABLE agunan ALTER COLUMN ltv TYPE DECIMAL(15,2);
ALTER TABLE agunan ALTER COLUMN coverage_ratio TYPE DECIMAL(15,2);
