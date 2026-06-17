const db = require('../../config/database');

// ─── LIST ALL MONITORING ──────────────────────────────────────────────────

async function getAll(filters = {}) {
  const { status, kolektibilitas, overdue, page = 1, limit = 20, search } = filters;
  const conditions = [];
  const params = [];
  let paramIdx = 1;

  if (status) {
    conditions.push(`m.status = $${paramIdx++}`);
    params.push(status);
  }
  if (kolektibilitas) {
    conditions.push(`m.kolektibilitas = $${paramIdx++}`);
    params.push(parseInt(kolektibilitas));
  }
  if (overdue === 'true') {
    // Has any pembayaran past due and unpaid
    conditions.push(`EXISTS (
      SELECT 1 FROM pembayaran pb
      WHERE pb.monitoring_id = m.id AND pb.status = 'BELUM' AND pb.tanggal_jatuh_tempo < CURRENT_DATE
    )`);
  }
  if (search) {
    conditions.push(`(d.nama ILIKE $${paramIdx} OR p.nomor_pengajuan ILIKE $${paramIdx})`);
    params.push(`%${search}%`);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const countRes = await db.query(
    `SELECT COUNT(*) FROM monitoring m
     LEFT JOIN debitur d ON m.debitur_id = d.id
     LEFT JOIN pengajuan p ON m.pengajuan_id = p.id
     ${whereClause}`, params
  );
  const total = parseInt(countRes.rows[0].count);

  const safeLimit = Math.min(100, Math.max(1, parseInt(limit)));
  const safePage = Math.max(1, parseInt(page));
  const offset = (safePage - 1) * safeLimit;

  const result = await db.query(
    `SELECT m.*, d.nama as debitur_nama, d.no_hp as debitur_hp, p.nomor_pengajuan, p.jenis_kredit
     FROM monitoring m
     LEFT JOIN debitur d ON m.debitur_id = d.id
     LEFT JOIN pengajuan p ON m.pengajuan_id = p.id
     ${whereClause}
     ORDER BY m.created_at DESC
     LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
    [...params, safeLimit, offset]
  );

  return {
    data: result.rows,
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
      hasNext: safePage * safeLimit < total,
      hasPrev: safePage > 1,
    },
  };
}

// ─── GET BY ID ────────────────────────────────────────────────────────────

async function getById(id) {
  const monRes = await db.query(
    `SELECT m.*, d.nama as debitur_nama, d.nik, d.no_hp as debitur_hp, d.alamat,
            p.nomor_pengajuan, p.jenis_kredit, p.tujuan_kredit
     FROM monitoring m
     LEFT JOIN debitur d ON m.debitur_id = d.id
     LEFT JOIN pengajuan p ON m.pengajuan_id = p.id
     WHERE m.id = $1`, [id]
  );
  if (!monRes.rows[0]) {
    const err = new Error('Data monitoring tidak ditemukan.'); err.status = 404; throw err;
  }

  // Include pembayaran history
  const pembayaranRes = await db.query(
    `SELECT * FROM pembayaran WHERE monitoring_id = $1 ORDER BY angsuran_ke ASC`, [id]
  );

  return {
    ...monRes.rows[0],
    pembayaran: pembayaranRes.rows,
  };
}

// ─── CREATE FROM APPROVED PENGAJUAN (PENCAIRAN) ──────────────────────────

async function create(data) {
  const {
    pengajuanId, debiturId, plafonDisetujui, tanggalPencairan,
    jangkaWaktuBulan, angsuranPerbulan, catatan,
  } = data;

  // Calculate tanggal jatuh tempo
  const pencairanDate = new Date(tanggalPencairan);
  const jatuhTempo = new Date(pencairanDate);
  jatuhTempo.setMonth(jatuhTempo.getMonth() + parseInt(jangkaWaktuBulan));

  const result = await db.query(
    `INSERT INTO monitoring (pengajuan_id, debitur_id, plafon_disetujui, tanggal_pencairan,
     jangka_waktu_bulan, tanggal_jatuh_tempo, sisa_bulan, angsuran_perbulan, catatan)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [pengajuanId, debiturId, plafonDisetujui, tanggalPencairan,
     jangkaWaktuBulan, jatuhTempo.toISOString().split('T')[0],
     parseInt(jangkaWaktuBulan), angsuranPerbulan, catatan]
  );
  const monitoring = result.rows[0];

  // Auto-generate pembayaran schedule (all months with BELUM status)
  for (let i = 1; i <= parseInt(jangkaWaktuBulan); i++) {
    const dueDate = new Date(pencairanDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    await db.query(
      `INSERT INTO pembayaran (monitoring_id, angsuran_ke, tanggal_jatuh_tempo, jumlah_angsuran, status)
       VALUES ($1, $2, $3, $4, 'BELUM')`,
      [monitoring.id, i, dueDate.toISOString().split('T')[0], angsuranPerbulan]
    );
  }

  // Update pengajuan status to CAIR
  await db.query(`UPDATE pengajuan SET status = 'CAIR', updated_at = NOW() WHERE id = $1`, [pengajuanId]);

  return monitoring;
}

// ─── UPDATE MONITORING ────────────────────────────────────────────────────

async function update(id, data) {
  const { status, kolektibilitas, catatan, totalTunggakan } = data;

  const existing = await db.query('SELECT * FROM monitoring WHERE id = $1', [id]);
  if (!existing.rows[0]) {
    const err = new Error('Data monitoring tidak ditemukan.'); err.status = 404; throw err;
  }

  const result = await db.query(
    `UPDATE monitoring SET
     status = COALESCE($1, status),
     kolektibilitas = COALESCE($2, kolektibilitas),
     catatan = COALESCE($3, catatan),
     total_tunggakan = COALESCE($4, total_tunggakan),
     updated_at = NOW()
     WHERE id = $5 RETURNING *`,
    [status, kolektibilitas, catatan, totalTunggakan, id]
  );
  return result.rows[0];
}

// ─── RECORD PAYMENT ──────────────────────────────────────────────────────

async function recordPayment(monitoringId, data, userId) {
  const { angsuranKe, tanggalBayar, jumlahDibayar, denda, catatan } = data;

  // Find the pembayaran record
  const pbRes = await db.query(
    'SELECT * FROM pembayaran WHERE monitoring_id = $1 AND angsuran_ke = $2',
    [monitoringId, angsuranKe]
  );
  if (!pbRes.rows[0]) {
    const err = new Error(`Angsuran ke-${angsuranKe} tidak ditemukan.`); err.status = 404; throw err;
  }

  const pembayaran = pbRes.rows[0];
  const bayarDate = new Date(tanggalBayar);
  const dueDate = new Date(pembayaran.tanggal_jatuh_tempo);

  // Determine payment status
  const diffDays = Math.floor((bayarDate - dueDate) / (1000 * 60 * 60 * 24));
  let paymentStatus;
  if (diffDays <= 0) {
    paymentStatus = 'TEPAT_WAKTU';
  } else if (diffDays <= 30) {
    paymentStatus = 'TERLAMBAT';
  } else {
    paymentStatus = 'TUNGGAK';
  }

  // Update pembayaran
  await db.query(
    `UPDATE pembayaran SET tanggal_bayar = $1, jumlah_dibayar = $2, denda = $3,
     status = $4, catatan = $5, created_by = $6
     WHERE monitoring_id = $7 AND angsuran_ke = $8`,
    [tanggalBayar, jumlahDibayar, denda || 0, paymentStatus, catatan, userId, monitoringId, angsuranKe]
  );

  // Update monitoring totals
  const totalsRes = await db.query(
    `SELECT
       COALESCE(SUM(jumlah_dibayar), 0) as total_dibayar,
       COALESCE(SUM(CASE WHEN status IN ('BELUM','TUNGGAK') AND tanggal_jatuh_tempo < CURRENT_DATE
         THEN jumlah_angsuran ELSE 0 END), 0) as total_tunggakan,
       COUNT(*) FILTER (WHERE status = 'BELUM') as sisa_angsuran
     FROM pembayaran WHERE monitoring_id = $1`, [monitoringId]
  );
  const totals = totalsRes.rows[0];

  // Calculate kolektibilitas based on worst overdue days
  const overdueRes = await db.query(
    `SELECT MAX(CURRENT_DATE - tanggal_jatuh_tempo) as max_overdue_days
     FROM pembayaran
     WHERE monitoring_id = $1 AND status IN ('BELUM','TUNGGAK') AND tanggal_jatuh_tempo < CURRENT_DATE`,
    [monitoringId]
  );
  const maxOverdueDays = parseInt(overdueRes.rows[0]?.max_overdue_days) || 0;

  let kolektibilitas = 1;
  if (maxOverdueDays > 180) kolektibilitas = 5;
  else if (maxOverdueDays > 120) kolektibilitas = 4;
  else if (maxOverdueDays > 90) kolektibilitas = 3;
  else if (maxOverdueDays > 0) kolektibilitas = 2;

  // Determine monitoring status
  let monitoringStatus = 'AKTIF';
  if (parseInt(totals.sisa_angsuran) === 0) monitoringStatus = 'LUNAS';
  else if (kolektibilitas >= 5) monitoringStatus = 'MACET';

  await db.query(
    `UPDATE monitoring SET
     total_angsuran_dibayar = $1, total_tunggakan = $2,
     sisa_bulan = $3, kolektibilitas = $4, status = $5, updated_at = NOW()
     WHERE id = $6`,
    [totals.total_dibayar, totals.total_tunggakan, parseInt(totals.sisa_angsuran), kolektibilitas, monitoringStatus, monitoringId]
  );

  return { paymentStatus, kolektibilitas, monitoringStatus, totals };
}

// ─── SUMMARY STATS ────────────────────────────────────────────────────────

async function getSummary() {
  // Total counts by status
  const statusRes = await db.query(
    `SELECT status, COUNT(*) as count, COALESCE(SUM(plafon_disetujui), 0) as total_plafon
     FROM monitoring GROUP BY status`
  );

  // Kolektibilitas distribution
  const kolRes = await db.query(
    `SELECT kolektibilitas, COUNT(*) as count, COALESCE(SUM(plafon_disetujui), 0) as total_plafon
     FROM monitoring WHERE status = 'AKTIF' GROUP BY kolektibilitas ORDER BY kolektibilitas`
  );

  // NPL calculation (kol 3+4+5 / total aktif)
  const nplRes = await db.query(
    `SELECT
       COALESCE(SUM(CASE WHEN kolektibilitas >= 3 THEN plafon_disetujui ELSE 0 END), 0) as npl_amount,
       COALESCE(SUM(plafon_disetujui), 0) as total_plafon
     FROM monitoring WHERE status = 'AKTIF'`
  );
  const npl = nplRes.rows[0];
  const nplRatio = parseFloat(npl.total_plafon) > 0
    ? (parseFloat(npl.npl_amount) / parseFloat(npl.total_plafon) * 100).toFixed(2)
    : '0.00';

  // Total tunggakan
  const tunggakanRes = await db.query(
    'SELECT COALESCE(SUM(total_tunggakan), 0) as total FROM monitoring WHERE status = $1', ['AKTIF']
  );

  return {
    byStatus: statusRes.rows,
    kolektibilitasDistribusi: kolRes.rows,
    nplRatio: parseFloat(nplRatio),
    nplAmount: parseFloat(npl.npl_amount),
    totalPlafonAktif: parseFloat(npl.total_plafon),
    totalTunggakan: parseFloat(tunggakanRes.rows[0].total),
  };
}

module.exports = { getAll, getById, create, update, recordPayment, getSummary };
