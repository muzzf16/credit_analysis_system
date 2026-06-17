const db = require('../../config/database');

async function getDireksiDashboard() {
  const totalDebitur = await db.query('SELECT COUNT(*) as total FROM debitur');
  const totalPengajuan = await db.query('SELECT COUNT(*) as total FROM pengajuan');
  const pengajuanDisetujui = await db.query(`SELECT COUNT(*) as total, COALESCE(SUM(plafon_diajukan),0) as outstanding FROM pengajuan WHERE status = 'DISETUJUI'`);
  const pengajuanByStatus = await db.query(`SELECT status, COUNT(*) as total FROM pengajuan GROUP BY status ORDER BY total DESC`);
  const pengajuanByJenis = await db.query(`SELECT jenis_kredit, COUNT(*) as total, SUM(plafon_diajukan) as total_plafon FROM pengajuan GROUP BY jenis_kredit`);

  // Pengajuan per bulan (12 bulan terakhir)
  const perBulan = await db.query(
    `SELECT TO_CHAR(created_at, 'YYYY-MM') as bulan, COUNT(*) as total, SUM(plafon_diajukan) as total_plafon
     FROM pengajuan WHERE created_at >= NOW() - INTERVAL '12 months'
     GROUP BY TO_CHAR(created_at, 'YYYY-MM') ORDER BY bulan`
  );

  // Per AO
  const perAo = await db.query(
    `SELECT u.full_name as ao_nama, COUNT(p.id) as total, SUM(p.plafon_diajukan) as total_plafon
     FROM pengajuan p JOIN users u ON p.ao_id = u.id
     GROUP BY u.full_name ORDER BY total DESC LIMIT 10`
  );

  // Pending approval
  const pendingApproval = await db.query(
    `SELECT p.*, d.nama as debitur_nama FROM pengajuan p
     JOIN debitur d ON p.debitur_id = d.id
     WHERE p.status IN ('SCORING','REVIEW_KABID','KOMITE','DIREKSI')
     ORDER BY p.created_at DESC LIMIT 10`
  );

  // Recent pengajuan
  const recentPengajuan = await db.query(
    `SELECT p.*, d.nama as debitur_nama, u.full_name as ao_nama
     FROM pengajuan p
     JOIN debitur d ON p.debitur_id = d.id
     LEFT JOIN users u ON p.ao_id = u.id
     ORDER BY p.created_at DESC LIMIT 10`
  );

  return {
    summary: {
      totalDebitur: parseInt(totalDebitur.rows[0].total),
      totalPengajuan: parseInt(totalPengajuan.rows[0].total),
      totalDisetujui: parseInt(pengajuanDisetujui.rows[0].total),
      outstanding: parseFloat(pengajuanDisetujui.rows[0].outstanding),
    },
    pengajuanByStatus: pengajuanByStatus.rows,
    pengajuanByJenis: pengajuanByJenis.rows,
    perBulan: perBulan.rows,
    perAo: perAo.rows,
    pendingApproval: pendingApproval.rows,
    recentPengajuan: recentPengajuan.rows,
  };
}

async function getAoDashboard(aoId) {
  const myDebitur = await db.query('SELECT COUNT(*) as total FROM debitur WHERE ao_id = $1', [aoId]);
  const myPengajuan = await db.query('SELECT COUNT(*) as total FROM pengajuan WHERE ao_id = $1', [aoId]);
  const pendingSurvey = await db.query(`SELECT COUNT(*) as total FROM pengajuan WHERE ao_id = $1 AND status = 'DIAJUKAN'`, [aoId]);
  const recentPengajuan = await db.query(
    `SELECT p.*, d.nama as debitur_nama FROM pengajuan p JOIN debitur d ON p.debitur_id = d.id WHERE p.ao_id = $1 ORDER BY p.created_at DESC LIMIT 10`, [aoId]);

  return {
    summary: {
      totalDebitur: parseInt(myDebitur.rows[0].total),
      totalPengajuan: parseInt(myPengajuan.rows[0].total),
      pendingSurvey: parseInt(pendingSurvey.rows[0].total),
    },
    recentPengajuan: recentPengajuan.rows,
  };
}

async function getAnalisDashboard(analisId) {
  const pendingAnalisa = await db.query(`SELECT COUNT(*) as total FROM pengajuan WHERE status = 'SURVEY' OR (analis_id = $1 AND status = 'ANALISA')`, [analisId]);
  const completed = await db.query(`SELECT COUNT(*) as total FROM pengajuan WHERE analis_id = $1 AND status IN ('SCORING','REVIEW_KABID','KOMITE','DIREKSI','DISETUJUI')`, [analisId]);
  const recentPengajuan = await db.query(
    `SELECT p.*, d.nama as debitur_nama FROM pengajuan p JOIN debitur d ON p.debitur_id = d.id
     WHERE p.status IN ('SURVEY','ANALISA') ORDER BY p.created_at DESC LIMIT 10`);

  return {
    summary: {
      pendingAnalisa: parseInt(pendingAnalisa.rows[0].total),
      completedAnalisa: parseInt(completed.rows[0].total),
    },
    recentPengajuan: recentPengajuan.rows,
  };
}

module.exports = { getDireksiDashboard, getAoDashboard, getAnalisDashboard };
