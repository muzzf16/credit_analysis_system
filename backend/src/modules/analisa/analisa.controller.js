const svc = require('./analisa.service');
const { success, error } = require('../../utils/response');

async function saveKonsumtif(req, res) {
  try {
    const data = await svc.saveKonsumtif(req.body, req.user.id);
    return success(res, data, 'Analisa konsumtif berhasil disimpan.', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function getKonsumtif(req, res) {
  try {
    const data = await svc.getKonsumtif(req.params.pengajuanId);
    if (!data) return error(res, 'Analisa konsumtif belum dilakukan.', 404);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function saveProduktif(req, res) {
  try {
    const data = await svc.saveProduktif(req.body, req.user.id);
    return success(res, data, 'Analisa produktif berhasil disimpan.', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function getProduktif(req, res) {
  try {
    const data = await svc.getProduktif(req.params.pengajuanId);
    if (!data) return error(res, 'Analisa produktif belum dilakukan.', 404);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

module.exports = { saveKonsumtif, getKonsumtif, saveProduktif, getProduktif };
