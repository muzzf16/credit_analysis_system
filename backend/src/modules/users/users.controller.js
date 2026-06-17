const svc = require('./users.service');
const { success, error, paginationMeta } = require('../../utils/response');

async function getAll(req, res) {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const result = await svc.getAll(parseInt(page), parseInt(limit), search);
    return success(res, result.data, 'Daftar user berhasil diambil.', 200, paginationMeta(result.total, result.page, result.limit));
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function getById(req, res) {
  try {
    const data = await svc.getById(req.params.id);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function create(req, res) {
  try {
    const data = await svc.create(req.body);
    return success(res, data, 'User berhasil ditambahkan.', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function update(req, res) {
  try {
    const data = await svc.update(req.params.id, req.body);
    return success(res, data, 'User berhasil diperbarui.');
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function resetPassword(req, res) {
  try {
    await svc.resetPassword(req.params.id, req.body.newPassword);
    return success(res, null, 'Password berhasil direset.');
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function getRoles(req, res) {
  try {
    const data = await svc.getRoles();
    return success(res, data, 'Daftar role berhasil diambil.');
  } catch (err) { return error(res, err.message, 500); }
}

module.exports = { getAll, getById, create, update, resetPassword, getRoles };
