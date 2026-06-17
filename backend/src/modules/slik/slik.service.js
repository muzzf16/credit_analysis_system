const db = require('../../config/database');

async function create(data, userId) {
  const { pengajuanId, debiturId, tanggalSlik, kolektibilitasTertinggi,
    totalFasilitas, totalPlafon, totalBakiDebet, detailSlik, catatan } = data;

  const result = await db.query(
    `INSERT INTO slik (pengajuan_id, debitur_id, tanggal_slik, kolektibilitas_tertinggi,
     total_fasilitas, total_plafon, total_baki_debet, detail_slik, catatan, input_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [pengajuanId, debiturId, tanggalSlik, kolektibilitasTertinggi,
     totalFasilitas, totalPlafon, totalBakiDebet, JSON.stringify(detailSlik || []), catatan, userId]
  );
  return result.rows[0];
}

async function getByPengajuanId(pengajuanId) {
  const result = await db.query('SELECT * FROM slik WHERE pengajuan_id = $1', [pengajuanId]);
  return result.rows[0] || null;
}

module.exports = { create, getByPengajuanId };
