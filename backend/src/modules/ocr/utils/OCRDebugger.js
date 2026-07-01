const fs = require('fs');
const path = require('path');
const os = require('os');

class OCRDebugger {
  /**
   * Log OCR info in a structured way
   */
  static logInfo(context, message, data = null) {
    const logData = data ? JSON.stringify(data, null, 2) : '';
    console.log(`[OCR INFO][${context.documentType || 'unknown'}] ${message} ${logData}`);
  }

  /**
   * Log OCR errors in a structured way
   */
  static logError(context, message, error) {
    console.error(`[OCR ERROR][${context.documentType || 'unknown'}] ${message}`, error?.message || error);
    if (error?.stack) {
      console.error(error.stack);
    }
  }

  /**
   * Save raw OCR text for debugging specific document types
   * 
   * @param {Object} context The OCR context
   */
  static saveDebugData(context) {
    if (!context || !context.documentType || !context.rawText) return;
    
    try {
      if (context.documentType === 'ktp') {
        const debugDir = path.resolve(__dirname, '../../../../../../tmp');
        fs.mkdirSync(debugDir, { recursive: true });
        const debugPath = path.join(debugDir, 'ktp_raw_text.txt');
        fs.writeFileSync(debugPath, context.rawText || '');
        this.logInfo(context, `Full raw text saved to ${debugPath}`);
      }
      
      if (context.documentType === 'slik') {
        const debugPath = '/tmp/slik_raw.txt';
        fs.writeFileSync(debugPath, context.rawText || '');
        this.logInfo(context, `Full raw text saved to ${debugPath}`);
        
        if (context.parsedData) {
          const parsedData = context.parsedData;
          this.logInfo(context, 'Parsed result:', {
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
          });
        }
        
        const text = context.rawText;
        const busanIdx = text.indexOf('BUSSAN');
        const seaIdx = text.indexOf('SEABANK');
        const sampleIdx = busanIdx >= 0 ? busanIdx : seaIdx >= 0 ? seaIdx : 1000;
        this.logInfo(context, `Text around first bank (±500 chars):\n${text.substring(Math.max(0, sampleIdx - 200), sampleIdx + 600)}`);
      }
    } catch (err) {
      this.logError(context, 'Failed to save debug data', err);
    }
  }
}

module.exports = OCRDebugger;
