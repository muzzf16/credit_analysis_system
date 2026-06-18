/**
 * OCR Text Parsers
 * Uses regex and heuristics to extract structured data from raw OCR text.
 */

/**
 * Clean and normalize lines of text
 * @param {string} text 
 * @returns {string[]}
 */
function getCleanLines(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

/**
 * Find value after a label with flexible colon match
 * @param {string[]} lines 
 * @param {RegExp} labelRegex 
 * @returns {string}
 */
function findValueAfterLabel(lines, labelRegex) {
  for (const line of lines) {
    if (labelRegex.test(line)) {
      // Extract everything after the colon or after the match
      const parts = line.split(/[:;=]/);
      if (parts.length > 1) {
        return parts.slice(1).join(':').trim();
      }
      // If no colon, extract what follows the regex match
      const match = line.match(labelRegex);
      if (match) {
        const index = line.indexOf(match[0]) + match[0].length;
        return line.substring(index).trim().replace(/^[:;=\s]+/, '');
      }
    }
  }
  return '';
}

/**
 * Parser for KTP (Kartu Tanda Penduduk)
 * @param {string} text 
 * @returns {object}
 */
function parseKTP(text) {
  const lines = getCleanLines(text);
  const data = {
    nik: '',
    nama: '',
    tempatLahir: '',
    tanggalLahir: '',
    gender: 'L',
    statusNikah: 'BELUM_KAWIN',
    pendidikan: 'SMA',
    alamat: '',
    kelurahan: '',
    kecamatan: '',
    kabupaten: 'Batang'
  };

  // 1. Extract NIK (16 digits)
  const nikMatch = text.replace(/[\s\-_]/g, '').match(/\b\d{16}\b/);
  if (nikMatch) {
    data.nik = nikMatch[0];
  } else {
    // Fallback search in lines
    for (const line of lines) {
      const numOnly = line.replace(/[^0-9]/g, '');
      if (numOnly.length === 16) {
        data.nik = numOnly;
        break;
      }
    }
  }

  // 2. Extract Nama
  const namaVal = findValueAfterLabel(lines, /nama/i);
  if (namaVal) {
    data.nama = namaVal.toUpperCase().replace(/[^A-Z\s.,']/g, '');
  }

  // 3. Extract Tempat & Tanggal Lahir
  const ttlVal = findValueAfterLabel(lines, /tempat.*lahir|tgl.*lahir/i);
  if (ttlVal) {
    const parts = ttlVal.split(/[,.]/);
    if (parts.length > 0) {
      data.tempatLahir = parts[0].trim().toUpperCase().replace(/[^A-Z\s]/g, '');
    }
    // Search date in format DD-MM-YYYY or similar
    const dateMatch = ttlVal.match(/(\d{2})[-/](\d{2})[-/](\d{4})/);
    if (dateMatch) {
      data.tanggalLahir = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
    }
  }

  // 4. Extract Gender
  const genderVal = findValueAfterLabel(lines, /jenis.*kelamin|kelamin/i);
  if (/perempuan|wanita|p/i.test(genderVal || text)) {
    data.gender = 'P';
  } else {
    data.gender = 'L';
  }

  // 5. Extract Status Perkawinan
  const statusVal = findValueAfterLabel(lines, /status.*perkawinan|kawin/i);
  if (/belum/i.test(statusVal || text)) {
    data.statusNikah = 'BELUM_KAWIN';
  } else if (/cerai.*mati/i.test(statusVal || text)) {
    data.statusNikah = 'CERAI_MATI';
  } else if (/cerai.*hidup/i.test(statusVal || text)) {
    data.statusNikah = 'CERAI_HIDUP';
  } else if (/kawin|menikah/i.test(statusVal || text)) {
    data.statusNikah = 'KAWIN';
  }

  // 6. Extract Alamat, Kelurahan, Kecamatan
  data.alamat = findValueAfterLabel(lines, /^alamat/i).toUpperCase();
  data.kelurahan = findValueAfterLabel(lines, /kel.*desa|kelurahan|desa/i).toUpperCase();
  data.kecamatan = findValueAfterLabel(lines, /kecamatan|kec/i).toUpperCase();
  
  const kabMatch = text.match(/(?:kabupaten|kota)\s+([A-Za-z]+)/i);
  if (kabMatch && kabMatch[1]) {
    data.kabupaten = kabMatch[1].toUpperCase();
  }

  // Clean empty strings/nulls
  Object.keys(data).forEach(key => {
    if (typeof data[key] === 'string') data[key] = data[key].trim();
  });

  return data;
}

/**
 * Parser for Surat Nikah (Buku Nikah)
 * @param {string} text 
 * @returns {object}
 */
function parseSuratNikah(text) {
  const lines = getCleanLines(text);
  const data = {
    suamiNama: '',
    suamiNik: '',
    istriNama: '',
    istriNik: '',
    tanggalNikah: ''
  };

  // Find NIKs (usually 16 digits)
  const nics = [];
  const cleanTextNoSpaces = text.replace(/[\s\-_]/g, '');
  const matches = cleanTextNoSpaces.match(/\d{16}/g) || [];
  for (const match of matches) {
    nics.push(match);
  }

  // Assign NIKs (Husband first, wife second, as standard in Indonesian Buku Nikah layout)
  if (nics.length > 0) data.suamiNik = nics[0];
  if (nics.length > 1) data.istriNik = nics[1];

  // Try to find names based on headers
  let activeSection = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/suami|pria/i.test(line)) {
      activeSection = 'suami';
    } else if (/istri|wanita/i.test(line)) {
      activeSection = 'istri';
    }

    if (activeSection && /nama/i.test(line)) {
      const val = line.split(/[:;=]/)[1]?.trim() || '';
      if (val) {
        if (activeSection === 'suami' && !data.suamiNama) {
          data.suamiNama = val.toUpperCase().replace(/[^A-Z\s.,']/g, '');
        } else if (activeSection === 'istri' && !data.istriNama) {
          data.istriNama = val.toUpperCase().replace(/[^A-Z\s.,']/g, '');
        }
      }
    }
  }

  // Find marriage date
  const dateMatch = text.match(/(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (dateMatch) {
    data.tanggalNikah = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
  }

  return data;
}

/**
 * Parser for SHM (Sertifikat Hak Milik)
 * @param {string} text 
 * @returns {object}
 */
function parseSHM(text) {
  const lines = getCleanLines(text);
  const data = {
    nomorSertifikat: '',
    atasNama: '',
    luasTanah: 0,
    alamatAgunan: '',
    kecamatan: ''
  };

  // 1. Certificate Number
  // Typically: "HAK MILIK No. 1234"
  const shmNoMatch = text.match(/(?:hak\s+milik|no|nomor)\.?\s*(\d{4,8})/i);
  if (shmNoMatch) {
    data.nomorSertifikat = shmNoMatch[1];
  }

  // 2. Owner Name (Atas Nama / Pemegang Hak)
  const ownerVal = findValueAfterLabel(lines, /pemegang\s*hak|atas\s*nama|nama\s*pemilik/i);
  if (ownerVal) {
    data.atasNama = ownerVal.toUpperCase().replace(/[^A-Z\s.,']/g, '');
  }

  // 3. Land Area (Luas Tanah)
  // Typically: "Luas 150 m2" or "Luas: 150 M2"
  const areaMatch = text.match(/luas\b.*?(\d+(?:\.\d+)?)\s*(?:m2|m²|meter|m\b)/i);
  if (areaMatch) {
    data.luasTanah = parseFloat(areaMatch[1]) || 0;
  }

  // 4. Location Details
  data.kecamatan = findValueAfterLabel(lines, /kecamatan|kec/i).toUpperCase();
  const desa = findValueAfterLabel(lines, /kelurahan|desa|kel/i).toUpperCase();
  const kab = findValueAfterLabel(lines, /kabupaten|kab/i).toUpperCase();

  const locationParts = [];
  if (desa) locationParts.push(`DESA ${desa}`);
  if (data.kecamatan) locationParts.push(`KEC. ${data.kecamatan}`);
  if (kab) locationParts.push(kab);

  data.alamatAgunan = locationParts.join(', ');

  return data;
}

/**
 * Parser for BPKB (Buku Pemilik Kendaraan Bermotor)
 * @param {string} text 
 * @returns {object}
 */
function parseBPKB(text) {
  const lines = getCleanLines(text);
  const data = {
    nomorSertifikat: '', // BPKB number is saved as nomorSertifikat in database
    atasNama: '',
    deskripsi: '',
    alamatAgunan: ''
  };

  // 1. BPKB Number
  // Typically starts with a letter followed by digits: "No. BPKB : A. 1234567" or similar
  const bpkbMatch = text.match(/no\.?\s*bpkb\s*:\s*([A-Za-z0-9.\-]+)/i);
  if (bpkbMatch) {
    data.nomorSertifikat = bpkbMatch[1].replace(/[^A-Z0-9]/ig, '');
  }

  // 2. Police License Number (Nomor Polisi / No. Pol)
  const nopolMatch = text.match(/no\.?\s*(?:polisi|pol)\s*:\s*([A-Z]{1,2}\s*\d{1,4}\s*[A-Z]{0,3})/i);
  const nopol = nopolMatch ? nopolMatch[1].toUpperCase().trim() : '';

  // 3. Owner Name
  const ownerVal = findValueAfterLabel(lines, /nama\s*pemilik|atas\s*nama/i);
  if (ownerVal) {
    data.atasNama = ownerVal.toUpperCase().replace(/[^A-Z\s.,']/g, '');
  }

  // 4. Vehicle Details (Merk & Type)
  const merk = findValueAfterLabel(lines, /merk|merek/i).toUpperCase();
  const tipe = findValueAfterLabel(lines, /tipe|type/i).toUpperCase();
  const tahun = findValueAfterLabel(lines, /tahun/i).replace(/[^0-9]/g, '');

  const descParts = [];
  if (merk) descParts.push(merk);
  if (tipe) descParts.push(tipe);
  if (tahun) descParts.push(`THN ${tahun}`);
  if (nopol) descParts.push(`NOPOL: ${nopol}`);
  
  data.deskripsi = descParts.join(' ');

  // 5. Alamat Pemilik
  data.alamatAgunan = findValueAfterLabel(lines, /alamat/i).toUpperCase();

  return data;
}

/**
 * Helper to parse Indonesian date strings like "02 Oktober 2026" into "2026-10-02"
 */
function parseIndonesianDate(str) {
  if (!str) return '';
  const months = {
    januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
    juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12',
    jan: '01', feb: '02', mar: '03', apr: '04', jun: '06', jul: '07', ags: '08', sep: '09', okt: '10', nov: '11', des: '12'
  };

  // Clean and split
  const parts = str.toLowerCase().replace(/[^a-z0-9\s\-]/g, '').trim().split(/[\s\-]+/);
  if (parts.length >= 3) {
    const day = parts[0].padStart(2, '0');
    const monthName = parts[1];
    const year = parts[2];
    const month = months[monthName] || '01';
    
    // Check if valid year
    if (/^\d{4}$/.test(year)) {
      return `${year}-${month}-${day}`;
    }
  }
  return '';
}

/**
 * Helper to clean OCR numerical values with common scanner character confusions
 * @param {string} str
 * @returns {number}
 */
function cleanOcrNumber(str) {
  if (!str) return 0;
  // Clean all spacing and handle common character-to-number errors
  let clean = str.replace(/\s/g, '')
                 .replace(/I/g, '1').replace(/i/g, '1').replace(/l/g, '1')
                 .replace(/o/g, '0').replace(/O/g, '0')
                 .replace(/s/g, '5').replace(/S/g, '5')
                 .replace(/g/g, '9')
                 .replace(/a/g, '8');

  // Match standard numbers (digits with dots and commas)
  const match = clean.match(/([\d.,]+)/);
  if (match) {
    let numStr = match[1];
    if (numStr.includes(',') && numStr.includes('.')) {
      numStr = numStr.replace(/\./g, '').replace(/,/g, '.');
    } else if (numStr.includes(',')) {
      numStr = numStr.replace(/,/g, '.');
    } else if (numStr.includes('.')) {
      const parts = numStr.split('.');
      if (parts[parts.length - 1].length === 2) {
        numStr = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
      } else {
        numStr = numStr.replace(/\./g, '');
      }
    }
    return parseFloat(numStr) || 0;
  }
  return 0;
}

/**
 * Helper: parse money amount from Indonesian format (1.234.567 or 1.234.567,00 or Rp 1.234.567)
 */
function parseMoney(str) {
  if (!str) return 0;
  let clean = String(str).replace(/Rp\.?\s*/gi, '').trim();
  // Fix OCR common character confusions for digits
  clean = clean.replace(/\s/g, '');
  // Handle Indonesian number format
  if (clean.includes(',') && clean.includes('.')) {
    // 1.234.567,00 → comma is decimal separator
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',') && !clean.includes('.')) {
    // Could be decimal comma: 1234567,00 → 1234567.00
    const commaIdx = clean.lastIndexOf(',');
    const afterComma = clean.substring(commaIdx + 1);
    if (afterComma.length <= 2) {
      clean = clean.replace(',', '.');
    } else {
      // 1,234,567 → remove commas
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes('.')) {
    // 1.234.567 → dots are thousand separators
    const parts = clean.split('.');
    const lastPart = parts[parts.length - 1];
    if (lastPart.length === 2 && parts.length > 1) {
      // 1.234.56 → decimal: unlikely for Indonesian but handle it
      clean = parts.slice(0, -1).join('') + '.' + lastPart;
    } else {
      // Remove all dots (thousand separators)
      clean = clean.replace(/\./g, '');
    }
  }
  return parseFloat(clean) || 0;
}

/**
 * Helper: parse date in DD/MM/YYYY or DD-MM-YYYY format
 */
function parseDateDMY(str) {
  if (!str) return '';
  const m = str.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  return '';
}

/**
 * Parser for SLIK iDeb OJK Reports
 * Handles the standard PDF format from iDeb OJK.
 * @param {string} text
 * @returns {object}
 */
function parseSLIK(text) {
  const data = {
    tanggalSlik: new Date().toISOString().split('T')[0],
    kolektibilitasTertinggi: 1,
    totalFasilitas: 0,
    totalPlafon: 0,
    totalBakiDebet: 0,
    catatan: '',
    detailSlik: []
  };

  // ── Try to extract the SLIK report/print date ──────────────────────────
  const slikDateMatch = text.match(
    /(?:Tanggal\s+(?:Laporan|SLIK|Cetak|Permintaan)|Per\s+Tanggal|Dicetak)\s*[:;=]?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{1,2}\s+\w+\s+\d{4})/i
  );
  if (slikDateMatch) {
    const parsed = parseDateDMY(slikDateMatch[1]) || parseIndonesianDate(slikDateMatch[1]);
    if (parsed) data.tanggalSlik = parsed;
  }

  // ── Split text into per-fasilitas blocks ────────────────────────────────
  // EXACT MATCH for facilities header: \n followed by 2-10 digits, a dash, and the bank type
  const splitRegex = /(?=\n\d{2,10}\s*-\s*(?:PT\.?\s+|BANK\s+|BPR\s+|BKK\s+|KOPERASI\s+|KSP\s+|PD\.?\s+|CV\.?\s+))/gi;

  // Try matching facilities. If this fails (e.g., format differs), we fall back.
  let facilityBlocks = text.split(splitRegex).filter(block => block.match(/^\n?\d{2,10}\s*-\s*/));

  if (facilityBlocks.length === 0) {
    // Fallback: split on PT/BANK patterns
    const fallbackRegex = /(?=\n(?:PT\s|BANK\s|BPR\s|BKK\s|PEGADAIAN|AKULAKU|KREDIVO|BUSSAN|ADIRA|MITSUI|JAGO|SEABANK|BTPN))/gi;
    facilityBlocks = text.split(fallbackRegex);
  }

  for (const block of facilityBlocks) {
    const blockLines = getCleanLines(block);
    if (blockLines.length < 2) continue;

    // ── 1. Identify bank/lender name ─────────────────────────────────────
    let bankName = '';
    const firstLine = blockLines[0].toUpperCase();
    
    // Check if block starts with standard facility header
    if (firstLine.match(/^(?:\d+\s*-\s*)?(PT\.?\s+|BANK\s+|BPR\s+|BKK\s+|KOPERASI\s+|KSP\s+|PD\.?\s+|CV\.?\s+)/)) {
      if (!block.match(/Plafon/i) && !block.match(/Baki\s+Debet/i)) {
        continue; // Skip header blocks
      }
      let name = firstLine
        .replace(/^\d+\s*-\s*/, '')
        .split(/\s+(?:Rp|NO\.|No\.|TGL\.|Tgl\.|Kode\s+Pihak|Kualitas|Kuala\s+Kred|Pihak\s+Ke|Nomor\s+Rekening|Kantor|Cabang|KPO|KC|KCP|\t)\b/i)[0]
        .split(/[\/\(]/)[0]
        .trim();
      if (name.length >= 3) bankName = name;
    }

    // Broader fallback for older formats
    if (!bankName) {
      for (const line of blockLines.slice(0, 5)) {
        const up = line.toUpperCase();
        if (
          (up.includes('BANK') || up.includes('FINANCE') || up.includes('BPR') ||
           up.includes('BUSSAN') || up.includes('ADIRA') || up.includes('PEGADAIAN') ||
           up.includes('AKULAKU') || up.includes('JAGO') || up.includes('SEABANK') ||
           up.includes('KREDIVO') || up.includes('KOPERASI') || up.includes('MULTIFINANCE')) &&
          !up.includes('SALDO') && !up.includes('PLAFON') && !up.includes('DEBET') && !up.includes('RINGKASAN')
        ) {
          let name = line
            .split(/\s+(?:Rp|Kode|Kualitas|Nomor|Pihak|Kantor|Cabang|KPO|KC|KCP|\t)\b/i)[0]
            .split(/[\/\(]/)[0]
            .trim();
          if (name.length >= 3 && name.length < 100) {
            bankName = name;
            break;
          }
        }
      }
    }

    if (!bankName || bankName.length < 3) continue;

    const facility = {
      bank: bankName,
      jenisFasilitas: 'Kredit',
      plafon: 0,
      bakiDebet: 0,
      kolektibilitas: 1,
      jatuhTempo: ''
    };

    // ── 2. Jenis Fasilitas/Kredit ─────────────────────────────────────────
    const jenisPatterns = [
      /Jenis\s+Kredit\s*[:;=]?\s*([^\n\r]{2,40})/i,
      /Jenis\s+Fasilitas\s*[:;=]?\s*([^\n\r]{2,40})/i,
      /Jenis\s+Pembiayaan\s*[:;=]?\s*([^\n\r]{2,40})/i,
    ];
    for (const pat of jenisPatterns) {
      const m = block.match(pat);
      if (m) {
        facility.jenisFasilitas = m[1].trim().toUpperCase().substring(0, 60);
        break;
      }
    }

    // ── 3. Plafon ─────────────────────────────────────────────────────────
    const plafonPatterns = [
      /Plafon\s+Awal\s*[:;=]?\s*(?:Rp\.?\s*)?([\d.,]+)/i,
      /Nilai\s+Plafon\s*[:;=]?\s*(?:Rp\.?\s*)?([\d.,]+)/i,
      /Plafon\s*[:;=]?\s*(?:Rp\.?\s*)?([\d.,]+)/i,
      /Limit\s+Kredit\s*[:;=]?\s*(?:Rp\.?\s*)?([\d.,]+)/i,
      /Jumlah\s+Pinjaman\s*[:;=]?\s*(?:Rp\.?\s*)?([\d.,]+)/i,
    ];
    for (const pat of plafonPatterns) {
      const m = block.match(pat);
      if (m) {
        const val = parseMoney(m[1]);
        if (val > 0) { facility.plafon = val; break; }
      }
    }

    // ── 4. Baki Debet ─────────────────────────────────────────────────────
    const bakiPatterns = [
      /Baki\s+Debet\s*[:;=]?\s*(?:Rp\.?\s*)?([\d.,]+)/i,
      /Outstanding\s*[:;=]?\s*(?:Rp\.?\s*)?([\d.,]+)/i,
      /Saldo\s+(?:Pinjaman|Kredit|Pembiayaan)\s*[:;=]?\s*(?:Rp\.?\s*)?([\d.,]+)/i,
      /Saldo\s*[:;=]?\s*(?:Rp\.?\s*)?([\d.,]+)/i,
    ];
    for (const pat of bakiPatterns) {
      const m = block.match(pat);
      if (m) {
        const val = parseMoney(m[1]);
        if (val > 0) { facility.bakiDebet = val; break; }
      }
    }

    // ── Fallback: check first 3 lines for Rp pattern (e.g. BNI case) ──
    if (facility.bakiDebet === 0) {
      for (let i = 0; i < Math.min(3, blockLines.length); i++) {
        const rpMatch = blockLines[i].match(/Rp\s*([\d.,]+)/i);
        if (rpMatch) {
          facility.bakiDebet = parseMoney(rpMatch[1]);
          break;
        }
      }
    }
    
    // Fallback: Also try to find Plafon from the line after "0  Plafon  Rp 9.227.962,00"
    if (facility.plafon === 0) {
      const m = block.match(/Plafon\s*(?:Rp\.?\s*)?([\d.,]+)/i);
      if (m) facility.plafon = parseMoney(m[1]);
    }

    // ── 5. Kolektibilitas / Kualitas ──────────────────────────────────────
    let kolVal = 1;
    const kolPatterns = [
      /(?:Kualitas|Kolektibilitas|Kol\.?)\s*[:;=]?\s*([1-5])\s*[-–]?\s*(Lancar|Perhatian|Kurang|Diragukan|Macet)?/i,
      /([1-5])\s*[-–]\s*(Lancar|Dalam\s+Perhatian\s+Khusus|Kurang\s+Lancar|Diragukan|Macet)/i,
    ];
    for (const pat of kolPatterns) {
      const m = block.match(pat);
      if (m) {
        kolVal = parseInt(m[1]) || 1;
        break;
      }
    }
    const bl = block.toLowerCase();
    if (kolVal === 1) {
      if (bl.includes('macet')) kolVal = 5;
      else if (bl.includes('diragukan') || bl.includes('ragu-ragu')) kolVal = 4;
      else if (bl.match(/kurang\s+lancar/)) kolVal = 3;
      else if (bl.match(/dalam\s+perhatian|perhatian\s+khusus/)) kolVal = 2;
    }
    facility.kolektibilitas = kolVal;

    // ── 6. Jatuh Tempo ────────────────────────────────────────────────────
    const jtPatterns = [
      /(?:Tanggal\s+)?Jatuh\s+Tempo\s*[:;=]?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{4})/i,
      /(?:Tanggal\s+)?Jatuh\s+Tempo\s*[:;=]?\s*(\d{1,2}\s+\w+\s+\d{4})/i,
      /(?:Tanggal\s+)?Jatuh\s+Tempo\s*[:;=]?\s*(\d{2}[-/]\d{4})/i,  // MM/YYYY
      /Jatuh\s+Tempo\s*[:;=]?\s*([^\n\r]{4,20})/i,
    ];
    for (const pat of jtPatterns) {
      const m = block.match(pat);
      if (m) {
        const raw = m[1].trim();
        let parsed = parseDateDMY(raw) || parseIndonesianDate(raw);
        if (!parsed) {
          const myMatch = raw.match(/^(\d{2})[-/](\d{4})$/);
          if (myMatch) parsed = `${myMatch[2]}-${myMatch[1]}-01`;
        }
        if (parsed) { facility.jatuhTempo = parsed; break; }
      }
    }
    if (!facility.jatuhTempo) {
      const allDates = [...block.matchAll(/(\d{1,2})[-/](\d{2})[-/](\d{4})/g)];
      if (allDates.length > 0) {
        const last = allDates[allDates.length - 1];
        facility.jatuhTempo = `${last[3]}-${last[2].padStart(2,'0')}-${last[1].padStart(2,'0')}`;
      }
    }

    data.detailSlik.push(facility);
  }

  // ── Recalculate summary totals ─────────────────────────────────────────
  data.totalFasilitas = data.detailSlik.length;
  data.totalPlafon = data.detailSlik.reduce((s, f) => s + (f.plafon || 0), 0);
  data.totalBakiDebet = data.detailSlik.reduce((s, f) => s + (f.bakiDebet || 0), 0);
  if (data.detailSlik.length > 0) {
    data.kolektibilitasTertinggi = Math.max(1, ...data.detailSlik.map(f => f.kolektibilitas || 1));
  }

  return data;
}

/**
 * Main Parse Route router
 * @param {string} text 
 * @param {string} type - ktp, surat_nikah, shm, bpkb, slik
 * @returns {object}
 */
function parseDocumentText(text, type) {
  switch (type.toLowerCase()) {
    case 'ktp':
      return parseKTP(text);
    case 'surat_nikah':
      return parseSuratNikah(text);
    case 'shm':
    case 'shgb':
    case 'ajb':
      return parseSHM(text);
    case 'bpkb':
    case 'kendaraan':
      return parseBPKB(text);
    case 'slik':
      return parseSLIK(text);
    default:
      return { rawText: text };
  }
}

module.exports = {
  parseDocumentText,
  parseKTP,
  parseSuratNikah,
  parseSHM,
  parseBPKB,
  parseSLIK
};
