const svc = require('./survey.service');
const { success, error } = require('../../utils/response');

async function create(req, res) {
  try {
    const data = await svc.create(req.body, req.user.id);
    return success(res, data, 'Survey berhasil disimpan.', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function getByPengajuanId(req, res) {
  try {
    const data = await svc.getByPengajuanId(req.params.pengajuanId);
    if (!data) return error(res, 'Survey belum dilakukan.', 404);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

module.exports = { create, getByPengajuanId };
