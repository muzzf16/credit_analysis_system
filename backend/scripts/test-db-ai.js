require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: 5435, // local DB port mapped in docker
  database: 'bpr_bapera',
  user: 'postgres',
  password: 'BprBapera@2024',
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, nomor_pengajuan, status, jenis_kredit FROM pengajuan LIMIT 5');
    console.log('Pengajuan records found:', res.rows);
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
