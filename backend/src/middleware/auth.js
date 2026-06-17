const jwt = require('jsonwebtoken');
const config = require('../config');
const { error } = require('../utils/response');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Token tidak ditemukan. Silakan login.', 401);
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Token sudah kadaluarsa. Silakan login kembali.', 401);
    }
    return error(res, 'Token tidak valid.', 401);
  }
}

module.exports = { authenticate };
