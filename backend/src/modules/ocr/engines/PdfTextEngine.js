const BaseEngine = require('./BaseEngine');
const { PDFParse } = require('pdf-parse');
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
    
    const parser = new PDFParse({ data: pdfBuffer });
    try {
      const result = await parser.getText();
      const text = result.text;
      OCRDebugger.logInfo(context, `PDF text extraction completed. Length: ${text ? text.length : 0}`);
      return text;
    } catch (err) {
      OCRDebugger.logError(context, 'Failed to extract text from PDF', err);
      throw err;
    } finally {
      // Always call destroy() to free memory
      if (parser && typeof parser.destroy === 'function') {
        await parser.destroy();
      }
    }
  }

  async postprocess(context) {
    // No postprocessing needed
  }
}

module.exports = PdfTextEngine;
