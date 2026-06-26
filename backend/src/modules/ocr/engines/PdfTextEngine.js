const BaseEngine = require('./BaseEngine');
const { PDFParse } = require('pdf-parse');

class PdfTextEngine extends BaseEngine {
  async preprocess(context) {
    // No preprocessing needed for direct PDF text extraction
  }

  async recognize(context) {
    console.log(`Extracting text from PDF for type: ${context.documentType}`);
    const buffer = context.buffer;
    const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const pdfParser = new PDFParse(uint8Array);
    const pdfData = await pdfParser.getText();
    const text = pdfData.text;
    console.log('PDF text extraction completed. Length:', text.length);
    return text;
  }

  async postprocess(context) {
    // No postprocessing needed
  }
}

module.exports = PdfTextEngine;
