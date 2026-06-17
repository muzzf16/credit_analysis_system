const bcrypt = require('bcryptjs');
const db = require('../../config/database');

async function getAll(page = 1, limit = 10, search = '') {
  const offset = (page - 1) * limit;
  let where = '';
  const params = [];
  if (search) {
    where = `WHERE u.full_name ILIKE $1 OR u.username ILIKE $1 OR u.email ILIKE $1`;
    params.push(`%${search}%`);
  }
  const countQ = await db.query(`SELECT COUNT(*) FROM users u ${where}`, params);
  const total = parseInt(countQ.rows[0].count);
  const dataQ = await db.query(
    `SELECT u.id, u.username, u.email, u.full_name, u.is_active, u.last_login, u.created_at, r.name as role
     FROM users u JOIN roles r ON u.role_id = r.id ${where}
     ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  return { data: dataQ.rows, total, page, limit };
}

async function getById(id) {
  const result = await db.query(
    `SELECT u.id, u.username, u.email, u.full_name, u.is_active, u.last_login, u.created_at, u.role_id, r.name as role
     FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1`, [id]);
  if (result.rows.length === 0) throw { status: 404, message: 'User tidak ditemukan.' };
  return result.rows[0];
}

async function create(data) {
  const { username, email, password, fullName, roleId } = data;
  const exists = await db.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
  if (exists.rows.length > 0) throw { status: 409, message: 'Username atau email sudah digunakan.' };
  const hash = await bcrypt.hash(password, 12);
  const result = await db.query(
    `INSERT INTO users (username, email, password_hash, full_name, role_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, full_name, role_id, is_active, created_at`,
    [username, email, hash, fullName, roleId]
  );
  return result.rows[0];
}

async function update(id, data) {
  const { email, fullName, roleId, isActive } = data;
  const result = await db.query(
    `UPDATE users SET email = COALESCE($1, email), full_name = COALESCE($2, full_name), role_id = COALESCE($3, role_id), is_active = COALESCE($4, is_active), updated_at = NOW()
     WHERE id = $5 RETURNING id, username, email, full_name, role_id, is_active`,
    [email, fullName, roleId, isActive, id]
  );
  if (result.rows.length === 0) throw { status: 404, message: 'User tidak ditemukan.' };
  return result.rows[0];
}

async function resetPassword(id, newPassword) {
  const hash = await bcrypt.hash(newPassword, 12);
  await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, id]);
}

async function getRoles() {
  const result = await db.query('SELECT * FROM roles ORDER BY id');
  return result.rows;
}

module.exports = { getAll, getById, create, update, resetPassword, getRoles };
