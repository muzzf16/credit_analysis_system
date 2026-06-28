/**
 * Normalizes date format from DD-MM-YYYY to YYYY-MM-DD
 * @param {string} val 
 * @returns {string} Normalized date YYYY-MM-DD
 */
function normalizeDate(val) {
  if (!val) return '';
  const cleanVal = String(val).trim();
  
  // Pattern DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = cleanVal.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  
  // Pattern YYYY-MM-DD
  const ymdMatch = cleanVal.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  
  return cleanVal;
}

/**
 * Normalizes gender from LAKI-LAKI/PEREMPUAN to L/P
 * @param {string} val 
 * @returns {string} 'L' or 'P'
 */
function normalizeGender(val) {
  if (!val) return 'L';
  const v = String(val).trim().toUpperCase();
  if (v.includes('PEREMPUAN') || v === 'P') return 'P';
  if (v.includes('LAKI') || v === 'L') return 'L';
  return 'L';
}

/**
 * Normalizes status perkawinan to fit Debitur model ENUM
 * @param {string} val 
 * @returns {string} 'BELUM_KAWIN' | 'KAWIN' | 'CERAI_HIDUP' | 'CERAI_MATI'
 */
function normalizeStatusNikah(val) {
  if (!val) return 'BELUM_KAWIN';
  const v = String(val).trim().toUpperCase();
  if (v.includes('BELUM')) return 'BELUM_KAWIN';
  if (v.includes('CERAI')) {
    if (v.includes('HIDUP')) return 'CERAI_HIDUP';
    if (v.includes('MATI')) return 'CERAI_MATI';
    return 'CERAI_HIDUP';
  }
  if (v === 'KAWIN' || v.includes('KAWIN') || v.includes('NIKAH')) return 'KAWIN';
  return 'BELUM_KAWIN';
}

/**
 * Maps raw OCR JSON response fields from external service to Debtor DTO
 * @param {object} ocrResponse - KtpOcrResponse JSON from external service
 * @returns {object} { data: DebtorDto, confidences: FieldConfidences }
 */
function mapOcrToDebtorDto(ocrResponse) {
  const rawData = ocrResponse.data || {};
  const fields = ocrResponse.fields || {};
  const overallConfidence = ocrResponse.confidence !== undefined ? ocrResponse.confidence : 1.0;

  // Helper to extract confidence score
  const getFieldConfidence = (fieldName) => {
    if (fields[fieldName] && fields[fieldName].confidence !== undefined) {
      return fields[fieldName].confidence;
    }
    return overallConfidence;
  };

  // Map to Debtor DTO Pribadi object (supporting both camelCase and snake_case)
  const debtorDto = {
    nik: rawData.nik || '',
    nama: rawData.nama || '',
    
    tempatLahir: rawData.tempat_lahir || '',
    tempat_lahir: rawData.tempat_lahir || '',
    
    tanggalLahir: normalizeDate(rawData.tanggal_lahir),
    tanggal_lahir: normalizeDate(rawData.tanggal_lahir),
    
    gender: normalizeGender(rawData.jenis_kelamin),
    jenis_kelamin: rawData.jenis_kelamin || '',
    
    statusNikah: normalizeStatusNikah(rawData.status_perkawinan),
    status_perkawinan: rawData.status_perkawinan || '',
    
    pendidikan: 'SMA', // Default
    agama: (rawData.agama || 'ISLAM').toUpperCase(),
    pekerjaan: rawData.pekerjaan || '',
    kewarganegaraan: rawData.kewarganegaraan || 'WNI',
    
    berlakuHingga: rawData.berlaku_hingga || 'SEUMUR HIDUP',
    berlaku_hingga: rawData.berlaku_hingga || 'SEUMUR HIDUP',
    
    alamat: rawData.alamat || '',
    rt: rawData.rt || '',
    rw: rawData.rw || '',
    kelurahan: rawData.kelurahan || rawData.desa || '',
    kecamatan: rawData.kecamatan || '',
    kabupaten: rawData.kabupaten || 'Batang',
    kodePos: '',
    noHp: '',
    email: '',
    ibuKandung: '',
    hubunganBank: 'Nasabah Baru',
    kreditAktif: 'Tidak Ada'
  };

  // Extract confidence values for each mapped field
  const confidences = {
    nik: getFieldConfidence('nik'),
    nama: getFieldConfidence('nama'),
    tempatLahir: getFieldConfidence('tempat_lahir'),
    tempat_lahir: getFieldConfidence('tempat_lahir'),
    tanggalLahir: getFieldConfidence('tanggal_lahir'),
    tanggal_lahir: getFieldConfidence('tanggal_lahir'),
    gender: getFieldConfidence('jenis_kelamin'),
    jenis_kelamin: getFieldConfidence('jenis_kelamin'),
    statusNikah: getFieldConfidence('status_perkawinan'),
    status_perkawinan: getFieldConfidence('status_perkawinan'),
    agama: getFieldConfidence('agama'),
    pekerjaan: getFieldConfidence('pekerjaan'),
    kewarganegaraan: getFieldConfidence('kewarganegaraan'),
    berlakuHingga: getFieldConfidence('berlaku_hingga'),
    berlaku_hingga: getFieldConfidence('berlaku_hingga'),
    alamat: getFieldConfidence('alamat'),
    rt: getFieldConfidence('rt'),
    rw: getFieldConfidence('rw'),
    kelurahan: fields['kelurahan'] ? getFieldConfidence('kelurahan') : getFieldConfidence('desa'),
    kecamatan: getFieldConfidence('kecamatan'),
    kabupaten: getFieldConfidence('kabupaten')
  };

  return {
    success: true,
    engineUsed: 'glm',
    data: debtorDto,
    confidences
  };
}

module.exports = {
  normalizeDate,
  normalizeGender,
  normalizeStatusNikah,
  mapOcrToDebtorDto
};
