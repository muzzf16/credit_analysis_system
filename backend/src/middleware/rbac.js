const { error } = require('../utils/response');

/**
 * Role-Based Access Control middleware
 * Usage: authorize('ADMIN', 'DIREKSI')
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Tidak terautentikasi.', 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      return error(res, 'Anda tidak memiliki akses untuk melakukan aksi ini.', 403);
    }
    next();
  };
}

module.exports = { authorize };
