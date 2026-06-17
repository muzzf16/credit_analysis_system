const authService = require('./auth.service');
const { success, error } = require('../../utils/response');

async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) return error(res, 'Username dan password wajib diisi.', 400);
    const data = await authService.login(username, password);
    return success(res, data, 'Login berhasil.');
  } catch (err) {
    return error(res, err.message || 'Login gagal.', err.status || 500);
  }
}

async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return error(res, 'Refresh token wajib diisi.', 400);
    const data = await authService.refreshToken(refreshToken);
    return success(res, data, 'Token berhasil diperbarui.');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
}

async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return error(res, 'Password lama dan baru wajib diisi.', 400);
    if (newPassword.length < 6) return error(res, 'Password baru minimal 6 karakter.', 400);
    await authService.changePassword(req.user.id, oldPassword, newPassword);
    return success(res, null, 'Password berhasil diubah.');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
}

async function me(req, res) {
  try {
    const db = require('../../config/database');
    const result = await db.query(
      `SELECT u.id, u.username, u.email, u.full_name, r.name as role, r.permissions, u.last_login
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1`, [req.user.id]);
    return success(res, result.rows[0]);
  } catch (err) {
    return error(res, err.message, 500);
  }
}

module.exports = { login, refreshToken, changePassword, me };
