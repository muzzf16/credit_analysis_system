const OCRPipeline = require('../pipeline/OCRPipeline');

/**
 * Process OCR/Text extraction on file buffer
 * @param {Buffer} buffer - File buffer
 * @param {string} type - ktp, shm, bpkb, surat_nikah, slik
 * @param {string} mimetype - File mimetype
 * @returns {Promise<object>}
 */
async function processOCR(buffer, type, mimetype = '') {
  const pipeline = new OCRPipeline(buffer, type, mimetype);
  return await pipeline.execute();
}

module.exports = {
  processOCR
};
