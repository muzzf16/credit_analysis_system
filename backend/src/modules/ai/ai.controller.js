'use strict';

const svc = require('./ai.service');
const { success, error } = require('../../utils/response');

async function getNarrative(req, res) {
  try {
    const data = await svc.getNarrative(req.params.pengajuanId);
    if (!data) {
      return error(res, 'AI Narrative belum di-generate untuk pengajuan ini.', 404);
    }
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
}

async function generateNarrative(req, res) {
  try {
    const data = await svc.generateNarrative(req.params.pengajuanId);
    return success(res, data, 'AI Narrative berhasil di-generate.', 201);
  } catch (err) {
    console.error('Error generating AI narrative:', err);
    return error(res, err.message, err.status || 500);
  }
}

module.exports = {
  getNarrative,
  generateNarrative,
};
