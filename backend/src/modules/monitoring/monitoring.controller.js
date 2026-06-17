const svc = require('./monitoring.service');
const { success, error } = require('../../utils/response');

async function getAll(req, res) {
  try {
    const result = await svc.getAll(req.query);
    return success(res, result.data, 'Success', 200, result.meta);
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
    return success(res, data, 'Data monitoring berhasil dibuat.', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function update(req, res) {
  try {
    const data = await svc.update(req.params.id, req.body);
    return success(res, data, 'Data monitoring berhasil diupdate.');
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function recordPayment(req, res) {
  try {
    const data = await svc.recordPayment(req.params.id, req.body, req.user.id);
    return success(res, data, 'Pembayaran berhasil dicatat.', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function getSummary(req, res) {
  try {
    const data = await svc.getSummary();
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

module.exports = { getAll, getById, create, update, recordPayment, getSummary };
