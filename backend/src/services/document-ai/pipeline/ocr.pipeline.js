const imagePipeline = require('./image.pipeline');
const tesseractEngine = require('../engines/tesseract.engine');
const paddleOcrEngine = require('../engines/paddleocr.engine');
const config = require('../../../config');
const { validateAndClean } = require('../document-ai.schemas');

class OcrPipeline {
  constructor() {
    this.engines = {
      tesseract: tesseractEngine,
      paddleocr: paddleOcrEngine
    };
  }

  async run(fileBuffer, type, mimetype, vlmFallbackFn) {
    const engineName = String(config.ocrEngine || 'tesseract').toLowerCase();
    const primary = this.engines[engineName] || this.engines.tesseract;

    // PaddleOCR performs its own document orientation/unwarping, so send the
    // original image. Tesseract keeps the existing OpenCV preprocessing path.
    let processedBuffer = fileBuffer;
    let processedMime = mimetype;

    if (engineName !== 'paddleocr') {
      console.log(`[OcrPipeline] Pre-processing image with OpenCV for type: ${type}...`);
      processedBuffer = await imagePipeline.process(fileBuffer, type);
    }

    console.log(`[OcrPipeline] Executing primary OCR engine (${engineName})...`);
    const engineResult = await primary.execute(processedBuffer, processedMime, type);

    if (engineResult.success) {
      console.log(`[OcrPipeline] Primary engine ${engineName} succeeded with confidence: ${Number(engineResult.confidence || 0).toFixed(3)}`);
      return {
        engineUsed: engineName,
        success: true,
        rawText: engineResult.rawText,
        data: validateAndClean(engineResult.data || {}, type),
        confidences: engineResult.confidences,
        warnings: engineResult.warnings || []
      };
    }

    if (vlmFallbackFn) {
      console.log(`[OcrPipeline] Primary engine failed. Triggering VLM fallback...`);
      try {
        const vlmResult = await vlmFallbackFn(fileBuffer, mimetype, type);
        console.log(`[OcrPipeline] VLM fallback succeeded.`);
        return {
          engineUsed: 'vlm',
          success: true,
          data: validateAndClean(vlmResult || {}, type),
          confidences: { _overall: 0.8 },
          warnings: [{
            message: 'Primary OCR engine failed, used VLM fallback',
            primaryEngine: engineName,
            originalError: engineResult.error?.message,
            originalConfidence: engineResult.confidence
          }]
        };
      } catch (vlmError) {
        console.warn(`[OcrPipeline] VLM fallback also failed: ${vlmError.message}`);

        if (engineResult.confidence && engineResult.data) {
          return {
            engineUsed: engineName,
            success: true,
            data: validateAndClean(engineResult.data || {}, type),
            confidences: engineResult.confidences,
            warnings: [{
              message: 'Low confidence OCR, VLM fallback failed',
              originalConfidence: engineResult.confidence,
              vlmError: vlmError.message
            }]
          };
        }

        throw new Error(`Both ${engineName} and VLM failed. Primary: ${engineResult.error?.message}. VLM: ${vlmError.message}`);
      }
    }

    throw new Error(`Primary OCR engine failed and no fallback available: ${engineResult.error?.message}`);
  }
}

module.exports = new OcrPipeline();
