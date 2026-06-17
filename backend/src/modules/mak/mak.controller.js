const svc = require('./mak.service');
const { success, error } = require('../../utils/response');

async function getMakData(req, res) {
  try {
    const data = await svc.getMakData(req.params.pengajuanId);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function generateMak(req, res) {
  try {
    const data = await svc.generateMak(req.params.pengajuanId, req.user.id);
    return success(res, data, 'MAK berhasil di-generate.', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

module.exports = { getMakData, generateMak };
