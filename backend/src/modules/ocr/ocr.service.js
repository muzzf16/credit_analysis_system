const { PDFParse } = require('pdf-parse');
const { parseDocumentText } = require('./parsers');
const { execFileSync, execSync, execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
const fs = require('fs');
const os = require('os');
const path = require('path');

function getExtensionFromMime(mimetype = '') {
  const mapping = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/webp': '.webp',
    'image/tiff': '.tiff'
  };

  return mapping[mimetype.toLowerCase()] || '.png';
}

async function runTesseractOcrAsync(imagePath) {
  try {
    // Optimasi gambar KTP/Dokumen untuk Tesseract menggunakan ImageMagick
    // -colorspace gray: ubah ke hitam putih
    // -normalize: perbaiki kontras otomatis
    // -resize 200%: perbesar resolusi agar teks kecil lebih terbaca
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

/**
 * Process OCR/Text extraction on file buffer
 * @param {Buffer} buffer - File buffer
 * @param {string} type - ktp, shm, bpkb, surat_nikah
 * @param {string} mimetype - File mimetype
 * @returns {Promise<object>}
 */
async function processOCR(buffer, type, mimetype = '') {
  if (!buffer) throw { status: 400, message: 'Buffer file kosong atau tidak valid.' };
  if (!type) throw { status: 400, message: 'Tipe dokumen wajib ditentukan.' };

  try {
    let text = '';

    // Check for PDF signature (%PDF-)
    const isPdfMagic = buffer.length > 4 && 
                       buffer[0] === 0x25 && 
                       buffer[1] === 0x50 && 
                       buffer[2] === 0x44 && 
                       buffer[3] === 0x46;

    if (isPdfMagic || mimetype === 'application/pdf' || type.endsWith('.pdf')) {
      if (type === 'slik') {
        console.log(`Extracting text from PDF for type: ${type}`);
        const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        const pdfParser = new PDFParse(uint8Array);
        const pdfData = await pdfParser.getText();
        text = pdfData.text;
        console.log('PDF text extraction completed. Length:', text.length);
      } else {
        console.log(`Converting PDF to Images for OCR for type: ${type}`);
        const tmpId = Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const tmpDir = path.join(os.tmpdir(), `ocr_${tmpId}`);
        fs.mkdirSync(tmpDir, { recursive: true });

        const tmpPdf = path.join(tmpDir, 'source.pdf');
        fs.writeFileSync(tmpPdf, buffer);

        try {
          const maxPages = type === 'shm' ? 4 : 3;
          execSync(`pdftoppm -png -r 300 -l ${maxPages} "${tmpPdf}" "${tmpDir}/page"`, { stdio: 'ignore' });

          const files = fs.readdirSync(tmpDir).filter(f => f.endsWith('.png')).sort();
          
          // Proses semua halaman secara paralel/bersamaan
          const ocrPromises = files.map(async (file) => {
            const imagePath = path.join(tmpDir, file);
            console.log(`Running Tesseract OCR on ${file} (Parallel)...`);
            const extractedText = await runTesseractOcrAsync(imagePath);
            return extractedText;
          });

          // Tunggu semua halaman selesai diproses
          const results = await Promise.all(ocrPromises);
          
          // Gabungkan teks (urutan array hasil Promise.all sesuai dengan urutan file)
          for (const extractedText of results) {
            text += `\n${extractedText}`;
          }
        } catch (execErr) {
          console.error('Error during PDF rasterization/OCR:', execErr);
        } finally {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        }

        console.log('PDF OCR extraction completed. Raw text length:', text.length);
      }
    } else {
      console.log(`Starting Tesseract OCR process for type: ${type}`);
      const ext = getExtensionFromMime(mimetype);
      const tmpPath = path.join(os.tmpdir(), `ocr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
      fs.writeFileSync(tmpPath, buffer);

      try {
        text = await runTesseractOcrAsync(tmpPath);
      } finally {
        try {
          fs.unlinkSync(tmpPath);
        } catch (cleanupErr) {
          // Ignore cleanup errors
        }
      }

      console.log('OCR text extraction completed. Raw text length:', text.length);
    }
    
    // Debug log for OCR text
    console.log(`[OCR DEBUG] Type: ${type}, Raw Text:\n${text}`);

    // Parse the extracted text
    const parsedData = parseDocumentText(text, type);
    
    // Debug log for SLIK
    if (type === 'slik') {
      console.log('[OCR SLIK] Parsed result:', JSON.stringify({
        totalFasilitas: parsedData.totalFasilitas,
        totalPlafon: parsedData.totalPlafon,
        totalBakiDebet: parsedData.totalBakiDebet,
        kolektibilitasTertinggi: parsedData.kolektibilitasTertinggi,
        facilities: parsedData.detailSlik?.map(f => ({
          bank: f.bank,
          plafon: f.plafon,
          bakiDebet: f.bakiDebet,
          jatuhTempo: f.jatuhTempo,
          kolektibilitas: f.kolektibilitas
        }))
      }, null, 2));
      
      // Also log full text segment around first bank mention to understand PDF structure
      const busanIdx = text.indexOf('BUSSAN');
      const seaIdx = text.indexOf('SEABANK');
      const sampleIdx = busanIdx >= 0 ? busanIdx : seaIdx >= 0 ? seaIdx : 1000;
      console.log('[OCR SLIK] Text around first bank (±500 chars):\n', 
        text.substring(Math.max(0, sampleIdx - 200), sampleIdx + 600));
      
      // SAVE THE FULL RAW TEXT TO A FILE FOR DEBUGGING
      require('fs').writeFileSync('/tmp/slik_raw.txt', text);
      console.log('[OCR SLIK] Full raw text saved to /tmp/slik_raw.txt');
    }
    
    return {
      success: true,
      type,
      rawText: text,
      data: parsedData
    };
  } catch (error) {
    console.error('OCR/PDF processing failed:', error);
    throw { status: 500, message: `Gagal memproses file: ${error.message}` };
  }
}

module.exports = {
  processOCR
};
