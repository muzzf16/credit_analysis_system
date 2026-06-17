const svc = require('./debitur.service');
const { success, error, paginationMeta } = require('../../utils/response');

async function getAll(req, res) {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const aoId = req.user.role === 'AO' ? req.user.id : req.query.aoId;
    const result = await svc.getAll(parseInt(page), parseInt(limit), search, aoId);
    return success(res, result.data, 'OK', 200, paginationMeta(result.total, result.page, result.limit));
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
    const data = await svc.create(req.body, req.user.id);
    return success(res, data, 'Debitur berhasil ditambahkan.', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function update(req, res) {
  try {
    const data = await svc.update(req.params.id, req.body, req.user.id);
    return success(res, data, 'Debitur berhasil diperbarui.');
  } catch (err) { return error(res, err.message, err.status || 500); }
}

module.exports = { getAll, getById, create, update };
