const svc = require('./scoring.service');
const { success, error } = require('../../utils/response');

async function save(req, res) {
  try {
    const data = await svc.save(req.body, req.user.id);
    return success(res, data, 'Credit scoring berhasil disimpan.', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function getByPengajuanId(req, res) {
  try {
    const data = await svc.getByPengajuanId(req.params.pengajuanId);
    if (!data) return error(res, 'Scoring belum dilakukan.', 404);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

module.exports = { save, getByPengajuanId };
