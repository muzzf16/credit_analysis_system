const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');
const config = require('../../config');

async function login(username, password) {
  const result = await db.query(
    `SELECT u.id, u.username, u.email, u.password_hash, u.full_name, u.is_active,
            r.name as role, r.permissions
     FROM users u JOIN roles r ON u.role_id = r.id
     WHERE u.username = $1`,
    [username]
  );
  if (result.rows.length === 0) throw { status: 401, message: 'Username atau password salah.' };
  const user = result.rows[0];
  if (!user.is_active) throw { status: 403, message: 'Akun Anda dinonaktifkan. Hubungi Admin.' };

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw { status: 401, message: 'Username atau password salah.' };

  const payload = { id: user.id, username: user.username, role: user.role, fullName: user.full_name };
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  const refreshToken = jwt.sign({ id: user.id }, config.jwtSecret, { expiresIn: config.jwtRefreshExpiresIn });

  await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

  return {
    token,
    refreshToken,
    user: { id: user.id, username: user.username, email: user.email, fullName: user.full_name, role: user.role, permissions: user.permissions },
  };
}

async function refreshToken(oldToken) {
  try {
    const decoded = jwt.verify(oldToken, config.jwtSecret);
    const result = await db.query(
      `SELECT u.id, u.username, u.full_name, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1 AND u.is_active = true`,
      [decoded.id]
    );
    if (result.rows.length === 0) throw { status: 401, message: 'User tidak ditemukan.' };
    const user = result.rows[0];
    const payload = { id: user.id, username: user.username, role: user.role, fullName: user.full_name };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    return { token };
  } catch {
    throw { status: 401, message: 'Refresh token tidak valid.' };
  }
}

async function changePassword(userId, oldPassword, newPassword) {
  const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) throw { status: 404, message: 'User tidak ditemukan.' };
  const valid = await bcrypt.compare(oldPassword, result.rows[0].password_hash);
  if (!valid) throw { status: 400, message: 'Password lama salah.' };
  const hash = await bcrypt.hash(newPassword, 12);
  await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, userId]);
}

module.exports = { login, refreshToken, changePassword };
