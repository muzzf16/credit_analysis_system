const db = require('../../config/database');

// ─── LIST AUDIT LOGS ──────────────────────────────────────────────────────

async function getAll(filters = {}) {
  const { action, module: mod, userId, dateFrom, dateTo, page = 1, limit = 20 } = filters;
  const conditions = [];
  const params = [];
  let paramIdx = 1;

  if (action) {
    conditions.push(`al.action = $${paramIdx++}`);
    params.push(action);
  }
  if (mod) {
    conditions.push(`al.module = $${paramIdx++}`);
    params.push(mod);
  }
  if (userId) {
    conditions.push(`al.user_id = $${paramIdx++}`);
    params.push(userId);
  }
  if (dateFrom) {
    conditions.push(`al.created_at >= $${paramIdx++}`);
    params.push(dateFrom);
  }
  if (dateTo) {
    conditions.push(`al.created_at <= $${paramIdx++}::date + interval '1 day'`);
    params.push(dateTo);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const countRes = await db.query(
    `SELECT COUNT(*) FROM audit_log al ${whereClause}`, params
  );
  const total = parseInt(countRes.rows[0].count);

  const safeLimit = Math.min(100, Math.max(1, parseInt(limit)));
  const safePage = Math.max(1, parseInt(page));
  const offset = (safePage - 1) * safeLimit;

  const result = await db.query(
    `SELECT al.*, u.full_name as user_full_name
     FROM audit_log al
     LEFT JOIN users u ON al.user_id = u.id
     ${whereClause}
     ORDER BY al.created_at DESC
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

// ─── SUMMARY FOR SPI DASHBOARD ────────────────────────────────────────────

async function getSummary() {
  // Total actions today
  const todayRes = await db.query(
    `SELECT COUNT(*) FROM audit_log WHERE created_at >= CURRENT_DATE`
  );

  // Breakdown by module
  const byModuleRes = await db.query(
    `SELECT module, COUNT(*) as count FROM audit_log
     WHERE created_at >= CURRENT_DATE - interval '30 days'
     GROUP BY module ORDER BY count DESC`
  );

  // Breakdown by action type
  const byActionRes = await db.query(
    `SELECT action, COUNT(*) as count FROM audit_log
     WHERE created_at >= CURRENT_DATE - interval '30 days'
     GROUP BY action ORDER BY count DESC`
  );

  // Recent suspicious activities (DELETE actions + after-hours logins 22:00-06:00)
  const suspiciousRes = await db.query(
    `SELECT al.*, u.full_name as user_full_name
     FROM audit_log al
     LEFT JOIN users u ON al.user_id = u.id
     WHERE (
       al.action = 'DELETE'
       OR (al.action = 'LOGIN' AND EXTRACT(HOUR FROM al.created_at) NOT BETWEEN 6 AND 22)
     )
     AND al.created_at >= CURRENT_DATE - interval '7 days'
     ORDER BY al.created_at DESC
     LIMIT 20`
  );

  // Daily activity trend (last 7 days)
  const trendRes = await db.query(
    `SELECT DATE(created_at) as date, COUNT(*) as count
     FROM audit_log
     WHERE created_at >= CURRENT_DATE - interval '7 days'
     GROUP BY DATE(created_at)
     ORDER BY date`
  );

  return {
    totalActionsToday: parseInt(todayRes.rows[0].count),
    byModule: byModuleRes.rows,
    byAction: byActionRes.rows,
    suspiciousActivities: suspiciousRes.rows,
    dailyTrend: trendRes.rows,
  };
}

// ─── LOG ACTION ───────────────────────────────────────────────────────────

async function logAction({ userId, userName, action, module: mod, recordId, oldData, newData, ipAddress, userAgent }) {
  const result = await db.query(
    `INSERT INTO audit_log (user_id, user_name, action, module, record_id, old_data, new_data, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      userId, userName, action, mod, recordId,
      oldData ? JSON.stringify(oldData) : null,
      newData ? JSON.stringify(newData) : null,
      ipAddress, userAgent,
    ]
  );
  return result.rows[0];
}

module.exports = { getAll, getSummary, logAction };
