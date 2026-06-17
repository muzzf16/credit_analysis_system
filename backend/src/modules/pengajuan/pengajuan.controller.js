const svc = require('./pengajuan.service');
const { success, error, paginationMeta } = require('../../utils/response');

async function getAll(req, res) {
  try {
    const { page = 1, limit = 10, status, jenisKredit, search } = req.query;
    const aoId = req.user.role === 'AO' ? req.user.id : req.query.aoId;
    const result = await svc.getAll(parseInt(page), parseInt(limit), { status, jenisKredit, aoId, search });
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
    return success(res, data, 'Pengajuan berhasil dibuat.', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function updateStatus(req, res) {
  try {
    const data = await svc.updateStatus(req.params.id, req.body.status, req.user.id);
    return success(res, data, 'Status pengajuan berhasil diperbarui.');
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function assignAnalis(req, res) {
  try {
    const data = await svc.assignAnalis(req.params.id, req.body.analisId);
    return success(res, data, 'Analis berhasil ditugaskan.');
  } catch (err) { return error(res, err.message, err.status || 500); }
}

module.exports = { getAll, getById, create, updateStatus, assignAnalis };
