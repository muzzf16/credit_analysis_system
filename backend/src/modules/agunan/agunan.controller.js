const svc = require('./agunan.service');
const { success, error } = require('../../utils/response');

async function create(req, res) {
  try {
    const data = await svc.create(req.body, req.user.id);
    return success(res, data, 'Agunan berhasil ditambahkan.', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function getByPengajuanId(req, res) {
  try {
    const data = await svc.getByPengajuanId(req.params.pengajuanId);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function getById(req, res) {
  try {
    const data = await svc.getById(req.params.id);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function update(req, res) {
  try {
    const data = await svc.update(req.params.id, req.body, req.user.id);
    return success(res, data, 'Agunan berhasil diperbarui.');
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function addFoto(req, res) {
  try {
    const data = await svc.addFoto(req.params.agunanId, req.body);
    return success(res, data, 'Foto agunan berhasil ditambahkan.', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

module.exports = { create, getById, update, getByPengajuanId, addFoto };
