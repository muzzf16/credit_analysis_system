const BaseEngine = require('./BaseEngine');
const pdfParse = require('pdf-parse');
const OCRDebugger = require('../utils/OCRDebugger');

class PdfTextEngine extends BaseEngine {
  async preprocess(context) {
    // No preprocessing needed for direct PDF text extraction
  }

  async recognize(context) {
    OCRDebugger.logInfo(context, 'Extracting text from PDF');
    const buffer = context.buffer;
    
    // Ensure it's a buffer for pdf-parse
    const pdfBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    
    try {
      const pdfData = await pdfParse(pdfBuffer);
      const text = pdfData.text;
      OCRDebugger.logInfo(context, `PDF text extraction completed. Length: ${text.length}`);
      return text;
    } catch (err) {
      OCRDebugger.logError(context, 'Failed to extract text from PDF', err);
      throw err;
    }
  }

  async postprocess(context) {
    // No postprocessing needed
  }
}

module.exports = PdfTextEngine;
