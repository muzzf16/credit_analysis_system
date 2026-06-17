const svc = require('./approval.service');
const { success, error } = require('../../utils/response');

async function submit(req, res) {
  try {
    const data = await svc.submit(req.body, req.user.id);
    return success(res, data, 'Approval berhasil disimpan.', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function getByPengajuanId(req, res) {
  try {
    const data = await svc.getByPengajuanId(req.params.pengajuanId);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function getPending(req, res) {
  try {
    const data = await svc.getPendingForUser(req.user.id, req.user.role);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

module.exports = { submit, getByPengajuanId, getPending };
