/**
 * Database Seed Script
 * Runs all .sql files in seeds/ directory in order
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bpr_bapera',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function seed() {
  const client = await pool.connect();
  try {
    const seedsDir = path.join(__dirname, '..', 'seeds');
    const files = fs.readdirSync(seedsDir).filter(f => f.endsWith('.sql')).sort();

    console.log(`Found ${files.length} seed file(s)`);
    for (const file of files) {
      console.log(`Running seed: ${file}`);
      const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');
      await client.query(sql);
      console.log(`✓ ${file} completed`);
    }
    console.log('All seeds completed successfully.');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
