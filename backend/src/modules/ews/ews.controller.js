const svc = require('./ews.service');
const { success, error } = require('../../utils/response');

async function scanEws(req, res) {
  try {
    const data = await svc.scanEws();
    return success(res, data, 'Scan EWS berhasil diselesaikan.');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
}

async function getAll(req, res) {
  try {
    const result = await svc.getAll(req.query);
    return success(res, result.data, 'Data alert EWS berhasil diambil.', 200, result.meta);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
}

async function getById(req, res) {
  try {
    const data = await svc.getById(req.params.id);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
}

async function resolveAlert(req, res) {
  try {
    const data = await svc.resolveAlert(req.params.id, req.body, req.user.id);
    return success(res, data, 'Alert EWS berhasil di-resolve.');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
}

async function logAoVisit(req, res) {
  try {
    const data = await svc.logAoVisit(req.body.monitoringId, req.body, req.user.id);
    return success(res, data, 'Kunjungan monitoring AO berhasil dicatat.');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
}

async function getSummary(req, res) {
  try {
    const data = await svc.getSummary();
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
}

module.exports = {
  scanEws,
  getAll,
  getById,
  resolveAlert,
  logAoVisit,
  getSummary,
};
