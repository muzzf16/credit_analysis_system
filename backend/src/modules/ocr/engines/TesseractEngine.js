const BaseEngine = require('./BaseEngine');
const { execFile, execSync } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
const fs = require('fs');
const os = require('os');
const path = require('path');
const FileUtils = require('../utils/fileUtils');
const OCRDebugger = require('../utils/OCRDebugger');

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

  getPsmMode(documentType) {
    switch (documentType) {
      case 'ktp': return 6;          // Uniform block of text (KTP layout)
      case 'shm':
      case 'shm_cover':
      case 'shm_pendaftaran':
      case 'shm_peralihan':
      case 'shm_surat_ukur':
      case 'shm_peta':   return 6;   // Often behaves better as a single uniform block, despite tabular data
      case 'bpkb':       return 4;   // Assume a single column of text of variable sizes
      case 'sppt_pbb':   return 4;   // Assume a single column of text of variable sizes (good for tables with distinct columns/rows)
      case 'surat_nikah': return 4;
      default: return 6;
    }
  }

  // NOTE: Image preprocessing is now handled ENTIRELY by OpenCV Python pipeline
  // (backend/src/services/document-ai/python/preprocessors/ktp.py for KTP,
  //  backend/src/services/document-ai/python/preprocessors/shm.py for SHM, etc.)
  // ImageMagick preprocessing has been REMOVED to avoid double-processing.
  // The buffer received here is already preprocessed by OpenCV before reaching Tesseract.

  /**
   * Run Tesseract OCR with confidence extraction
   * @param {string} imagePath 
   * @param {string} documentType 
   * @returns {Promise<{text: string, confidences: object}>}
   */
  async runTesseractOcrAsync(imagePath, documentType = 'ktp') {
    const psm = this.getPsmMode(documentType);
    let bestResult = { text: '', confidences: { _overall: 0 } };

    // Whitelist per document type
    // SHM: allow period, slash, dash, colon, parentheses for nomor sertifikat, NIB, luas etc.
    const isSHM = documentType === 'shm' || documentType.startsWith('shm_');
    const whitelist = isSHM
      ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -/.,:()\''
      : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -/.,:';

    const lang = process.env.TESSERACT_LANGUAGES || 'ind+eng';
    const oem = process.env.TESSERACT_OEM || '1';
    const timeout = parseInt(process.env.TESSERACT_TIMEOUT_MS) || 45000;

    // NOTE: Image is already preprocessed by OpenCV pipeline before reaching here.
    // No ImageMagick preprocessing is applied — OpenCV handles it all.
    const tmpBase = imagePath.replace(/\.[^.]+$/, `_psm${psm}`);
    try {
      await execFileAsync('tesseract', [
        imagePath,
        tmpBase,
        '-l', lang,
        '--oem', oem,
        '--psm', psm.toString(),
        '-c', `tessedit_char_whitelist=${whitelist}`,
        'txt', 'tsv'
      ], { encoding: 'utf8', timeout: timeout });

      const textPath = `${tmpBase}.txt`;
      const tsvPath  = `${tmpBase}.tsv`;

      let text = '';
      if (fs.existsSync(textPath)) {
        text = fs.readFileSync(textPath, 'utf8');
        fs.unlinkSync(textPath);
      }

      let confidences = { _overall: 0.65 };
      if (fs.existsSync(tsvPath)) {
        const tsvContent = fs.readFileSync(tsvPath, 'utf8');
        const avgConf = this.parseTsvConfidence(tsvContent);
        confidences = { _overall: avgConf, ...this.getFieldConfidences(text.trim(), avgConf, documentType) };
        fs.unlinkSync(tsvPath);
      }

      bestResult = { text: text.trim(), confidences, psm };
    } catch (err) {
      console.warn(`[Tesseract] Execution failed:`, err.message);
    }

    console.log(`[Tesseract] Document Type: ${documentType}`);
    console.log(`[Tesseract] Preprocessing: OpenCV (handled upstream)`);
    console.log(`[Tesseract] Languages: ${lang} | OEM: ${oem} | PSM: ${psm}`);
    if (bestResult.confidences._overall) {
      console.log(`[Tesseract] Overall Confidence: ${(bestResult.confidences._overall * 100).toFixed(1)}%`);
    }

    return { text: bestResult.text, confidences: bestResult.confidences };
  }

  /**
   * Parse TSV file to extract average confidence
   */
  parseTsvConfidence(tsvContent) {
    const lines = tsvContent.trim().split('\n');
    let totalConfidence = 0;
    let count = 0;
    
    for (const line of lines) {
      const parts = line.split('\t');
      // TSV format: level, page_num, block_num, par_num, line_num, word_num, left, top, width, height, conf, text
      if (parts.length >= 12 && !isNaN(parseInt(parts[10])) && parseInt(parts[10]) >= 0) {
        // Only count positive confidences for words that actually have text
        if (parts[11].trim() !== '') {
            totalConfidence += parseInt(parts[10]);
            count++;
        }
      }
    }
    
    // Average confidence is 0-100, convert to 0-1
    return count > 0 ? Math.min(0.85, (totalConfidence / count) / 100) : 0.65;
  }

  /**
   * Approximate field confidences based on overall confidence and text quality.
   * Supports KTP and SHM document types.
   */
  getFieldConfidences(text, overallConf, documentType = 'ktp') {
    const confidences = { _overall: overallConf };
    const upperText = text.toUpperCase();

    // ─── KTP Field Confidences (LOCKED — do not modify) ─────────────────────
    if (documentType === 'ktp' || documentType === 'survey') {
      const nikMatch = upperText.match(/\b\d{16}\b/);
      confidences.nik = nikMatch ? Math.min(0.95, overallConf + 0.1) : overallConf * 0.7;

      const namaMatch = text.match(/([A-Z]{2,}(?:\s+[A-Z]{2,})+)/);
      confidences.nama = namaMatch ? Math.min(0.92, overallConf + 0.15) : overallConf * 0.8;

      const hasDate = /\d{2}[-\/]\d{2}[-\/]\d{4}/.test(upperText);
      confidences.tanggalLahir = hasDate ? overallConf : overallConf * 0.6;
      confidences.tanggal_lahir = confidences.tanggalLahir;

      const hasAddress = /[A-Z]{3,}(?:\s+[A-Z]{3,})*(?:\s+\d{1,3})?/.test(upperText);
      confidences.alamat = hasAddress ? overallConf : overallConf * 0.5;

      const hasKec = /KECAMATAN|KEC\.?\s/i.test(upperText);
      confidences.kecamatan = hasKec ? Math.min(0.88, overallConf + 0.1) : overallConf * 0.6;

      const hasKel = /KELURAHAN|DESA|DE\s*\/.?\s*KEL/i.test(upperText);
      confidences.kelurahan = hasKel ? overallConf : overallConf * 0.6;

      const hasGender = /LAKI-LAKI|PEREMPUAN|LAKI|WANITA/i.test(upperText);
      confidences.gender = hasGender ? 0.9 : overallConf * 0.7;
      confidences.jenis_kelamin = confidences.gender;

      const hasStatus = /BELUM|KAWIN|CERAI/i.test(upperText);
      confidences.statusNikah = hasStatus ? Math.min(0.85, overallConf) : overallConf * 0.5;
      confidences.status_perkawinan = confidences.statusNikah;

      const hasJob = /PEKERJAAN|WIRASWASTA|SWASTA|PEDAGANG|BURUH/i.test(upperText);
      confidences.pekerjaan = hasJob ? overallConf : overallConf * 0.6;

      const hasAgama = /AGAMA|ISLAM|KRISTEN|KATOLIK|HINDU|BUDDHA/i.test(upperText);
      confidences.agama = hasAgama ? 0.92 : overallConf * 0.7;

      const hasWni = /WNI|WNA/i.test(upperText);
      confidences.kewarganegaraan = hasWni ? 0.95 : overallConf * 0.6;

      return confidences;
    }

    // ─── SPPT PBB Field Confidences ──────────────────────────────────────────
    if (documentType === 'sppt_pbb') {
      const hasNJOP = /NJOP/i.test(upperText);
      const hasTotal = /TOTAL|JUMLAH/i.test(upperText);
      confidences.total_njop = (hasNJOP || hasTotal) ? Math.min(0.90, overallConf + 0.15) : overallConf * 0.6;
      return confidences;
    }

    // ─── SHM Field Confidences ───────────────────────────────────────────────
    if (documentType === 'shm' || documentType.startsWith('shm_')) {
      // Nomor Sertifikat: key indicator — boosts overall if found
      const hasNomor = /(?:NOMOR|NO\.?)\s*(?:SERTIFIKAT)?\s*\d+/i.test(upperText) ||
                       /SHM\s*No\./i.test(upperText);
      confidences.nomor_sertifikat = hasNomor ? Math.min(0.92, overallConf + 0.12) : overallConf * 0.6;

      // NIB (Nomor Induk Bidang)
      const hasNIB = /\bNIB\b/i.test(upperText);
      confidences.nib = hasNIB ? Math.min(0.90, overallConf + 0.1) : overallConf * 0.5;

      // Nama Pemegang Hak
      const hasPemegang = /PEMEGANG\s*HAK|ATAS\s*NAMA/i.test(upperText);
      confidences.nama_pemegang_hak = hasPemegang ? Math.min(0.88, overallConf + 0.08) : overallConf * 0.6;
      confidences.atas_nama = confidences.nama_pemegang_hak;

      // Luas Tanah
      const hasLuas = /LUAS|M2|M²|SELUAS/i.test(upperText);
      confidences.luas_m2 = hasLuas ? Math.min(0.88, overallConf + 0.1) : overallConf * 0.5;

      // Desa/Kelurahan + Kecamatan + Kabupaten
      const hasDesa = /\b(?:DESA|KELURAHAN)\b/i.test(upperText);
      confidences.desa_kelurahan = hasDesa ? overallConf : overallConf * 0.55;

      const hasKec = /KECAMATAN/i.test(upperText);
      confidences.kecamatan = hasKec ? Math.min(0.87, overallConf + 0.08) : overallConf * 0.55;

      const hasKab = /KABUPATEN|KOTA/i.test(upperText);
      confidences.kabupaten_kota = hasKab ? Math.min(0.87, overallConf + 0.08) : overallConf * 0.55;

      // Surat Ukur
      const hasSU = /SURAT\s*UKUR/i.test(upperText);
      confidences.nomor_surat_ukur = hasSU ? Math.min(0.85, overallConf + 0.05) : overallConf * 0.5;

      // Hak Tanggungan
      const hasHT = /HAK\s*TANGGUNGAN/i.test(upperText);
      confidences.hak_tanggungan = hasHT ? 0.9 : overallConf;

      // If key SHM fields are found, boost overall confidence
      const keyFieldsFound = [hasNomor, hasNIB, hasLuas, hasDesa, hasKec].filter(Boolean).length;
      if (keyFieldsFound >= 3) {
        confidences._overall = Math.min(0.85, overallConf + 0.05 * keyFieldsFound);
      }

      return confidences;
    }

    // Default: return base confidences
    return confidences;
  }

  async preprocess(context) {
    // Cleanups are handled in recognize
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
        
        // Parallel OCR processing for PDF pages
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
        context.tesseractConfidences = result.confidences;
      } finally {
        try { fs.unlinkSync(tmpPath); } catch {}
      }
      console.log('[Tesseract] Image OCR extraction completed. Text length:', text.length);
    }

    return text;
  }

  async postprocess(context) {
    // Cleanups are handled in recognize
  }
}

module.exports = TesseractEngine;