const db = require('../../config/database');
const { toNum, toInt, toStr } = require('../../utils/db-helpers');

async function generateNomor() {
  const year = new Date().getFullYear();
  const result = await db.query(
    `SELECT COUNT(*) FROM pengajuan WHERE EXTRACT(YEAR FROM created_at) = $1`, [year]);
  const seq = parseInt(result.rows[0].count) + 1;
  return `BPR/KRD/${year}/${String(seq).padStart(5, '0')}`;
}

async function getAll(page = 1, limit = 10, filters = {}) {
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];

  if (filters.status) { params.push(filters.status); conditions.push(`p.status = $${params.length}`); }
  if (filters.jenisKredit) { params.push(filters.jenisKredit); conditions.push(`p.jenis_kredit = $${params.length}`); }
  if (filters.aoId) { params.push(filters.aoId); conditions.push(`p.ao_id = $${params.length}`); }
  if (filters.search) { params.push(`%${filters.search}%`); conditions.push(`(d.nama ILIKE $${params.length} OR p.nomor_pengajuan ILIKE $${params.length})`); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQ = await db.query(`SELECT COUNT(*) FROM pengajuan p LEFT JOIN debitur d ON p.debitur_id = d.id ${where}`, params);
  const total = parseInt(countQ.rows[0].count);

  const dataQ = await db.query(
    `SELECT p.*, d.nama as debitur_nama, d.no_hp as debitur_hp,
            ao.full_name as ao_nama, an.full_name as analis_nama
     FROM pengajuan p
     LEFT JOIN debitur d ON p.debitur_id = d.id
     LEFT JOIN users ao ON p.ao_id = ao.id
     LEFT JOIN users an ON p.analis_id = an.id
     ${where}
     ORDER BY p.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  return { data: dataQ.rows, total, page, limit };
}

async function getById(id) {
  const result = await db.query(
    `SELECT p.*, d.nama as debitur_nama, d.no_hp as debitur_hp,
            ao.full_name as ao_nama, an.full_name as analis_nama
     FROM pengajuan p
     LEFT JOIN debitur d ON p.debitur_id = d.id
     LEFT JOIN users ao ON p.ao_id = ao.id
     LEFT JOIN users an ON p.analis_id = an.id
     WHERE p.id = $1`, [id]);
  if (result.rows.length === 0) throw { status: 404, message: 'Pengajuan tidak ditemukan.' };

  const pengajuan = result.rows[0];
  // Get related data
  const survey = await db.query('SELECT * FROM survey WHERE pengajuan_id = $1', [id]);
  const agunan = await db.query('SELECT * FROM agunan WHERE pengajuan_id = $1', [id]);
  const slik = await db.query('SELECT * FROM slik WHERE pengajuan_id = $1', [id]);
  const konsumtif = await db.query('SELECT * FROM analisa_konsumtif WHERE pengajuan_id = $1', [id]);
  const produktif = await db.query('SELECT * FROM analisa_produktif WHERE pengajuan_id = $1', [id]);
  const scoring = await db.query('SELECT * FROM credit_scoring WHERE pengajuan_id = $1', [id]);
  const approvals = await db.query(
    `SELECT a.*, u.full_name as approver_nama FROM approval a LEFT JOIN users u ON a.approver_id = u.id WHERE a.pengajuan_id = $1 ORDER BY a.level`, [id]);
  const aiNarrative = await db.query('SELECT * FROM ai_narrative WHERE pengajuan_id = $1', [id]);

  return {
    ...pengajuan,
    survey: survey.rows[0] || null,
    agunan: agunan.rows,
    slik: slik.rows[0] || null,
    analisaKonsumtif: konsumtif.rows[0] || null,
    analisaProduktif: produktif.rows[0] || null,
    scoring: scoring.rows[0] || null,
    approvals: approvals.rows,
    aiNarrative: aiNarrative.rows[0] || null,
  };
}

async function create(data, userId) {
  const nomorPengajuan = await generateNomor();
  const { debiturId, jenisKredit, tujuanKredit, plafonDiajukan, jangkaWaktuBulan, sukuBunga, angsuranPerbulan, sistemAngsuran } = data;

  const result = await db.query(
    `INSERT INTO pengajuan (nomor_pengajuan, debitur_id, jenis_kredit, tujuan_kredit, plafon_diajukan, jangka_waktu_bulan, suku_bunga, angsuran_perbulan, sistem_angsuran, status, ao_id, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'DIAJUKAN',$10,$11) RETURNING *`,
    [nomorPengajuan, debiturId, toStr(jenisKredit), toStr(tujuanKredit), toNum(plafonDiajukan), toInt(jangkaWaktuBulan), toNum(sukuBunga), toNum(angsuranPerbulan), (sistemAngsuran || 'FLAT'), userId, userId]
  );
  return result.rows[0];
}

async function updateStatus(id, status, userId) {
  const result = await db.query(
    `UPDATE pengajuan SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  if (result.rows.length === 0) throw { status: 404, message: 'Pengajuan tidak ditemukan.' };
  return result.rows[0];
}

async function assignAnalis(id, analisId) {
  const result = await db.query(
    `UPDATE pengajuan SET analis_id = $1, status = 'ANALISA', updated_at = NOW() WHERE id = $2 RETURNING *`,
    [analisId, id]
  );
  return result.rows[0];
}

module.exports = { getAll, getById, create, updateStatus, assignAnalis };
