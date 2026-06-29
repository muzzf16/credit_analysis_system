const imagePipeline = require('./image.pipeline');
const tesseractEngine = require('../engines/tesseract.engine');
const { validateAndClean } = require('../document-ai.schemas');

// Assuming callGlmVision is extracted or exported from document-ai.service or a separate file.
// For the sake of this pipeline, we will pass it as a dependency or require it.
// To avoid circular dependency, we'll keep the VLM fallback logic here, but require the functions
// from a new file later, or keep them in document-ai.service and pass them.

class OcrPipeline {
  constructor() {
    this.engines = {
      tesseract: tesseractEngine
      // paddle: paddleEngine,
      // surya: suryaEngine
    };
  }

  /**
   * Run the full OCR Pipeline: Image Preprocessing -> Engine -> Validation
   * @param {Buffer} fileBuffer 
   * @param {string} type 
   * @param {string} mimetype 
   * @param {Function} vlmFallbackFn - Function to call GLM/LFM if primary fails
   */
  async run(fileBuffer, type, mimetype, vlmFallbackFn) {
    // 1. Image Preprocessing Pipeline (OpenCV Python)
    console.log(`[OcrPipeline] Pre-processing image with OpenCV for type: ${type}...`);
    const processedBuffer = await imagePipeline.process(fileBuffer, type);
    
    // 2. Primary Engine Execution (Tesseract)
    console.log(`[OcrPipeline] Executing primary OCR engine (Tesseract)...`);
    const engineResult = await this.engines.tesseract.execute(processedBuffer, mimetype, type);
    
    if (engineResult.success) {
      console.log(`[OcrPipeline] ✅ Primary engine succeeded with confidence: ${engineResult.confidence.toFixed(2)}`);
      return {
        engineUsed: 'tesseract',
        success: true,
        data: validateAndClean(engineResult.data || {}, type),
        confidences: engineResult.confidences,
        warnings: engineResult.warnings
      };
    }
    
    // 3. VLM Fallback Execution
    if (vlmFallbackFn) {
      console.log(`[OcrPipeline] Primary engine failed or low confidence. Triggering VLM Fallback...`);
      try {
        // Use the ORIGINAL fileBuffer (raw colored image) for VLM!
        // VLMs perform much better on natural colored images than heavily binarized OpenCV outputs.
        const vlmResult = await vlmFallbackFn(fileBuffer, mimetype, type);
        console.log(`[OcrPipeline] ✅ VLM Fallback succeeded.`);
        return {
          engineUsed: 'vlm',
          success: true,
          data: validateAndClean(vlmResult || {}, type),
          confidences: { _overall: 0.8 },
          warnings: [{
            message: 'Primary engine failed, used VLM fallback',
            originalError: engineResult.error?.message,
            originalConfidence: engineResult.confidence
          }]
        };
      } catch (vlmError) {
        console.warn(`[OcrPipeline ⚠️] VLM fallback also failed. Error: ${vlmError.message}`);
        
        // 4. Last Resort
        if (engineResult.confidence && engineResult.data) {
           console.log(`[OcrPipeline] Returning low-confidence primary result as last resort...`);
           return {
             engineUsed: 'tesseract',
             success: true,
             data: validateAndClean(engineResult.data || {}, type),
             confidences: engineResult.confidences,
             warnings: [{
               message: 'Low confidence, VLM fallback failed',
               originalConfidence: engineResult.confidence,
               vlmError: vlmError.message
             }]
           };
        }
        
        throw new Error(`Both Primary and VLM failed. Primary: ${engineResult.error?.message}. VLM: ${vlmError.message}`);
      }
    }
    
    throw new Error(`Primary engine failed and no fallback available: ${engineResult.error?.message}`);
  }
}

module.exports = new OcrPipeline();
