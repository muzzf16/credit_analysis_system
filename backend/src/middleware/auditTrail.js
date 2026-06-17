const db = require('../config/database');

/**
 * Audit Trail middleware — logs all data mutations (POST, PUT, PATCH, DELETE)
 */
function auditTrail(tableName) {
  return async (req, res, next) => {
    // Only log mutating requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

    // Store original json method to intercept response
    const originalJson = res.json.bind(res);
    res.json = async function (body) {
      try {
        if (req.user) {
          await db.query(
            `INSERT INTO audit_logs (user_id, action, tabel_name, record_id, data_before, data_after, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              req.user.id,
              req.method === 'POST' ? 'CREATE' : req.method === 'DELETE' ? 'DELETE' : 'UPDATE',
              tableName,
              body?.data?.id || req.params.id || null,
              req._auditDataBefore ? JSON.stringify(req._auditDataBefore) : null,
              body?.data ? JSON.stringify(body.data) : null,
              req.ip || req.headers['x-real-ip'] || req.connection.remoteAddress,
              req.headers['user-agent'],
            ]
          );
        }
      } catch (err) {
        console.error('Audit trail error:', err.message);
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = { auditTrail };
