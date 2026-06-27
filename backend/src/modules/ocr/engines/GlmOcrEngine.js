const BaseEngine = require('./BaseEngine');
const config = require('../../../config');
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

class GlmOcrEngine extends BaseEngine {
  constructor() {
    super();
    this.apiKey = config.glmApiKey || config.llmApiKey || '';
    this.baseUrl = config.glmApiUrl || 'https://api.llamamind.com/v1';
  }

  async preprocess(context) {
    // Preprocessing is handled dynamically during recognition
  }

  async recognize(context) {
    const { buffer, mime, documentType } = context;
    console.log(`Starting GLM OCR process for type: ${documentType}`);

    const isPdfMagic = buffer.length > 4 && 
                       buffer[0] === 0x25 && 
                       buffer[1] === 0x50 && 
                       buffer[2] === 0x44 && 
                       buffer[3] === 0x46;
    const isPdf = isPdfMagic || mime === 'application/pdf' || documentType.endsWith('.pdf');

    let processingBuffer = buffer;
    let processingMime = mime || 'image/png';

    if (isPdf) {
      console.log(`Converting PDF to Image for GLM OCR: ${documentType}`);
      const tmpId = Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const tmpDir = path.join(os.tmpdir(), `glm_ocr_${tmpId}`);
      fs.mkdirSync(tmpDir, { recursive: true });

      const tmpPdf = path.join(tmpDir, 'source.pdf');
      fs.writeFileSync(tmpPdf, buffer);

      try {
        execSync(`pdftoppm -png -r 150 -f 1 -l 1 "${tmpPdf}" "${tmpDir}/page"`, { stdio: 'ignore' });
        const files = fs.readdirSync(tmpDir).filter(f => f.endsWith('.png')).sort();
        if (files.length > 0) {
          processingBuffer = fs.readFileSync(path.join(tmpDir, files[0]));
          processingMime = 'image/png';
        }
      } catch (err) {
        console.error('Error rasterizing PDF for GLM OCR:', err.message);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    }

    const base64Image = `data:${processingMime};base64,${processingBuffer.toString('base64')}`;
    const prompt = `Lakukan OCR pada gambar dokumen ini. Ekstrak dan kembalikan seluruh teks yang terlihat secara berurutan dan terstruktur tanpa penjelasan atau format tambahan.`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'glm-4v',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: base64Image } }
              ]
            }
          ],
          temperature: 0.1,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        throw new Error(`GLM OCR request failed: ${response.statusText}`);
      }

      const resJson = await response.json();
      const extractedText = resJson?.choices?.[0]?.message?.content || '';
      console.log('GLM OCR extraction completed. Length:', extractedText.length);
      return extractedText.trim();
    } catch (error) {
      console.error('GLM OCR recognition failed:', error.message);
      throw error;
    }
  }

  async postprocess(context) {
    // Postprocessing handled dynamically
  }
}

module.exports = GlmOcrEngine;
