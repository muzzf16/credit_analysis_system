const BaseEngine = require('./BaseEngine');
const { execSync, execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
const fs = require('fs');
const os = require('os');
const path = require('path');

class TesseractEngine extends BaseEngine {
  getExtensionFromMime(mimetype = '') {
    const mapping = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/webp': '.webp',
      'image/tiff': '.tiff'
    };
    return mapping[mimetype.toLowerCase()] || '.png';
  }

  async runTesseractOcrAsync(imagePath) {
    try {
      // Optimasi gambar KTP/Dokumen untuk Tesseract menggunakan ImageMagick
      await execFileAsync('convert', [
        imagePath, 
        '-colorspace', 'gray', 
        '-normalize', 
        '-resize', '200%', 
        imagePath
      ]);
    } catch (err) {
      console.warn('ImageMagick preprocessing failed, continuing with raw image', err.message);
    }

    try {
      const { stdout } = await execFileAsync('tesseract', [imagePath, 'stdout', '-l', 'ind'], { encoding: 'utf8' });
      return stdout.trim();
    } catch (error) {
      const details = error.stderr ? error.stderr.toString() : error.message;
      throw new Error(`Tesseract OCR gagal: ${details}`);
    }
  }

  async preprocess(context) {
    // We handle the file writing inside recognize to maintain exact original flow, 
    // but we can set up any necessary state here if needed.
  }

  async recognize(context) {
    const { buffer, mime, documentType } = context;
    let text = '';

    const isPdfMagic = buffer.length > 4 && 
                       buffer[0] === 0x25 && 
                       buffer[1] === 0x50 && 
                       buffer[2] === 0x44 && 
                       buffer[3] === 0x46;

    const isPdf = isPdfMagic || mime === 'application/pdf' || documentType.endsWith('.pdf');

    if (isPdf) {
      console.log(`Converting PDF to Images for OCR for type: ${documentType}`);
      const tmpId = Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const tmpDir = path.join(os.tmpdir(), `ocr_${tmpId}`);
      fs.mkdirSync(tmpDir, { recursive: true });

      const tmpPdf = path.join(tmpDir, 'source.pdf');
      fs.writeFileSync(tmpPdf, buffer);

      try {
        const maxPages = documentType === 'shm' ? 4 : 3;
        execSync(`pdftoppm -png -r 300 -l ${maxPages} "${tmpPdf}" "${tmpDir}/page"`, { stdio: 'ignore' });

        const files = fs.readdirSync(tmpDir).filter(f => f.endsWith('.png')).sort();
        
        const ocrPromises = files.map(async (file) => {
          const imagePath = path.join(tmpDir, file);
          console.log(`Running Tesseract OCR on ${file} (Parallel)...`);
          const extractedText = await this.runTesseractOcrAsync(imagePath);
          return extractedText;
        });

        const results = await Promise.all(ocrPromises);
        
        for (const extractedText of results) {
          text += `\n${extractedText}`;
        }
      } catch (execErr) {
        console.error('Error during PDF rasterization/OCR:', execErr);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }

      console.log('PDF OCR extraction completed. Raw text length:', text.length);
    } else {
      console.log(`Starting Tesseract OCR process for type: ${documentType}`);
      const ext = this.getExtensionFromMime(mime);
      const tmpPath = path.join(os.tmpdir(), `ocr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
      fs.writeFileSync(tmpPath, buffer);

      try {
        text = await this.runTesseractOcrAsync(tmpPath);
      } finally {
        try {
          fs.unlinkSync(tmpPath);
        } catch (cleanupErr) {
          // Ignore cleanup errors
        }
      }

      console.log('OCR text extraction completed. Raw text length:', text.length);
    }

    return text;
  }

  async postprocess(context) {
    // Cleanups are already handled inside recognize
  }
}

module.exports = TesseractEngine;
