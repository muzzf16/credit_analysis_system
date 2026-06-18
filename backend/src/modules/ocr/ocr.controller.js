const ocrService = require('./ocr.service');
const { success, error } = require('../../utils/response');

/**
 * Handle POST /api/ocr
 */
async function processDocumentOCR(req, res) {
  try {
    if (!req.file) {
      return error(res, 'File gambar wajib diunggah.', 400);
    }
    
    const type = req.body.type || req.query.type;
    if (!type) {
      return error(res, 'Parameter tipe dokumen (type) wajib ditentukan.', 400);
    }

    const result = await ocrService.processOCR(req.file.buffer, type, req.file.mimetype);
    return success(res, result, 'OCR berhasil diproses.');
  } catch (err) {
    console.error('Error inside processDocumentOCR:', err);
    return error(res, err.message || 'Gagal memproses OCR.', err.status || 500);
  }
}

module.exports = {
  processDocumentOCR
};
