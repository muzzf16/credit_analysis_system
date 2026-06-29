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
      let confidenceThreshold = config.tesseractConfidenceThreshold || 0.5;
      
      // Strict validation for KTP to force VLM fallback on bad Tesseract results
      if (tesseractType === 'ktp') {
        confidenceThreshold = 0.85; // KTP requires higher confidence for Tesseract
        
        const d = ocrResult.data || {};
        const nikStr = (d.nik || '').toString().replace(/\D/g, '');
        const hasSufficientName = d.nama && d.nama.length >= 3;
        
        if (nikStr.length !== 16 || !hasSufficientName) {
           throw new Error(`KTP validation failed: Invalid NIK length (${nikStr.length}) or missing Nama. Triggering VLM fallback.`);
        }
      }
      
      if (confidence < confidenceThreshold) {
        throw new Error(`Low confidence: ${confidence.toFixed(2)} (Threshold: ${confidenceThreshold})`);
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
