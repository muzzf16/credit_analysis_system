const documentAiService = require('../../services/document-ai/document-ai.service');
const { success, error } = require('../../utils/response');
const GlmOcrClient = require('./ocr-client');
const ocrMapper = require('./ocr-mapper');

/**
 * Helper to process document extraction generic handler
 * @param {object} req 
 * @param {object} res 
 * @param {string} type 
 */
async function processDocument(req, res, type) {
  try {
    if (!req.file) {
      return error(res, 'File gambar/dokumen wajib diunggah.', 400);
    }

    const result = await documentAiService.extractDocumentData(
      req.file.buffer,
      type,
      req.file.mimetype,
      req.file.originalname
    );

    return success(res, result, `Ekstraksi ${type.toUpperCase()} berhasil.`);
  } catch (err) {
    console.error(`Error processing ${type}:`, err);
    return error(res, err.message || `Gagal memproses dokumen ${type.toUpperCase()}.`, err.status || 500);
  }
}

/**
 * Handle POST /api/document/ktp
 */
async function processKTP(req, res) {
  try {
    if (!req.file) {
      return error(res, 'File gambar/dokumen wajib diunggah.', 400);
    }

    // Call external GLM OCR Service
    const ocrResult = await GlmOcrClient.uploadKtp(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    if (!ocrResult || !ocrResult.success) {
      const errMsg = ocrResult?.errors?.[0]?.message || 'Gagal mengekstrak data dari KTP via GLM OCR Service.';
      return error(res, errMsg, 422);
    }

    console.log('[DEBUG] GLM OCR Response:', JSON.stringify(ocrResult, null, 2));

    // Map KtpOcrResponse to Debtor DTO
    const mapped = ocrMapper.mapOcrToDebtorDto(ocrResult);

    return success(res, mapped, 'Ekstraksi KTP via GLM OCR Service berhasil.');
  } catch (err) {
    console.error('Error in processKTP via GLM OCR Service:', err);
    
    // Check if it is a network error (e.g. connection refused)
    if (err.message && (err.message.includes('fetch failed') || err.message.includes('ECONNREFUSED') || err.message.includes('connect ECONNREFUSED'))) {
      return error(res, 'Layanan GLM OCR tidak dapat dihubungi. Pastikan service berjalan di port 8000.', 503);
    }

    return error(res, err.message || 'Gagal memproses KTP via GLM OCR Service.', err.status || 500);
  }
}


/**
 * Handle POST /api/document/kk
 */
async function processKK(req, res) {
  return processDocument(req, res, 'kk');
}

/**
 * Handle POST /api/document/npwp
 */
async function processNPWP(req, res) {
  return processDocument(req, res, 'npwp');
}

/**
 * Handle POST /api/document/shm
 */
async function processSHM(req, res) {
  return processDocument(req, res, 'shm');
}

/**
 * Handle POST /api/document/bpkb
 */
async function processBPKB(req, res) {
  return processDocument(req, res, 'bpkb');
}

/**
 * Handle POST /api/document/survey
 */
async function processSurvey(req, res) {
  return processDocument(req, res, 'survey');
}

/**
 * Handle POST /api/document/surat_nikah
 */
async function processSuratNikah(req, res) {
  return processDocument(req, res, 'surat_nikah');
}

/**
 * Handle POST /api/document/shm/page
 * Ekstraksi per-halaman SHM dengan prompt spesifik.
 * Body: page_type = 'cover' | 'pendaftaran' | 'peralihan' | 'surat_ukur' | 'peta'
 */
async function processSHMPage(req, res) {
  try {
    if (!req.file) {
      return error(res, 'File gambar/dokumen wajib diunggah.', 400);
    }

    const validTypes = ['cover', 'pendaftaran', 'peralihan', 'surat_ukur', 'peta'];
    const pageType = (req.body.page_type || '').toLowerCase().trim();

    if (!validTypes.includes(pageType)) {
      return error(res, `page_type tidak valid. Pilihan: ${validTypes.join(', ')}`, 400);
    }

    const type = `shm_${pageType}`;
    console.log(`[Document AI] SHM page upload: halaman=${pageType} type=${type}`);

    const result = await documentAiService.extractDocumentData(
      req.file.buffer,
      type,
      req.file.mimetype,
      req.file.originalname
    );

    return success(res, result, `Ekstraksi SHM halaman ${pageType} berhasil.`);
  } catch (err) {
    console.error('Error processing SHM page:', err);
    return error(res, err.message || 'Gagal memproses halaman SHM.', err.status || 500);
  }
}

module.exports = {
  processKTP,
  processKK,
  processNPWP,
  processSHM,
  processBPKB,
  processSurvey,
  processSuratNikah,
  processSHMPage,
};
