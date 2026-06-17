const svc = require('./dokumen.service');
const { success, error } = require('../../utils/response');

async function upload(req, res) {
  try {
    if (!req.file) return error(res, 'File wajib diupload.', 400);
    const { referensiId, referensiTipe, jenisDokumen } = req.body;
    if (!referensiId || !referensiTipe) return error(res, 'referensiId dan referensiTipe wajib diisi.', 400);
    const data = await svc.upload(req.file, referensiId, referensiTipe, jenisDokumen, req.user.id);
    return success(res, data, 'Dokumen berhasil diupload.', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function getByReferensi(req, res) {
  try {
    const data = await svc.getByReferensi(req.params.referensiId, req.query.tipe || 'DEBITUR');
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

async function download(req, res) {
  try {
    const data = await svc.getPresignedUrl(req.params.id);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
}

module.exports = { upload, getByReferensi, download };
