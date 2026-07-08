const documentAiService = require('../../services/document-ai/document-ai.service');
const { success, error } = require('../../utils/response');
const GlmOcrClient = require('./ocr-client');
const ocrMapper = require('./ocr-mapper');

/**
 * Helper to process document extraction generic handler
 * @param {object} req 
 * @param {object} res 
 * @param {string} type 
 */
async function processDocument(req, res, type) {
  try {
    if (!req.file) {
      return error(res, 'File gambar/dokumen wajib diunggah.', 400);
    }

    const result = await documentAiService.extractDocumentData(
      req.file.buffer,
      type,
      req.file.mimetype,
      req.file.originalname
    );

    return success(res, result, `Ekstraksi ${type.toUpperCase()} berhasil.`);
  } catch (err) {
    console.error(`Error processing ${type}:`, err);
    return error(res, err.message || `Gagal memproses dokumen ${type.toUpperCase()}.`, err.status || 500);
  }
}

/**
 * Handle POST /api/document/ktp
 */
async function processKTP(req, res) {
  try {
    if (!req.file) {
      return error(res, 'File gambar/dokumen wajib diunggah.', 400);
    }

    // Call external GLM OCR Service
    let ocrResult;
    let engineUsed = 'glm';
    
    try {
      ocrResult = await GlmOcrClient.uploadKtp(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );

      if (!ocrResult || !ocrResult.success) {
        const errMsg = ocrResult?.errors?.[0]?.message || 'Gagal mengekstrak data dari KTP via GLM OCR Service.';
        return error(res, errMsg, 422);
      }

      console.log('[DEBUG] GLM OCR Response:', JSON.stringify(ocrResult, null, 2));

      // Map KtpOcrResponse to Debtor DTO
      ocrResult = ocrMapper.mapOcrToDebtorDto(ocrResult);
    } catch (glmError) {
      // Check for GLM service unavailability - fallback to documentAiService (has Tesseract fallback chain)
      const isUnavailable = glmError.message === 'GLM OCR model unavailable' ||
                            glmError.message.includes('fetch failed') ||
                            glmError.message.includes('ECONNREFUSED') ||
                            glmError.message.includes('connect ECONNREFUSED') ||
                            glmError.message.includes('GLM OCR Service error (503)') ||
                            glmError.message.includes('GLM OCR Service error (500)') ||
                            glmError.message.includes('network error') ||
                            glmError.message.includes('aborted') ||
                            glmError.message.includes('abort');
      
      if (isUnavailable) {
        console.warn('[Document AI] GLM OCR service unavailable, falling back to Tesseract OCR');
        engineUsed = 'tesseract';
        const fallbackResult = await documentAiService.extractDocumentData(
          req.file.buffer,
          'ktp',
          req.file.mimetype,
          req.file.originalname
        );
        // Build response matching GLM format with confidences
        ocrResult = {
          success: true,
          engineUsed: fallbackResult.engineUsed,
          data: fallbackResult.data,
          confidences: fallbackResult.confidences || {
            nik: 0.7,
            nama: 0.7,
            alamat: 0.6,
            kecamatan: 0.6
          }
        };
      } else {
        throw glmError; // Re-throw other errors
      }
    }

    return success(res, ocrResult, `Ekstraksi KTP berhasil via ${engineUsed}.`);
  } catch (err) {
    console.error('Error in processKTP:', err);
    return error(res, err.message || 'Gagal memproses KTP.', err.status || 500);
  }
}


/**
 * Handle POST /api/document/kk
 */
async function processKK(req, res) {
  return processDocument(req, res, 'kk');
}

/**
 * Handle POST /api/document/npwp
 */
async function processNPWP(req, res) {
  return processDocument(req, res, 'npwp');
}

/**
 * Handle POST /api/document/shm
 */
async function processSHM(req, res) {
  return processDocument(req, res, 'shm');
}

/**
 * Handle POST /api/document/bpkb
 */
async function processBPKB(req, res) {
  return processDocument(req, res, 'bpkb');
}

/**
 * Handle POST /api/document/sppt_pbb
 */
async function processSpptPbb(req, res) {
  return processDocument(req, res, 'sppt_pbb');
}

/**
 * Handle POST /api/document/survey
 */
