class BaseEngine {
  /**
   * Preprocess the document/image before OCR
   * @param {OCRContext} context 
   */
  async preprocess(context) {
    throw new Error('Method preprocess() must be implemented');
  }

  /**
   * Perform the OCR/Text extraction
   * @param {OCRContext} context 
   * @returns {string} extracted text
   */
  async recognize(context) {
    throw new Error('Method recognize() must be implemented');
  }

  /**
   * Clean up or post-process the OCR output
   * @param {OCRContext} context 
   */
  async postprocess(context) {}
}

module.exports = BaseEngine;
