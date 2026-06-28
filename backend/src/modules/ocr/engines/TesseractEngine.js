const BaseEngine = require('./BaseEngine');
const { execFile, execSync } = require('child_process');
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

  /**
   * Run Tesseract OCR with confidence extraction
   * @param {string} imagePath 
   * @param {string} documentType 
   * @returns {Promise<{text: string, confidences: object}>}
   */
  async runTesseractOcrAsync(imagePath, documentType = 'ktp') {
    const tmpOut = imagePath.replace(/\.[^.]+$/, '_preprocessed.png');
    
    try {
      // Optimized preprocessing based on document type
      let args = [imagePath];
      
      if (documentType === 'ktp') {
        // KTP-specific preprocessing: preserve blue watermark, enhance contrast
        args.push(
          '-deskew', '40%',
          '-sharpen', '0x1',
          '-contrast-stretch', '0',
          '-noise', '2',
          '-resize', '150%',
          tmpOut
        );
      } else {
        // General document preprocessing
        args.push(
          '-colorspace', 'gray',
          '-normalize',
          '-deskew', '40%',
          '-sharpen', '0x1',
          '-noise', '2',
          '-resize', '150%',
          tmpOut
        );
      }
      
      await execFileAsync('convert', args);
    } catch (err) {
      console.warn(`[Tesseract] Preprocessing warning for ${documentType}:`, err.message);
      // Fallback to original if preprocessing fails
      if (fs.existsSync(tmpOut)) {
        fs.unlinkSync(tmpOut);
      }
    }

    const actualPath = fs.existsSync(tmpOut) ? tmpOut : imagePath;
    
    // Get text output
    const { stdout: text } = await execFileAsync('tesseract', [
      actualPath,
      'stdout',
      '-l', 'ind',
      '--oem', '1',
      '--psm', '6'
    ], { encoding: 'utf8', timeout: 30000 });

    // Get confidence scores using TSV format
    const tmpTsv = actualPath.replace(/\.[^.]+$/, '.tsv');
    let confidences = {};
    try {
      await execFileAsync('tesseract', [
        actualPath,
        tmpTsv.replace(/\.[^.]+$/, ''), // output prefix without extension
        '-l', 'ind',
        '--oem', '1',
        'tsv'
      ], { encoding: 'utf8', timeout: 30000 });
      
      const tsvContent = fs.readFileSync(tmpTsv + '.tsv', 'utf8');
      const avgConf = this.parseTsvConfidence(tsvContent);
      confidences = { _overall: avgConf, ...this.getFieldConfidences(text.trim(), avgConf) };
      
      fs.unlinkSync(tmpTsv + '.tsv');
    } catch (tsvErr) {
      // TSV extraction may fail, use default confidence
      console.warn('[Tesseract] Could not extract confidence scores:', tsvErr.message);
      confidences = { _overall: 0.65 };
    }

    if (fs.existsSync(tmpOut)) {
      fs.unlinkSync(tmpOut);
    }
    
    return { text: text.trim(), confidences };
  }

  /**
   * Parse TSV file to extract average confidence
   * @param {string} tsvContent 
   * @returns {number} confidence 0-1
   */
  parseTsvConfidence(tsvContent) {
    const lines = tsvContent.trim().split('\n');
    let totalConfidence = 0;
    let count = 0;
    
    for (const line of lines) {
      const parts = line.split('\t');
      // TSV format: level, page_num, block_num, par_num, line_num, word_num, left, top, width, height, conf, text
      if (parts.length >= 11 && !isNaN(parseInt(parts[10])) && parts[10] > 0) {
        totalConfidence += parseInt(parts[10]);
        count++;
      }
    }
    
    // Average confidence is 0-100, convert to 0-1
    return count > 0 ? Math.min(0.85, (totalConfidence / count) / 100) : 0.65;
  }

  /**
   * Approximate field confidences based on overall confidence and text quality
   * @param {string} text 
   * @param {number} overallConf 
   * @returns {object} field confidences 0-1
   */
  getFieldConfidences(text, overallConf) {
    const confidences = {};
    const upperText = text.toUpperCase();
    
    // Check for NIK (16 digits) - high confidence if pattern is clean
    const nikMatch = upperText.match(/\b\d{16}\b/);
    confidences.nik = nikMatch ? Math.min(0.95, overallConf + 0.1) : overallConf * 0.7;
    
    // Name detection - if starts with valid name pattern
    const namaMatch = text.match(/([A-Z]{2,}(?:\s+[A-Z]{2,})+)/);
    confidences.nama = namaMatch ? Math.min(0.92, overallConf + 0.15) : overallConf * 0.8;
    
    // Date detection
    const hasDate = /\d{2}[-\/]\d{2}[-\/]\d{4}/.test(upperText);
    confidences.tanggalLahir = hasDate ? overallConf : overallConf * 0.6;
    confidences.tanggal_lahir = confidences.tanggalLahir;
    
    // Address detection
    const hasAddress = /[A-Z]{3,}(?:\s+[A-Z]{3,})*(?:\s+\d{1,3})?/.test(upperText);
    confidences.alamat = hasAddress ? overallConf : overallConf * 0.5;
    
    // Kecamatan detection
    const hasKec = /KECAMATAN|KEC\.?\s/i.test(upperText);
    confidences.kecamatan = hasKec ? Math.min(0.88, overallConf + 0.1) : overallConf * 0.6;
    
    // Kelurahan detection
    const hasKel = /KELURAHAN|DESA|DE\s*\/.?\s*KEL/i.test(upperText);
    confidences.kelurahan = hasKel ? overallConf : overallConf * 0.6;
    
    // Gender detection
    const hasGender = /LAKI-LAKI|PEREMPUAN|LAKI|WANITA/i.test(upperText);
    confidences.gender = hasGender ? 0.9 : overallConf * 0.7;
    confidences.jenis_kelamin = confidences.gender;
    
    // Status nikah detection
    const hasStatus = /BELUM|KAWIN|CERAI/i.test(upperText);
    confidences.statusNikah = hasStatus ? Math.min(0.85, overallConf) : overallConf * 0.5;
    confidences.status_perkawinan = confidences.statusNikah;
    
    // Pekerjaan detection
    const hasJob = /PEKERJAAN|WIRASWASTA|SWASTA|PEDAGANG|BURUH/i.test(upperText);
    confidences.pekerjaan = hasJob ? overallConf : overallConf * 0.6;
    
    // Agama detection
    const hasAgama = /AGAMA|ISLAM|KRISTEN|KATOLIK|HINDU|BUDDHA/i.test(upperText);
    confidences.agama = hasAgama ? 0.92 : overallConf * 0.7;
    
    // Kewarganegaraan detection
    const hasWni = /WNI|WNA/i.test(upperText);
    confidences.kewarganegaraan = hasWni ? 0.95 : overallConf * 0.6;
    
    return confidences;
  }

  async preprocess(context) {
    // We handle the file writing inside recognize to maintain exact original flow, 
    // but we can set up any necessary state here if needed.
  }

  async recognize(context) {
    const { buffer, mime, documentType } = context;
    let text = '';
    context.confidence = 0.65; // Default Tesseract confidence

    const isPdfMagic = buffer.length > 4 && 
                       buffer[0] === 0x25 && 
                       buffer[1] === 0x50 && 
                       buffer[2] === 0x44 && 
                       buffer[3] === 0x46;

    const isPdf = isPdfMagic || mime === 'application/pdf' || documentType.endsWith('.pdf');

    if (isPdf) {
      console.log(`[Tesseract] Converting PDF to Images for type: ${documentType}`);
      const tmpId = Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const tmpDir = path.join(os.tmpdir(), `ocr_${tmpId}`);
      fs.mkdirSync(tmpDir, { recursive: true });

      const tmpPdf = path.join(tmpDir, 'source.pdf');
      fs.writeFileSync(tmpPdf, buffer);

      try {
        const maxPages = documentType === 'shm' ? 4 : 3;
        execSync(`pdftoppm -png -r 300 -l ${maxPages} "${tmpPdf}" "${tmpDir}/page"`, { stdio: 'ignore' });

        const files = fs.readdirSync(tmpDir).filter(f => f.endsWith('.png')).sort();
        
        // Parallel OCR processing for PDF pages with confidence
        const results = await Promise.all(
          files.map(async (file) => {
            const imagePath = path.join(tmpDir, file);
            try {
              return await this.runTesseractOcrAsync(imagePath, documentType);
            } catch (err) {
              console.error(`[Tesseract] Failed to process ${file}:`, err.message);
              return { text: '', confidences: {} };
            }
          })
        );
        
        text = results.map(r => r.text).join('\n');
        // Average confidence across pages
        const avgConf = results.reduce((sum, r) => sum + (r.confidences._overall || 0.65), 0) / results.length;
        context.confidence = Math.min(0.85, avgConf);
      } catch (execErr) {
        console.error('[Tesseract] PDF rasterization error:', execErr.message);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }

      console.log('[Tesseract] PDF OCR extraction completed. Text length:', text.length);
    } else {
      console.log(`[Tesseract] Starting OCR process for type: ${documentType}`);
      const ext = this.getExtensionFromMime(mime);
      const tmpPath = path.join(os.tmpdir(), `ocr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
      fs.writeFileSync(tmpPath, buffer);

      try {
        const result = await this.runTesseractOcrAsync(tmpPath, documentType);
        text = result.text;
        context.confidence = result.confidences._overall || 0.65;
        // Store Tesseract field confidences in context for PipelineResult
        context.tesseractConfidences = result.confidences;
      } finally {
        try { fs.unlinkSync(tmpPath); } catch {}
      }

      console.log('[Tesseract] Image OCR extraction completed. Text length:', text.length);
    }

    return text;
  }

  async postprocess(context) {
    // Cleanups are already handled inside recognize
  }
}

module.exports = TesseractEngine;