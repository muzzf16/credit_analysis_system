const db = require('../../config/database');

// Status flow: REVIEW_KABID -> KOMITE -> DIREKSI -> DISETUJUI/DITOLAK
const LEVEL_MAP = { 1: 'REVIEW_KABID', 2: 'KOMITE', 3: 'DIREKSI' };
const NEXT_STATUS = { 1: 'KOMITE', 2: 'DIREKSI', 3: 'DISETUJUI' };

async function submit(data, userId) {
  const { pengajuanId, level, status, plafonDisetujui, jangkaWaktuDisetujui, catatan, kondisi } = data;

  const result = await db.query(
    `INSERT INTO approval (pengajuan_id, level, approver_id, status, plafon_disetujui, jangka_waktu_disetujui, catatan, kondisi, approved_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING *`,
    [pengajuanId, level, userId, status, plafonDisetujui, jangkaWaktuDisetujui, catatan, kondisi]
  );

  // Update pengajuan status
  let newStatus;
  if (status === 'REJECTED') {
    newStatus = 'DITOLAK';
  } else if (status === 'APPROVED') {
    newStatus = NEXT_STATUS[level] || 'DISETUJUI';
  } else {
    newStatus = LEVEL_MAP[level] || 'REVIEW_KABID';
  }

  await db.query('UPDATE pengajuan SET status = $1, updated_at = NOW() WHERE id = $2', [newStatus, pengajuanId]);

  // Create notification for next level
  if (status === 'APPROVED' && level < 3) {
    const nextRoleMap = { 1: 'KABID', 2: 'DIREKSI', 3: 'DIREKSI' };
    const nextRole = nextRoleMap[level + 1];
    const users = await db.query('SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = $1', [nextRole]);
    const pengajuan = await db.query('SELECT nomor_pengajuan FROM pengajuan WHERE id = $1', [pengajuanId]);
    for (const u of users.rows) {
      await db.query(
        `INSERT INTO notifikasi (user_id, judul, pesan, tipe, referensi_id, referensi_tipe)
         VALUES ($1, $2, $3, 'URGENT', $4, 'PENGAJUAN')`,
        [u.id, 'Pengajuan Menunggu Approval', `Pengajuan ${pengajuan.rows[0]?.nomor_pengajuan} menunggu approval Anda.`, pengajuanId]
      );
    }
  }

  return result.rows[0];
}

async function getByPengajuanId(pengajuanId) {
  const result = await db.query(
    `SELECT a.*, u.full_name as approver_nama, r.name as approver_role
     FROM approval a
     LEFT JOIN users u ON a.approver_id = u.id
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE a.pengajuan_id = $1 ORDER BY a.level, a.created_at`, [pengajuanId]);
  return result.rows;
}

async function getPendingForUser(userId, role) {
  let statusFilter = '';
  if (role === 'KABID') statusFilter = `p.status = 'SCORING' OR p.status = 'REVIEW_KABID'`;
  else if (role === 'DIREKSI') statusFilter = `p.status = 'KOMITE' OR p.status = 'DIREKSI'`;
  else statusFilter = `p.status IN ('SCORING','REVIEW_KABID','KOMITE','DIREKSI')`;

  const result = await db.query(
    `SELECT p.*, d.nama as debitur_nama, cs.total_score, cs.grade, cs.rekomendasi
     FROM pengajuan p
     LEFT JOIN debitur d ON p.debitur_id = d.id
     LEFT JOIN credit_scoring cs ON cs.pengajuan_id = p.id
     WHERE ${statusFilter}
     ORDER BY p.created_at DESC`
  );
  return result.rows;
}

module.exports = { submit, getByPengajuanId, getPendingForUser };
