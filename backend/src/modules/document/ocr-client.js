const config = require('../../config');

class GlmOcrClient {
  /**
   * Calls the external GLM OCR Service POST /ocr/ktp
   * @param {Buffer} fileBuffer 
   * @param {string} mimeType 
   * @param {string} fileName 
   * @returns {Promise<object>} Raw JSON response from GLM OCR Service
   */
  static async uploadKtp(fileBuffer, mimeType, fileName) {
    const baseUrl = config.glmOcrServiceUrl || 'http://localhost:8000';
    const url = `${baseUrl}/ocr/ktp`;
    
    console.log(`[GLM OCR Client] Sending request to ${url}`);

    // Create a Blob from the file buffer
    const blob = new Blob([fileBuffer], { type: mimeType });
    const formData = new FormData();
    formData.append('file', blob, fileName);

    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GLM OCR Service error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    
    // Check for model unavailable error in successful response
    if (result && result.success === false && result.errors?.[0]?.message?.includes('GGUF local model is not loaded/available')) {
      throw new Error('GLM OCR model unavailable');
    }
    
    return result;
  }
}

module.exports = GlmOcrClient;
