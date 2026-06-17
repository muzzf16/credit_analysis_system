const svc = require('./audit.service');
const { success, error } = require('../../utils/response');

async function getAll(req, res) {
  try {
    const result = await svc.getAll(req.query);
    return success(res, result.data, 'Success', 200, result.meta);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function getSummary(req, res) {
  try {
    const data = await svc.getSummary();
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

module.exports = { getAll, getSummary };
