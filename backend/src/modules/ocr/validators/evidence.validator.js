class EvidenceValidator {
  /**
   * Calculates Evidence Score and reasons for each parsed field
   * @param {OCRContext} context 
   * @returns {Object} map of field evidence
   */
  static calculate(context) {
    const evidenceMap = {};
    const data = context.parsedData;
    const corrections = context.metadata.corrections || [];
    
    // We iterate through all extracted data keys
    for (const key of Object.keys(data)) {
      const value = data[key];
      
      // Initialize evidence object
      const evidence = {
        value: value,
        score: 0,
        reasons: []
      };

      // Skip deeply nested arrays/objects for basic evidence calculation (like slik.facilities)
      if (typeof value === 'object') {
        evidenceMap[key] = evidence;
        continue;
      }
      
      // Baseline score
      if (value === '' || value === null || value === undefined) {
        evidence.score = 0;
        evidence.reasons.push('Nilai tidak ditemukan (kosong)');
        evidenceMap[key] = evidence;
        continue;
      } else {
        evidence.score += 50; // Base score for successfully extracting something
        evidence.reasons.push('Parser berhasil mengekstrak nilai');
      }

      // Check Normalizer Corrections
      // If there's a correction that might be related to this field
      // Simple heuristic: if key is 'nik' and dictionary replaced 'N1K', apply penalty
      const relatedCorrections = corrections.filter(c => c.to.toLowerCase().includes(key.toLowerCase()));
      if (relatedCorrections.length > 0) {
        evidence.score -= 5;
        evidence.reasons.push(`Penalti: Label dikoreksi oleh normalizer (${relatedCorrections.map(c => c.from).join(', ')} -> ${relatedCorrections.map(c => c.to).join(', ')})`);
      } else {
        evidence.score += 10;
        evidence.reasons.push('Tidak ada penalti koreksi label (Original OCR valid)');
      }

      // Format & Business Rules based on field name
      const keyLower = key.toLowerCase();
      
      if (keyLower === 'nik') {
        // Format Rule: 16 digits
        const isStrict16Digits = /^\d{16}$/.test(value);
        if (isStrict16Digits) {
          evidence.score += 25;
          evidence.reasons.push('Format Rule: Tepat 16 digit angka');
          
          // Business Rule: Valid region code (e.g., length checking or specific prefix)
          // Just a basic example check, e.g., not all 0s
          if (!/^0000/.test(value)) {
             evidence.score += 15;
             evidence.reasons.push('Business Rule: Prefix valid');
          }
        } else {
          evidence.score -= 10;
          evidence.reasons.push('Format Rule: Panjang atau karakter NIK tidak valid');
          // Check OCR Quality
          if (/[OIBZS]/.test(value.toUpperCase())) {
            evidence.score -= 10;
            evidence.reasons.push('OCR Quality: Terdapat karakter mencurigakan (O, I, B, Z, S) pada field angka');
          }
        }
      } 
      else if (keyLower === 'nama') {
        if (/^[A-Z\s.,'-]+$/i.test(value)) {
          evidence.score += 35;
          evidence.reasons.push('Format Rule: Hanya berisi huruf dan spasi');
        } else if (/\d/.test(value)) {
          evidence.score -= 15;
          evidence.reasons.push('Format Rule: Terdapat angka pada field Nama');
        }
      }
      else {
        // Generic rules for other fields
        if (value.length > 3) {
          evidence.score += 30;
          evidence.reasons.push('Format Rule: Panjang nilai wajar');
        }
      }

      // Cap score between 0 and 100
      evidence.score = Math.max(0, Math.min(100, evidence.score));
      
      evidenceMap[key] = evidence;
    }

    return evidenceMap;
  }
}

module.exports = EvidenceValidator;
