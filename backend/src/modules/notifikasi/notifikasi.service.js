const db = require('../../config/database');

const WA_GATEWAY_URL = process.env.WA_GATEWAY_URL || 'http://localhost:3001/send-message';

// ─── CRUD ─────────────────────────────────────────────────────────────────

async function getNotifications(userId, page = 1, limit = 20) {
  const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(100, Math.max(1, parseInt(limit)));
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit)));

  const countRes = await db.query('SELECT COUNT(*) FROM notifikasi WHERE user_id = $1', [userId]);
  const total = parseInt(countRes.rows[0].count);

  const result = await db.query(
    `SELECT * FROM notifikasi WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, safeLimit, offset]
  );

  return {
    data: result.rows,
    meta: {
      total,
      page: Math.max(1, parseInt(page)),
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
      hasNext: Math.max(1, parseInt(page)) * safeLimit < total,
      hasPrev: Math.max(1, parseInt(page)) > 1,
    },
  };
}

async function getUnreadCount(userId) {
  const result = await db.query(
    'SELECT COUNT(*) FROM notifikasi WHERE user_id = $1 AND is_read = false', [userId]
  );
  return parseInt(result.rows[0].count);
}

async function markAsRead(id, userId) {
  const result = await db.query(
    `UPDATE notifikasi SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId]
  );
  if (!result.rows[0]) {
    const err = new Error('Notifikasi tidak ditemukan.'); err.status = 404; throw err;
  }
  return result.rows[0];
}

async function createNotification({ userId, title, message, type, referenceId, referenceType }) {
  const result = await db.query(
    `INSERT INTO notifikasi (user_id, title, message, type, reference_id, reference_type)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, title, message, type, referenceId, referenceType]
  );
  return result.rows[0];
}

// ─── WHATSAPP ─────────────────────────────────────────────────────────────

async function sendWhatsApp(phone, message) {
  try {
    // Dynamic import for fetch (Node 18+ has global fetch, fallback for older)
    const response = await fetch(WA_GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message }),
    });

    const result = await response.json();

    // Update wa_sent flag if we have a reference
    return { success: response.ok, data: result };
  } catch (err) {
    console.error('WhatsApp send error:', err.message);
    return { success: false, error: err.message };
  }
}

// ─── WORKFLOW HELPER ──────────────────────────────────────────────────────

async function notifyWorkflow(pengajuanId, eventType) {
  // Get pengajuan info
  const pengajuanRes = await db.query(
    `SELECT p.*, d.nama as debitur_nama
     FROM pengajuan p
     LEFT JOIN debitur d ON p.debitur_id = d.id
     WHERE p.id = $1`, [pengajuanId]
  );
  if (!pengajuanRes.rows[0]) return;
  const pengajuan = pengajuanRes.rows[0];

  switch (eventType) {
    case 'PENGAJUAN_BARU': {
      // Notify the assigned AO
      if (pengajuan.ao_id) {
        const aoRes = await db.query('SELECT id, full_name, phone FROM users WHERE id = $1', [pengajuan.ao_id]);
        const ao = aoRes.rows[0];
        if (ao) {
          const msg = `Pengajuan baru ${pengajuan.nomor_pengajuan} untuk debitur ${pengajuan.debitur_nama} telah dibuat.`;
          await createNotification({
            userId: ao.id, title: 'Pengajuan Baru', message: msg,
            type: 'PENGAJUAN', referenceId: pengajuanId, referenceType: 'PENGAJUAN',
          });
          if (ao.phone) await sendWhatsApp(ao.phone, msg);
        }
      }
      break;
    }

    case 'SURVEY_SELESAI': {
      // Notify all ANALIS users
      const analisRes = await db.query(
        `SELECT u.id, u.full_name, u.phone FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'ANALIS'`
      );
      const msg = `Survey pengajuan ${pengajuan.nomor_pengajuan} (${pengajuan.debitur_nama}) telah selesai. Silakan lakukan analisa.`;
      for (const user of analisRes.rows) {
        await createNotification({
          userId: user.id, title: 'Survey Selesai', message: msg,
          type: 'SURVEY', referenceId: pengajuanId, referenceType: 'PENGAJUAN',
        });
        if (user.phone) await sendWhatsApp(user.phone, msg);
      }
      break;
    }

    case 'SCORING_SELESAI': {
      // Notify all KABID users
      const kabidRes = await db.query(
        `SELECT u.id, u.full_name, u.phone FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'KABID'`
      );
      const msg = `Scoring pengajuan ${pengajuan.nomor_pengajuan} (${pengajuan.debitur_nama}) telah selesai. Silakan review dan approval.`;
      for (const user of kabidRes.rows) {
        await createNotification({
          userId: user.id, title: 'Scoring Selesai', message: msg,
          type: 'SCORING', referenceId: pengajuanId, referenceType: 'PENGAJUAN',
        });
        if (user.phone) await sendWhatsApp(user.phone, msg);
      }
      break;
    }

    case 'APPROVAL_APPROVED':
    case 'APPROVAL_REJECTED': {
      // Notify the AO
      if (pengajuan.ao_id) {
        const aoRes = await db.query('SELECT id, full_name, phone FROM users WHERE id = $1', [pengajuan.ao_id]);
        const ao = aoRes.rows[0];
        if (ao) {
          const statusLabel = eventType === 'APPROVAL_APPROVED' ? 'DISETUJUI' : 'DITOLAK';
          const msg = `Pengajuan ${pengajuan.nomor_pengajuan} (${pengajuan.debitur_nama}) telah ${statusLabel}.`;
          await createNotification({
            userId: ao.id, title: `Pengajuan ${statusLabel}`, message: msg,
            type: 'APPROVAL', referenceId: pengajuanId, referenceType: 'PENGAJUAN',
          });
          if (ao.phone) await sendWhatsApp(ao.phone, msg);
        }
      }
      break;
    }

    default:
      console.warn(`Unknown workflow event type: ${eventType}`);
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  createNotification,
  sendWhatsApp,
  notifyWorkflow,
};
