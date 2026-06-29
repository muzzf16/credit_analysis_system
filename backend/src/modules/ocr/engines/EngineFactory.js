const TesseractEngine = require('./TesseractEngine');
const PdfTextEngine = require('./PdfTextEngine');
const EngineCapabilities = require('./capabilities');

class EngineFactory {
  static create(context) {
    const isPdfMagic = context.buffer && context.buffer.length > 4 && 
                       context.buffer[0] === 0x25 && 
                       context.buffer[1] === 0x50 && 
                       context.buffer[2] === 0x44 && 
                       context.buffer[3] === 0x46;
                        
    const isPdf = isPdfMagic || context.mime === 'application/pdf' || context.documentType.endsWith('.pdf');

    // For SLIK digital PDFs, we use PdfTextEngine (extracts text without OCR)
    if (context.documentType === 'slik' && isPdf && EngineCapabilities.pdfText.pdf) {
      return new PdfTextEngine();
    }
    
    // Default: Tesseract as primary OCR engine
    // GLM will be used as fallback in OCRPipeline if Tesseract fails or produces low confidence
    return new TesseractEngine();
  }
}

module.exports = EngineFactory;
