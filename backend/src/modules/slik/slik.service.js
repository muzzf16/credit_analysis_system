const db = require('../../config/database');

// Helpers to safely convert empty strings to null for typed DB columns
const toDate = (v) => (v && String(v).trim() !== '' ? v : null);
const toNum = (v) => (v !== null && v !== undefined && String(v).trim() !== '' ? parseFloat(v) : null);
const toInt = (v) => (v !== null && v !== undefined && String(v).trim() !== '' ? parseInt(v, 10) : null);

async function create(data, userId) {
  const { pengajuanId, debiturId, tanggalSlik, kolektibilitasTertinggi,
    totalFasilitas, totalPlafon, totalBakiDebet, detailSlik, catatan } = data;

  const pId = pengajuanId && pengajuanId.trim() !== '' ? pengajuanId : null;
  const dId = debiturId && debiturId.trim() !== '' ? debiturId : null;

  if (!pId || !dId) {
    throw new Error('pengajuanId dan debiturId wajib diisi dan merupakan UUID valid.');
  }

  const result = await db.query(
    `INSERT INTO slik (pengajuan_id, debitur_id, tanggal_slik, kolektibilitas_tertinggi,
     total_fasilitas, total_plafon, total_baki_debet, detail_slik, catatan, input_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [pId, dId, toDate(tanggalSlik), toInt(kolektibilitasTertinggi),
     toInt(totalFasilitas), toNum(totalPlafon), toNum(totalBakiDebet),
     JSON.stringify(detailSlik || []), catatan || null, userId]
  );
  return result.rows[0];
}

async function getByPengajuanId(pengajuanId) {
  const pId = pengajuanId && pengajuanId.trim() !== '' ? pengajuanId : null;
  if (!pId) return null;
  const result = await db.query('SELECT * FROM slik WHERE pengajuan_id = $1', [pId]);
  return result.rows[0] || null;
}

module.exports = { create, getByPengajuanId };
