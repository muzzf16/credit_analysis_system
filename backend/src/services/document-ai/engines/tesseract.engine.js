const ocrService = require('../../../modules/ocr/services/ocr.service');
const config = require('../../../config');

class TesseractEngine {
  /**
   * Execute OCR using Tesseract
   * @param {Buffer} processingBuffer 
   * @param {string} processingMime 
   * @param {string} type 
   * @returns {Promise<Object>}
   */
  async execute(processingBuffer, processingMime, type) {
    const tesseractType = type === 'survey' ? 'ktp' : type;
    
    try {
      console.log(`[TesseractEngine] Executing OCR for type: ${tesseractType}`);
      const ocrResult = await ocrService.processOCR(processingBuffer, tesseractType, processingMime);
      
      const confidence = ocrResult.confidences?._overall || ocrResult.confidence || 0.65;
      const confidenceThreshold = config.tesseractConfidenceThreshold || 0.5;
      
      if (confidence < confidenceThreshold) {
        throw new Error(`Low confidence: ${confidence.toFixed(2)}`);
      }
      
      return {
        success: true,
        data: ocrResult.data || {},
        confidences: ocrResult.confidences,
        warnings: ocrResult.warnings,
        confidence: confidence
      };
    } catch (err) {
      console.warn(`[TesseractEngine] Tesseract failed:`, err.message);
      return {
        success: false,
        error: err,
        confidence: err.message.startsWith('Low confidence') ? 
          parseFloat(err.message.replace('Low confidence: ', '')) : null
      };
    }
  }
}

module.exports = new TesseractEngine();
