const db = require('../../config/database');

/**
 * Get complete MAK data — combines ALL credit analysis sections for a pengajuan
 */
async function getMakData(pengajuanId) {
  // 1. Pengajuan + Debitur + AO
  const pengajuanRes = await db.query(
    `SELECT p.*, d.nama as debitur_nama, d.nik, d.tempat_lahir, d.tanggal_lahir,
            d.jenis_kelamin, d.alamat, d.kelurahan, d.kecamatan, d.kabupaten, d.provinsi,
            d.kode_pos, d.no_hp, d.email, d.status_pernikahan, d.jumlah_tanggungan,
            u.full_name as ao_nama, u.nip as ao_nip
     FROM pengajuan p
     LEFT JOIN debitur d ON p.debitur_id = d.id
     LEFT JOIN users u ON p.ao_id = u.id
     WHERE p.id = $1`, [pengajuanId]
  );
  if (!pengajuanRes.rows[0]) {
    const err = new Error('Pengajuan tidak ditemukan.'); err.status = 404; throw err;
  }
  const pengajuan = pengajuanRes.rows[0];

  // 2. Pasangan
  const pasanganRes = await db.query('SELECT * FROM pasangan WHERE debitur_id = $1', [pengajuan.debitur_id]);

  // 3. Pekerjaan
  const pekerjaanRes = await db.query('SELECT * FROM pekerjaan WHERE debitur_id = $1', [pengajuan.debitur_id]);

  // 4. Usaha
  const usahaRes = await db.query('SELECT * FROM usaha WHERE debitur_id = $1', [pengajuan.debitur_id]);

  // 5. Survey + sub-tables
  const surveyRes = await db.query('SELECT * FROM survey WHERE pengajuan_id = $1', [pengajuanId]);
  const survey = surveyRes.rows[0] || null;

  let surveyLingkungan = null;
  let surveyUsaha = null;
  if (survey) {
    const lingkunganRes = await db.query('SELECT * FROM survey_lingkungan WHERE survey_id = $1', [survey.id]);
    surveyLingkungan = lingkunganRes.rows[0] || null;
    const usahaSurveyRes = await db.query('SELECT * FROM survey_usaha WHERE survey_id = $1', [survey.id]);
    surveyUsaha = usahaSurveyRes.rows[0] || null;
  }

  // 6. Agunan (all)
  const agunanRes = await db.query('SELECT * FROM agunan WHERE pengajuan_id = $1', [pengajuanId]);

  // 7. SLIK
  const slikRes = await db.query('SELECT * FROM slik WHERE pengajuan_id = $1', [pengajuanId]);

  // 8. Analisa Konsumtif & Produktif
  const konsumtifRes = await db.query('SELECT * FROM analisa_konsumtif WHERE pengajuan_id = $1', [pengajuanId]);
  const produktifRes = await db.query('SELECT * FROM analisa_produktif WHERE pengajuan_id = $1', [pengajuanId]);

  // 9. Credit Scoring
  const scoringRes = await db.query('SELECT * FROM credit_scoring WHERE pengajuan_id = $1', [pengajuanId]);

  // 10. Approval (all levels)
  const approvalRes = await db.query(
    `SELECT a.*, u.full_name as approver_nama, r.name as approver_role
     FROM approval a
     LEFT JOIN users u ON a.approver_id = u.id
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE a.pengajuan_id = $1 ORDER BY a.level, a.created_at`, [pengajuanId]
  );

  // 11. Existing MAK (if already generated)
  const makRes = await db.query('SELECT * FROM mak WHERE pengajuan_id = $1', [pengajuanId]);

  return {
    pengajuan,
    pasangan: pasanganRes.rows[0] || null,
    pekerjaan: pekerjaanRes.rows[0] || null,
    usaha: usahaRes.rows[0] || null,
    survey,
    surveyLingkungan,
    surveyUsaha,
    agunan: agunanRes.rows,
    slik: slikRes.rows[0] || null,
    analisaKonsumtif: konsumtifRes.rows[0] || null,
    analisaProduktif: produktifRes.rows[0] || null,
    creditScoring: scoringRes.rows[0] || null,
    approval: approvalRes.rows,
    mak: makRes.rows[0] || null,
  };
}

/**
 * Generate MAK — creates final record with auto-numbering MAK/YYYY/MM/sequence
 */
async function generateMak(pengajuanId, userId) {
  // Check pengajuan exists and is approved
  const pengajuanRes = await db.query('SELECT id, status FROM pengajuan WHERE id = $1', [pengajuanId]);
  if (!pengajuanRes.rows[0]) {
    const err = new Error('Pengajuan tidak ditemukan.'); err.status = 404; throw err;
  }

  // Check if MAK already exists
  const existingMak = await db.query('SELECT id FROM mak WHERE pengajuan_id = $1', [pengajuanId]);
  if (existingMak.rows[0]) {
    const err = new Error('MAK sudah pernah di-generate untuk pengajuan ini.'); err.status = 400; throw err;
  }

  // Generate nomor MAK: MAK/YYYY/MM/sequence
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `MAK/${year}/${month}/`;

  const seqRes = await db.query(
    `SELECT COUNT(*) as count FROM mak WHERE nomor_mak LIKE $1`, [`${prefix}%`]
  );
  const sequence = String(parseInt(seqRes.rows[0].count) + 1).padStart(4, '0');
  const nomorMak = `${prefix}${sequence}`;

  // Get full data snapshot
  const dataSnapshot = await getMakData(pengajuanId);

  // Insert MAK record
  const result = await db.query(
    `INSERT INTO mak (pengajuan_id, nomor_mak, generated_by, generated_at, status, data_snapshot)
     VALUES ($1, $2, $3, NOW(), 'FINAL', $4) RETURNING *`,
    [pengajuanId, nomorMak, userId, JSON.stringify(dataSnapshot)]
  );

  // Update pengajuan status to FINAL
  await db.query(`UPDATE pengajuan SET status = 'FINAL', updated_at = NOW() WHERE id = $1`, [pengajuanId]);

  return result.rows[0];
}

module.exports = { getMakData, generateMak };
