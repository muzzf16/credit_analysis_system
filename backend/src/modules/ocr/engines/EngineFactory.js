const TesseractEngine = require('./TesseractEngine');
const PdfTextEngine = require('./PdfTextEngine');
const EngineCapabilities = require('./capabilities');
const FileUtils = require('../utils/fileUtils');
const OCRDebugger = require('../utils/OCRDebugger');

class EngineFactory {
  static create(context) {
    const isPdf = FileUtils.isPdf(context.buffer, context.mime, context.documentType);

    // For SLIK digital PDFs, we use PdfTextEngine (extracts text without OCR)
    if (context.documentType === 'slik' && isPdf && EngineCapabilities.pdfText.pdf) {
      OCRDebugger.logInfo(context, 'EngineFactory selected PdfTextEngine');
      return new PdfTextEngine();
    }
    
    // Default: Tesseract as primary OCR engine
    // GLM will be used as fallback in OCRPipeline if Tesseract fails or produces low confidence
    OCRDebugger.logInfo(context, 'EngineFactory selected TesseractEngine');
    return new TesseractEngine();
  }
}

module.exports = EngineFactory;
