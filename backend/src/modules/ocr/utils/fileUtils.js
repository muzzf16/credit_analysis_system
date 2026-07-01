/**
 * Utility functions for file operations in OCR
 */
class FileUtils {
  /**
   * Checks if a buffer represents a PDF file by checking magic bytes and mime types
   * @param {Buffer} buffer The file buffer
   * @param {string} mime The mime type
   * @param {string} documentType The document type identifier
   * @returns {boolean} True if the file is a PDF
   */
  static isPdf(buffer, mime = '', documentType = '') {
    const isPdfMagic = buffer && buffer.length > 4 && 
                       buffer[0] === 0x25 && // %
                       buffer[1] === 0x50 && // P
                       buffer[2] === 0x44 && // D
                       buffer[3] === 0x46;   // F
                       
    return Boolean(isPdfMagic || mime === 'application/pdf' || documentType.endsWith('.pdf'));
  }
}

module.exports = FileUtils;
