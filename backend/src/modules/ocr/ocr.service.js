const Tesseract = require('tesseract.js');
const { PDFParse } = require('pdf-parse');
const { parseDocumentText } = require('./parsers');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

    if (mimetype === 'application/pdf' || type.endsWith('.pdf')) {
      if (type === 'slik') {
        console.log(`Extracting text from PDF for type: ${type}`);
        // Convert Node Buffer to Uint8Array to satisfy strict type checks
        const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        const pdfParser = new PDFParse(uint8Array);
        const pdfData = await pdfParser.getText();
        text = pdfData.text;
        console.log('PDF text extraction completed. Length:', text.length);
      } else {
        console.log(`Converting PDF to Images for OCR for type: ${type}`);
        // For scanned PDFs (Agunan, BPKB), rasterize using pdftoppm then run Tesseract
        const tmpId = Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const tmpDir = path.join('/tmp', `ocr_${tmpId}`);
        fs.mkdirSync(tmpDir, { recursive: true });
        
        const tmpPdf = path.join(tmpDir, 'source.pdf');
        fs.writeFileSync(tmpPdf, buffer);
        
        try {
          // Convert up to first 3 pages to PNG
          execSync(`pdftoppm -png -l 3 "${tmpPdf}" "${tmpDir}/page"`);
          
          const files = fs.readdirSync(tmpDir).filter(f => f.endsWith('.png')).sort();
          for (const file of files) {
            console.log(`Running OCR on ${file}...`);
            const { data: { text: extractedText } } = await Tesseract.recognize(
              path.join(tmpDir, file),
              'ind'
            );
            text += '\n' + extractedText;
          }
        } catch (execErr) {
          console.error('Error during PDF rasterization/OCR:', execErr);
          // Fallback if poppler fails
        } finally {
          // Cleanup
          fs.rmSync(tmpDir, { recursive: true, force: true });
        }
        console.log('PDF OCR extraction completed. Raw text length:', text.length);
      }
    } else {
      console.log(`Starting Tesseract OCR process for type: ${type}`);
      // Tesseract.js recognizes standard image buffers directly
      const { data: { text: extractedText } } = await Tesseract.recognize(
        buffer,
        'ind', // Load Indonesian language data
        {
          logger: m => console.log(`[OCR Tesseract] ${m.status}: ${Math.round(m.progress * 100)}%`)
        }
      );
      text = extractedText;
      console.log('OCR text extraction completed. Raw text length:', text.length);
    }
    
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
