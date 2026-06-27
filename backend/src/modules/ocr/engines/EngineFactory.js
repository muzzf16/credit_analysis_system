const TesseractEngine = require('./TesseractEngine');
const PdfTextEngine = require('./PdfTextEngine');
const GlmOcrEngine = require('./GlmOcrEngine');
const EngineCapabilities = require('./capabilities');
const config = require('../../../config');

class EngineFactory {
  static create(context) {
    const isPdfMagic = context.buffer && context.buffer.length > 4 && 
                       context.buffer[0] === 0x25 && 
                       context.buffer[1] === 0x50 && 
                       context.buffer[2] === 0x44 && 
                       context.buffer[3] === 0x46;
                       
    const isPdf = isPdfMagic || context.mime === 'application/pdf' || context.documentType.endsWith('.pdf');

    // Engine Auto Selection based on capabilities and document type
    
    // If OCR engine is set to GLM explicitly, use it
    if (config.ocrEngine === 'glm') {
      return new GlmOcrEngine();
    }

    // For SLIK digital PDFs, we use PdfTextEngine
    if (context.documentType === 'slik' && isPdf && EngineCapabilities.pdfText.pdf) {
      return new PdfTextEngine();
    }
    
    // Fallback default: Tesseract
    return new TesseractEngine();
  }
}

module.exports = EngineFactory;
