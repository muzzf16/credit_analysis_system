/**
 * SHM (Sertifikat Hak Milik) Text Parser
 * Extracts structured fields from raw Tesseract OCR output of land certificate documents.
 * Handles both photographic and scanned SHM pages.
 */

'use strict';

/**
 * Clean and normalize lines of text from OCR
 * @param {string} text
 * @returns {string[]}
 */
function getCleanLines(text) {
  return String(text || '')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 1);
}

/**
 * Find value after a label in lines
 * @param {string[]} lines
 * @param {RegExp} labelRegex
 * @param {number} maxLookahead
 * @returns {string}
 */
function findValueAfterLabel(lines, labelRegex, maxLookahead = 4) {
  for (let i = 0; i < lines.length; i++) {
    if (!labelRegex.test(lines[i])) continue;

    // Check for inline value (e.g., "Nomor : 01234")
    const inlineParts = lines[i].split(/[:=]/);
    if (inlineParts.length >= 2) {
      const inlineVal = inlineParts.slice(1).join(':').trim();
      if (inlineVal && inlineVal.length > 0 && !/^\s*$/.test(inlineVal)) {
        return inlineVal;
      }
    }

    // Check next lines
    for (let j = i + 1; j < lines.length && j <= i + maxLookahead; j++) {
      const candidate = lines[j].trim();
      if (candidate && candidate.length > 1) {
        return candidate;
      }
    }
  }
  return '';
}

/**
 * Extract nomor sertifikat from OCR text
 * Patterns: "No. 01234", "NOMOR : 01234", "SHM No. 01234", "M. 01620"
 * @param {string} text
 * @returns {string}
 */
