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
      
      // Strict validation for KTP disabled to prioritize Tesseract
      if (tesseractType === 'ktp') {
        confidenceThreshold = 0.5; // Lower confidence threshold to accept Tesseract results
      } else if (tesseractType.startsWith('shm')) {
        // Raise SHM threshold to 0.45. This ensures that poorly scanned SHM pages
        // fall back to the VLM (GLM), which is much better at understanding complex layouts
        confidenceThreshold = 0.45;
      } else if (tesseractType === 'sppt_pbb') {
        confidenceThreshold = 0.4;
      }
      
      if (confidence < confidenceThreshold) {
        throw new Error(`Low confidence: ${confidence.toFixed(2)} (Threshold: ${confidenceThreshold})`);
      }
      return {
        success: true,
        data: ocrResult.data || {},
        rawText: ocrResult.rawText, // Forward raw text for parsing
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