async function processSurvey(req, res) {
  return processDocument(req, res, 'survey');
}

/**
 * Handle POST /api/document/surat_nikah
 */
async function processSuratNikah(req, res) {
  return processDocument(req, res, 'surat_nikah');
}

/**
 * Handle POST /api/document/shm/page
 * Ekstraksi per-halaman SHM dengan prompt spesifik.
 * Body: page_type = 'cover' | 'pendaftaran' | 'peralihan' | 'surat_ukur' | 'peta'
 *
 * Sesi 41 — ditambahkan parser untuk:
 *  - Field lokasi: provinsi, kabupaten_kota, kecamatan, desa_kelurahan
 *  - keadaan_tanah (sawah/ladang/pekarangan dsb)
 *  - nomor_surat_ukur (format NNNNN/DESA/TAHUN)
 *  - nib (Nomor Identifikasi Bidang, format NNNNNNNNN.NNNNN)
 *  - batas_utara, batas_selatan, batas_timur, batas_barat (dari peta/surat ukur)
 *  - nama_tetangga[] sebagai array [Utara, Selatan, Timur, Barat]
 */
async function processSHMPage(req, res) {
  try {
    if (!req.file) {
      return error(res, 'File gambar/dokumen wajib diunggah.', 400);
    }

    const validTypes = ['cover', 'pendaftaran', 'peralihan', 'surat_ukur', 'peta'];
    const pageType = (req.body.page_type || '').toLowerCase().trim();

    if (!validTypes.includes(pageType)) {
      return error(res, `page_type tidak valid. Pilihan: ${validTypes.join(', ')}`, 400);
    }

    const type = `shm_${pageType}`;
    console.log(`[Document AI] SHM page upload: halaman=${pageType} type=${type}. Using SHM pipeline for extraction.`);

    const result = await documentAiService.extractDocumentData(
      req.file.buffer,
      type,
      req.file.mimetype,
      req.file.originalname
    );

    // Map output ke schema SHM dengan parser custom
    const rawText = result.rawText || '';
    console.log(`\n\n--- RAW TEXT START (${type}) ---`);
    console.log(rawText);
    console.log(`--- RAW TEXT END ---\n\n`);

    // ─── Helper: cari nilai setelah pola regex, toleran multi-line ────────────
    const findAfter = (regexPattern) => {
      const match = rawText.match(regexPattern);
      return match ? match[1].replace(/[\n\r]+/g, ' ').trim() : '';
    };

    const findNumberAfter = (regexPattern) => {
      const match = rawText.match(regexPattern);
      if (match) {
        const cleanNumberStr = match[1].replace(/[^0-9]/g, '');
        return parseFloat(cleanNumberStr) || 0;
      }
      return 0;
    };

    // ─── Helper: multi-strategy ekstraksi field SHM ──────────────────────────
    const lines = rawText.split('\n');
    const labelKeywords = /^(provinsi|propinsi|kabupaten|kota|kecamatan|desa|kelurahan|keadaan|tanah|nomor|peta|lembar|kotak|luas|tanda|batas|berupa|kantor|pertanahan|nomor\s*peta)$/i;
    
    const cleanLine = (s) => {
      // Ganti semua karakter non-alfabet (tanda baca, angka) menjadi spasi
      let v = s.replace(/[^A-Za-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
      
      // Hapus kata-kata berukuran 1 huruf (noise OCR seperti 'x', 'i', 'j') dan kata noise spesifik
      const noise = ['tn', 'mi', 'oo'];
      v = v.split(' ').filter(w => w.length > 1 && !noise.includes(w.toLowerCase())).join(' ');

      if (v.length < 3) return '';
      if (labelKeywords.test(v)) return '';
      return v;
    };

    const extractField = (labelRe) => {
      const re = new RegExp(labelRe, 'i');
      for (let i = 1; i < lines.length; i++) {
        if (re.test(lines[i])) {
          for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
            const v = cleanLine(lines[j]);
            if (v && v.length >= 2) return v;
          }
        }
      }
      const re2 = new RegExp(`(?:${labelRe})[^:\\n]*:\\s*([^\\n]+)`, 'i');
      const m2 = rawText.match(re2);
      if (m2) {
        const v = cleanLine(m2[1]);
        if (v && v.length >= 2) return v;
      }
      const re3 = new RegExp(labelRe, 'i');
      for (let i = 0; i < lines.length - 1; i++) {
        if (re3.test(lines[i])) {
          for (let j = i + 1; j <= Math.min(lines.length - 1, i + 3); j++) {
            const v = cleanLine(lines[j]);
            if (v && v.length >= 2) return v;
          }
        }
      }
      return '';
    };

    // ─── Helper: parse batas tanah arah mata angin ────────────────────────────
    const parseBatas = (arahPattern) => {
      const re1 = new RegExp(`(?:SEBELAH\\s*)?${arahPattern}[\\s:;]*([A-Za-z0-9\\s.,/\\-'()]{3,80})`, 'i');
      const m1 = rawText.match(re1);
      if (m1) {
        const val = m1[1].split('\n')[0].trim().replace(/\s+/g, ' ');
        if (val.length >= 3 && /[A-Za-z]/.test(val)) return val;
      }
      const re2 = new RegExp(`(?:SEBELAH\\s*)?${arahPattern}[^\\n]*\\n\\s*([A-Za-z0-9\\s.,/\\-'()]{3,60})`, 'i');
      const m2 = rawText.match(re2);
      if (m2) return m2[1].trim().replace(/\s+/g, ' ');
      return '';
    };

    // 1. NOMOR SERTIFIKAT
    let nomorSertifikat = findAfter(/No\.?[\s:;]*([0-9\s]{3,20})/i)
                          || findAfter(/HAK\s*MILIK\s*(?:No\.?)?[\s:;]*([0-9\s]{3,20})/i)
                          || '';
    nomorSertifikat = nomorSertifikat.replace(/\s+/g, '');
    if (nomorSertifikat && !nomorSertifikat.toUpperCase().startsWith('M')) {
      nomorSertifikat = `M. ${nomorSertifikat}`;
    } else if (!nomorSertifikat) {
      nomorSertifikat = '';
    }

    // 2. LUAS TANAH
    let luasM2 = findNumberAfter(/Luas\s*(?:Tanah)?[\s:;]*([0-9.,\s]+)(?:m|M)/i)
                 || findNumberAfter(/([0-9.,\s]+)\s*[mM]\s*(?:2|²|z|Z|\/|)[^\n]*\n[^\n]*Luas/i)
                 || findNumberAfter(/Luas[^\n]*\n[^\n]*?([0-9.,\s]+)\s*[mM]/i)
                 || findNumberAfter(/Luas[\s:;]*([0-9.,\s]+)/i);

    // 3. LUAS BANGUNAN
    let luasBangunan = findNumberAfter(/Luas\s*Bangunan[\s:;]*([0-9.,\s]+)(?:m|M)?/i);

    // 4. NAMA PEMEGANG HAK
    let nama = findAfter(/NAMA\s*PEMEGANG\s*HAK[\s:;]*([A-Za-z\s.,'-]{5,50})/i);
    if (!nama || nama.length < 5 || nama.includes("Pose LA")) {
       const multiLineMatch = rawText.match(/PEMEGANG\s*HAK[^\n]*\n[^\n]*?([A-Z]{3,}(?:\s+[A-Z]{3,})+)/);
       if (multiLineMatch) nama = multiLineMatch[1].trim();
    }
    if (!nama || nama.length < 5) {
       nama = findAfter(/PEMEGANG\s*HAK[\s:;]*([A-Za-z\s.,'-]{5,50})/i)
              || findAfter(/NAMA[\s:;]*([A-Za-z\s.,'-]{5,50})/i)
              || '';
    }

    // 5. LOKASI — multi-strategy: nilai SEBELUM label (Tesseract reads right col first)
    // rawText aktual: "JAWA TENGAH\nProvinsi :" → ambil baris sebelum "Provinsi"
    // rawText aktual: "BATANG\nKabupaten / Kote:" → ambil baris sebelum "Kabupaten"
    const provinsi      = extractField('Provinsi|Propinsi');
    const kabupatenKota = extractField('Kabupaten');
    const kecamatan     = extractField('Kecamatan');
    const desaKelurahan = extractField('(?:Desa|Kelurahan)');

    // 6. KEADAAN TANAH
    // rawText aktual: "Sebidangtanahsawah.\n... Keadaan Tanah :"
    // Nilai muncul SEBELUM label "Keadaan Tanah" → extractField tangkap "Sebidangtanahsawah"
    let keadaanTanah = extractField('Keadaan\\s*Tanah');
    // Normalkan kata yang bergabung tanpa spasi dari OCR (Sebidangtanahsawah → Sebidang tanah sawah)
    if (keadaanTanah) {
      keadaanTanah = keadaanTanah
        .replace(/Sebidang(?=tanah)/i, 'Sebidang ')
        .replace(/tanah(?=sawah|ladang|kebun|pekarangan)/i, 'tanah ')
        .replace(/\s+/g, ' ').trim();
    }
    // Fallback: cari "tanah sawah/ladang/dll" di rawText
    if (!keadaanTanah) {
      const km = rawText.match(/tanah\s+(?:sawah|ladang|kebun|pekarangan|perumahan|kering|basah)/i);
      if (km) keadaanTanah = km[0].trim();
    }

    // 7. NOMOR SURAT UKUR
    let nomorSuratUkur = '';
    const suMatch1 = rawText.match(/(?:NOMOR|No\.?)\s*[:;]?\s*(\d{4,6}\/[A-Z0-9]+\/\d{4})/i);
    if (suMatch1) nomorSuratUkur = suMatch1[1].toUpperCase().trim();
    if (!nomorSuratUkur) {
      const suMatch2 = rawText.match(/\b(\d{4,6}\/[A-Z]{3,}\/\d{4})\b/i);
      if (suMatch2) nomorSuratUkur = suMatch2[1].toUpperCase().trim();
    }

    // 8. NIB
    let nib = '';
    const nibM1 = rawText.match(/\bNIB\b\s*[:;]?\s*([0-9]{8,11}\.?[0-9]{0,6})/i);
    if (nibM1) nib = nibM1[1].includes('.') ? nibM1[1].trim() : nibM1[1].trim();
    if (!nib) {
      const nibM2 = rawText.match(/\b([0-9]{8,11})\.([0-9]{4,6})\b/);
      if (nibM2) nib = `${nibM2[1]}.${nibM2[2]}`;
    }

    const kodeDokumenParts = [];
    if (nib) kodeDokumenParts.push(`NIB: ${nib}`);
    if (nomorSuratUkur) kodeDokumenParts.push(`SU: ${nomorSuratUkur}`);

    // 9. BATAS TANAH
    const batasUtara   = parseBatas('UTARA');
    const batasSelatan = parseBatas('SELATAN');
    const batasTimur   = parseBatas('TIMUR');
    const batasBarat   = parseBatas('BARAT');
    const namaTetangga = [batasUtara, batasSelatan, batasTimur, batasBarat].filter(Boolean);

    // 10. KANTOR PERTANAHAN
    const kantorPertanahan = extractField('(?:Kantor\\s*Pertanahan|BPN)');

    const mappedData = {
      nomor_sertifikat:  nomorSertifikat === 'M. ' ? '' : nomorSertifikat,
      nama_pemegang_hak: nama,
      atas_nama:         nama,
      luas_m2:           luasM2,
      luas_bangunan:     luasBangunan,
      provinsi:          provinsi,
      kabupaten_kota:    kabupatenKota,
      kecamatan:         kecamatan,
      desa_kelurahan:    desaKelurahan,
      keadaan_tanah:     keadaanTanah,
      nib:               nib,
      nomor_surat_ukur:  nomorSuratUkur,
      kode_dokumen:      kodeDokumenParts.join(' | '),
      batas_utara:       batasUtara,
      batas_selatan:     batasSelatan,
      batas_timur:       batasTimur,
      batas_barat:       batasBarat,
      nama_tetangga:     namaTetangga,
      kantor_pertanahan: kantorPertanahan,
    };

    result.data = mappedData;

    return success(res, result, `Ekstraksi SHM halaman ${pageType} berhasil.`);
  } catch (err) {
    console.error('Error processing SHM page:', err);
    return error(res, err.message || 'Gagal memproses halaman SHM.', err.status || 500);
  }
}

module.exports = {
  processKTP,
  processKK,
  processNPWP,
  processSHM,
  processBPKB,
  processSpptPbb,
  processSurvey,
  processSuratNikah,
  processSHMPage,
};