function extractNomorSertifikat(text) {
  const patterns = [
    /NOMOR\s*(?:SERTIFIKAT)?\s*[:.]\s*([A-Z0-9.\/-]+)/i,
    /(?:SHM|HAK\s*MILIK)\s*No\.?\s*([0-9]+)/i,
    /\bNo\.\s*([0-9]{3,6})\b/i,
    /\bM\.\s*([0-9]{4,6})\b/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return '';
}

/**
 * Extract NIB (Nomor Induk Bidang)
 * @param {string} text
 * @returns {string}
 */
function extractNib(text) {
  const patterns = [
    /NIB\s*[:.]\s*([A-Z0-9.\/-]+)/i,
    /NOMOR\s*INDUK\s*BIDANG\s*[:.]\s*([A-Z0-9.\/-]+)/i,
    /\bNIB\b\s+([A-Z0-9]{6,20})/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return '';
}

/**
 * Extract luas tanah in m2
 * @param {string} text
 * @returns {number}
 */
function extractLuasM2(text) {
  const patterns = [
    /LUAS\s*[:.]\s*([\d.,]+)\s*(?:M2|M²|M\^2|HA)/i,
    /([\d.,]+)\s*(?:M2|M²)\b/i,
    /SELUAS\s*([\d.,]+)\s*(?:M2|M²)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) {
      const num = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
      if (!isNaN(num) && num > 0) return Math.round(num);
    }
  }
  return 0;
}

/**
 * Extract nama pemegang hak
 * @param {string} text
 * @returns {string}
 */
function extractNamaPemegangHak(text) {
  const lines = getCleanLines(text);
  const labelPatterns = [
    /PEMEGANG\s*HAK/i,
    /ATAS\s*NAMA/i,
    /NAMA\s*PEMEGANG/i,
    /KEPADA\s*[:=]/i,
  ];

  for (const label of labelPatterns) {
    const val = findValueAfterLabel(lines, label, 3);
    if (val && val.length > 2 && /[A-Z]/i.test(val)) {
      return val.replace(/[^A-Za-z\s'.,-]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
    }
  }

  return '';
}

/**
 * Extract Desa/Kelurahan
 * @param {string} text
 * @returns {string}
 */
function extractDesaKelurahan(text) {
  const lines = getCleanLines(text);
  const val = findValueAfterLabel(lines, /(?:DESA|KELURAHAN)\s*\/?\s*(?:KELURAHAN|DESA)?/i, 3);
  if (val && /[A-Z]/i.test(val) && val.length > 2) {
    return val.replace(/[^A-Za-z0-9\s'-]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
  }

  // Fallback: regex on raw text
  const m = text.match(/(?:DESA|KELURAHAN)\s*[:.]\s*([A-Z\s]+?)(?:\n|KECAMATAN|KABUPATEN)/i);
  if (m) return m[1].trim().toUpperCase();
  return '';
}

/**
 * Extract Kecamatan
 * @param {string} text
 * @returns {string}
 */
function extractKecamatan(text) {
  const lines = getCleanLines(text);
  const val = findValueAfterLabel(lines, /KECAMATAN/i, 3);
  if (val && /[A-Z]/i.test(val)) {
    return val.replace(/[^A-Za-z0-9\s'-]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
  }
  const m = text.match(/KECAMATAN\s*[:.]\s*([A-Z\s]+?)(?:\n|KABUPATEN|KOTA|DESA)/i);
  if (m) return m[1].trim().toUpperCase();
  return '';
}

/**
 * Extract Kabupaten/Kota
 * @param {string} text
 * @returns {string}
 */
function extractKabupaten(text) {
  const lines = getCleanLines(text);
  const val = findValueAfterLabel(lines, /KABUPATEN|KOTA\s+(?!ADMINISTRASI)/i, 3);
  if (val && /[A-Z]/i.test(val)) {
    return val.replace(/[^A-Za-z0-9\s'-]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
  }
  const m = text.match(/(?:KABUPATEN|KOTA)\s*[:.]\s*([A-Z\s]+?)(?:\n|PROVINSI|PROPINSI)/i);
  if (m) return m[1].trim().toUpperCase();

  // Header format: "KABUPATEN BATANG" prominent
  const header = text.match(/KABUPATEN\s+([A-Z]+)/i);
  if (header) return `KABUPATEN ${header[1].toUpperCase()}`;
  return '';
}

/**
 * Extract Provinsi
 * @param {string} text
 * @returns {string}
 */
function extractProvinsi(text) {
  const m = text.match(/PROVINSI\s+([A-Z\s]+?)(?:\n|KABUPATEN|KOTA)/i) ||
            text.match(/PROPINSI\s+([A-Z\s]+?)(?:\n|KABUPATEN)/i);
  if (m) return m[1].trim().toUpperCase().replace(/\s+/g, ' ');
  return '';
}

/**
 * Extract Nomor Surat Ukur
 * @param {string} text
 * @returns {string}
 */
function extractNomorSuratUkur(text) {
  const patterns = [
    /SURAT\s*UKUR\s*(?:NOMOR|NO\.?)\s*[:.]\s*([A-Z0-9.\/-]+)/i,
    /SURAT\s*UKUR\s*[:.]\s*([A-Z0-9.\/-]+)/i,
    /SU\s*[:.]\s*([A-Z0-9.\/-]+)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return '';
}

/**
 * Extract Asal Hak
 * @param {string} text
 * @returns {string}
 */
function extractAsalHak(text) {
  const lines = getCleanLines(text);
  const val = findValueAfterLabel(lines, /ASAL\s*(?:HAK|PEROLEHAN)/i, 3);
  if (val) return val.replace(/\s+/g, ' ').trim().toUpperCase();
  return '';
}

/**
 * Extract Keadaan Tanah (kondisi fisik)
 * @param {string} text
 * @returns {string}
 */
function extractKeadaanTanah(text) {
  const lines = getCleanLines(text);
  const val = findValueAfterLabel(lines, /KEADAAN\s*TANAH/i, 3);
  if (val) return val.replace(/\s+/g, ' ').trim().toUpperCase();

  // Fallback: common descriptions
  const m = text.match(/(?:TANAH\s*)?(?:DAN\s*BANGUNAN|KOSONG|PERTANIAN|PERSAWAHAN|PERUMAHAN|PEKARANGAN)\b/i);
  if (m) return m[0].trim().toUpperCase();
  return '';
}

/**
 * Extract Hak Tanggungan info
 * @param {string} text
 * @returns {{ aktif: boolean, nama_kreditur: string, nomor_ht: string }}
 */
function extractHakTanggungan(text) {
  const result = {
    aktif: false,
    nama_kreditur: '',
    nomor_ht: ''
  };

  if (/HAK\s*TANGGUNGAN/i.test(text)) {
    result.aktif = true;
    const krediturM = text.match(/KREDITUR\s*[:.]\s*([A-Z][A-Z\s]+?)(?:\n|NOMOR|NO\.)/i);
    if (krediturM) result.nama_kreditur = krediturM[1].trim().toUpperCase();

    const htM = text.match(/(?:NOMOR|NO\.?)\s*HAK\s*TANGGUNGAN\s*[:.]\s*([A-Z0-9.\/-]+)/i) ||
                text.match(/HAK\s*TANGGUNGAN\s*(?:NOMOR|NO\.?)\s*[:.]\s*([A-Z0-9.\/-]+)/i);
    if (htM) result.nomor_ht = htM[1].trim();
  }

  return result;
}

/**
 * Extract Daftar Isian (DI 307 / DI 208)
 * @param {string} text
 * @returns {{ di_307: string, di_208: string }}
 */
function extractDaftarIsian(text) {
  const di307 = text.match(/(?:D\.?I\.?\s*307|DAFTAR\s*ISIAN\s*307)\s*[:.]\s*([A-Z0-9.\/-]+)/i);
  const di208 = text.match(/(?:D\.?I\.?\s*208|DAFTAR\s*ISIAN\s*208)\s*[:.]\s*([A-Z0-9.\/-]+)/i);
  return {
    di_307: di307 ? di307[1].trim() : '',
    di_208: di208 ? di208[1].trim() : ''
  };
}

/**
 * Extract Tanggal Pembukuan
 * @param {string} text
 * @returns {string}
 */
function extractTanggalPembukuan(text) {
  const m = text.match(/(?:TANGGAL\s*PEMBUKUAN|DIBUKUKAN\s*(?:PADA\s*TANGGAL)?)\s*[:.]\s*([0-9A-Za-z,.\s-]+?)(?:\n|ATAS\s*NAMA)/i);
  if (m) return m[1].trim();
  return '';
}

/**
 * Luas terbilang string extraction
 * @param {string} text
 * @returns {string}
 */
function extractLuasTerbilang(text) {
  const m = text.match(/(?:LUAS\s*TERBILANG|SELUAS\s*TERBILANG)\s*[:.]\s*([A-Z\s]+?)(?:\n|M2|\.)/i);
  if (m) return m[1].trim().toUpperCase();
  return '';
}

/**
 * Main SHM Parser — parses raw Tesseract text into structured object
 * @param {string} rawText - Raw OCR text from Tesseract
 * @returns {object}
 */
function parseSHM(rawText) {
  const text = String(rawText || '');
  const upper = text.toUpperCase();

  // Base result
  const result = {
    nomor_sertifikat: extractNomorSertifikat(upper),
    jenis_hak: 'HAK MILIK',
    nib: extractNib(upper),
    nama_pemegang_hak: extractNamaPemegangHak(text),
    provinsi: extractProvinsi(upper),
    kabupaten_kota: extractKabupaten(upper),
    kecamatan: extractKecamatan(upper),
    desa_kelurahan: extractDesaKelurahan(upper),
    luas_m2: extractLuasM2(upper),
    luas_terbilang: extractLuasTerbilang(upper),
    keadaan_tanah: extractKeadaanTanah(upper),
    nomor_surat_ukur: extractNomorSuratUkur(upper),
    asal_hak: extractAsalHak(upper),
    tanggal_pembukuan: extractTanggalPembukuan(text),
    daftar_isian_307: '',
    daftar_isian_208: '',
    hak_tanggungan_aktif: false,
    nama_kreditur_ht: '',
    nomor_ht: '',
    // Aliases for backward compatibility
    atas_nama: '',
    kabupaten: '',
    desa: ''
  };

  // Daftar Isian
  const di = extractDaftarIsian(upper);
  result.daftar_isian_307 = di.di_307;
  result.daftar_isian_208 = di.di_208;

  // Hak Tanggungan
  const ht = extractHakTanggungan(upper);
  result.hak_tanggungan_aktif = ht.aktif;
  result.nama_kreditur_ht = ht.nama_kreditur;
  result.nomor_ht = ht.nomor_ht;

  // Backward-compat aliases
  result.atas_nama = result.nama_pemegang_hak;
  result.kabupaten = result.kabupaten_kota;
  result.desa = result.desa_kelurahan;

  return result;
}

module.exports = { parseSHM };
