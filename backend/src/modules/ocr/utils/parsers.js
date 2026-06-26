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
    statusNikah: '',
    pendidikan: 'SMA',
    alamat: '',
    kelurahan: '',
    kecamatan: '',
    kabupaten: 'Batang'
  };

  // 1. Extract NIK (16 digits)
  // First normalize common OCR digit confusions in a text version stripped of spaces/symbols
  const normalizedText = text.toUpperCase()
    .replace(/[\s\-_]/g, '')
    .replace(/I|L|i|l|\|/g, '1')
    .replace(/O|D/g, '0')
    .replace(/B/g, '8')
    .replace(/S/g, '5')
    .replace(/G/g, '9');
  
  const nikMatch = normalizedText.match(/\b\d{16}\b/) || normalizedText.match(/\d{16}/);
  if (nikMatch) {
    data.nik = nikMatch[0];
  } else {
    // Fallback: look line by line
    for (const line of lines) {
      const normLine = line.toUpperCase()
        .replace(/I|L|i|l|\|/g, '1')
        .replace(/O|D/g, '0')
        .replace(/B/g, '8')
        .replace(/S/g, '5')
        .replace(/G/g, '9')
        .replace(/[^0-9]/g, '');
      if (normLine.length === 16) {
        data.nik = normLine;
        break;
      }
    }
  }

  // Helper to check if a line is a label
  const isLabel = (line) => {
    return /nik|nama|lahir|kelamin|alamat|rt\/rw|desa|kelurahan|kecamatan|agama|perkawinan|pekerjaan|kewarganegaraan|berlaku|seumur/i.test(line);
  };

  // 2. Extract Nama
  let namaVal = findValueAfterLabel(lines, /nama/i);
  if (!namaVal) {
    // Heuristic: search lines around the "Nama" label (window of +1 to +4 lines)
    const idx = lines.findIndex(l => /nama/i.test(l) && !/kecamatan|tempat/i.test(l));
    if (idx !== -1) {
      for (let offset = 1; offset <= 4; offset++) {
        const checkIdx = idx + offset;
        if (checkIdx < lines.length) {
          const l = lines[checkIdx];
          if (!isLabel(l) && !/\d/.test(l) && l.length > 2) {
            namaVal = l;
            break;
          }
        }
      }
    }
  }
  if (namaVal) {
    data.nama = namaVal.toUpperCase().replace(/[^A-Z\s.,']/g, '').trim();
  }

  // 3. Extract Tempat & Tanggal Lahir
  let ttlVal = findValueAfterLabel(lines, /tempat.*lahir|tgl.*lahir/i);
  let dateStr = '';
  let placeStr = '';

  // Heuristic: find any line containing a date pattern DD-MM-YYYY or DD.MM.YYYY
  const dateLineIdx = lines.findIndex(l => {
    const norm = l.toUpperCase().replace(/O/g, '0').replace(/I|L|l/g, '1').replace(/S/g, '5').replace(/B/g, '8');
    return /(\d{2})[-/.](\d{2})[-/.](\d{4})/.test(norm);
  });

  if (dateLineIdx !== -1) {
    const rawLine = lines[dateLineIdx];
    const normLine = rawLine.toUpperCase()
      .replace(/O/g, '0')
      .replace(/I|L|l/g, '1')
      .replace(/S/g, '5')
      .replace(/B/g, '8');
    const match = normLine.match(/(\d{2})[-/.](\d{2})[-/.](\d{4})/);
    if (match) {
      dateStr = `${match[3]}-${match[2]}-${match[1]}`;
      // The place is everything before the date in that line (minus punctuation)
      placeStr = rawLine.substring(0, rawLine.indexOf(match[0])).replace(/[^A-Za-z\s]/g, '').trim();
    }
  }

  if (dateStr) {
    data.tanggalLahir = dateStr;
    if (placeStr) {
      data.tempatLahir = placeStr.toUpperCase();
    }
  }

  if (!data.tempatLahir && ttlVal) {
    const parts = ttlVal.split(/[,.]/);
    if (parts.length > 0) {
      data.tempatLahir = parts[0].trim().toUpperCase().replace(/[^A-Z\s]/g, '');
    }
  }

  // 4. Extract Gender
  const genderVal = findValueAfterLabel(lines, /jenis.*kelamin|kelamin/i);
  if (genderVal) {
    if (/perempuan|wanita|p/i.test(genderVal)) {
      data.gender = 'P';
    } else if (/laki|l/i.test(genderVal)) {
      data.gender = 'L';
    }
  } else {
    // Check if any line matches gender values
    const hasPerempuan = lines.some(l => /perempuan|wanita/i.test(l) && !isLabel(l));
    const hasLaki = lines.some(l => /laki-laki|laki/i.test(l) && !isLabel(l));
    if (hasPerempuan) {
      data.gender = 'P';
    } else if (hasLaki) {
      data.gender = 'L';
    } else if (/perempuan|wanita/i.test(text)) {
      data.gender = 'P';
    } else {
      data.gender = 'L';
    }
  }

  // 5. Extract Status Perkawinan
  const statusVal = findValueAfterLabel(lines, /status.*perkawinan|kawin/i);
  let statusSearchArea = statusVal || text;

  // Heuristic: check if any standalone line contains status values
  for (const l of lines) {
    if (/belum\s*kawin/i.test(l)) {
      data.statusNikah = 'BELUM_KAWIN';
      break;
    } else if (/cerai\s*mati/i.test(l)) {
      data.statusNikah = 'CERAI_MATI';
      break;
    } else if (/cerai\s*hidup/i.test(l)) {
      data.statusNikah = 'CERAI_HIDUP';
      break;
    } else if (/kawin|menikah/i.test(l) && !/status/i.test(l)) {
      data.statusNikah = 'KAWIN';
      break;
    }
  }

  if (!data.statusNikah) {
    if (/belum/i.test(statusSearchArea)) {
      data.statusNikah = 'BELUM_KAWIN';
    } else if (/cerai.*mati/i.test(statusSearchArea)) {
      data.statusNikah = 'CERAI_MATI';
    } else if (/cerai.*hidup/i.test(statusSearchArea)) {
      data.statusNikah = 'CERAI_HIDUP';
    } else if (/kawin|menikah|kwn/i.test(statusSearchArea)) {
      data.statusNikah = 'KAWIN';
    }
  }

  // 6. Extract Alamat, Kelurahan, Kecamatan
  let alamatVal = findValueAfterLabel(lines, /^alamat/i);
  if (!alamatVal) {
    const idx = lines.findIndex(l => /^alamat/i.test(l));
    if (idx !== -1 && idx + 1 < lines.length) {
      alamatVal = lines[idx + 1];
    }
  }
  if (alamatVal) {
    data.alamat = alamatVal.toUpperCase().trim();
  }

  // Try to append RT/RW to Alamat if found
  let rtrwVal = findValueAfterLabel(lines, /rt[-/]*rw/i);
  if (!rtrwVal) {
    // Heuristic: search for pattern like 000/000 or digits/digits on any line
    const rtrwLine = lines.find(l => /\b\d{2,3}\s*\/\s*\d{2,3}\b/.test(l));
    if (rtrwLine) {
      const match = rtrwLine.match(/\b\d{2,3}\s*\/\s*\d{2,3}\b/);
      if (match) rtrwVal = match[0];
    }
  }
  if (rtrwVal) {
    data.alamat = `${data.alamat} RT/RW ${rtrwVal}`.trim().toUpperCase();
  }

  // Kelurahan / Desa
  let kelVal = findValueAfterLabel(lines, /kel.*desa|kelurahan|desa/i);
  if (!kelVal) {
    const idx = lines.findIndex(l => /kel.*desa|kelurahan|desa/i.test(l));
    if (idx !== -1) {
      for (const offset of [1, -1, -2, 2]) {
        const checkIdx = idx + offset;
        if (checkIdx >= 0 && checkIdx < lines.length) {
          const l = lines[checkIdx];
          if (!isLabel(l) && !/\d/.test(l) && l.length > 2) {
            kelVal = l;
            break;
          }
        }
      }
    }
  }
  if (kelVal) {
    data.kelurahan = kelVal.toUpperCase().trim();
  }

  // Kecamatan
  let kecVal = findValueAfterLabel(lines, /kecamatan|kec/i);
  if (!kecVal) {
    const idx = lines.findIndex(l => /kecamatan|kec/i.test(l));
    if (idx !== -1) {
      for (const offset of [1, -1, 2]) {
        const checkIdx = idx + offset;
        if (checkIdx >= 0 && checkIdx < lines.length) {
          const l = lines[checkIdx];
          if (!isLabel(l) && !/\d/.test(l) && l.length > 2) {
            kecVal = l;
            break;
          }
        }
      }
    }
  }
  if (kecVal) {
    data.kecamatan = kecVal.toUpperCase().trim();
  }
  
  const kabMatch = text.match(/(?:kabupaten|kota)\s+([A-Za-z]+)/i);
  if (kabMatch && kabMatch[1]) {
    data.kabupaten = kabMatch[1].toUpperCase();
  }

  if (!data.statusNikah) {
    data.statusNikah = 'BELUM_KAWIN';
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

  // --- 1. OWNER NAME & CERTIFICATE NUMBER ---
  const pemegangHakIdx = lines.findIndex(l => /pemegang\s*hak|nama\s*pemilik/i.test(l));
  if (pemegangHakIdx !== -1) {
    for (let offset = 1; offset <= 5; offset++) {
      const checkIdx = pemegangHakIdx + offset;
      if (checkIdx < lines.length) {
        const l = lines[checkIdx];
        if (!data.nomorSertifikat) {
          const numMatch = l.match(/\b(\d{4,8})\b/);
          if (numMatch) {
            data.nomorSertifikat = numMatch[1];
            continue;
          }
        }
        if (!data.atasNama) {
          const isLabelLine = /no|nomor|desa|kel|kec|kab|tgl|tanggal/i.test(l);
          const hasDigits = /\d/.test(l);
          if (!isLabelLine && !hasDigits && l.length > 3) {
            data.atasNama = l.toUpperCase().replace(/[^A-Z\s.,']/g, '').trim();
          }
        }
      }
    }
  }

  if (!data.nomorSertifikat) {
    const shmNoMatch = text.match(/(?:hak\s+milik|no|nomor)\.?\s*(\d{4,8})/i);
    if (shmNoMatch) {
      data.nomorSertifikat = shmNoMatch[1];
    }
  }

  if (!data.atasNama) {
    const ownerVal = findValueAfterLabel(lines, /pemegang\s*hak|atas\s*nama|nama\s*pemilik/i);
    if (ownerVal) {
      data.atasNama = ownerVal.toUpperCase().replace(/[^A-Z\s.,']/g, '');
    }
  }

  // --- 2. LAND AREA ---
  const areaMatch = text.match(/luas\b.*?(\d+(?:\.\d+)?)\s*(?:m2|m²|meter|m\b)/i);
  if (areaMatch) {
    data.luasTanah = parseFloat(areaMatch[1]) || 0;
  } else {
    const luasIdx = lines.findIndex(l => /luas/i.test(l));
    if (luasIdx !== -1) {
      for (let offset = -3; offset <= 3; offset++) {
        const checkIdx = luasIdx + offset;
        if (checkIdx >= 0 && checkIdx < lines.length) {
          const l = lines[checkIdx];
          const m = l.match(/(\d+(?:\.\d+)?)\s*(?:m2|m²|meter|m\b)/i) || l.match(/\b(\d{2,6})\s*[mM]2/);
          if (m) {
            data.luasTanah = parseFloat(m[1]) || 0;
            break;
          }
        }
      }
    }
  }

  // --- 3. LOCATION / ADDRESS ---
  let kecamatanVal = findValueAfterLabel(lines, /kecamatan|kec/i);
  if (!kecamatanVal) {
    const kecMatch = text.match(/kec(?:amatan)?\.?\s+([A-Z\s]{3,20})/i);
    if (kecMatch) kecamatanVal = kecMatch[1];
  }
  data.kecamatan = kecamatanVal ? kecamatanVal.trim().toUpperCase() : '';

  // Desa / Kelurahan
  let desaVal = findValueAfterLabel(lines, /kelurahan|desa|kel/i);
  if (!desaVal) {
    const desaIdx = lines.findIndex(l => /desa\/kel/i.test(l) || /kelurahan|desa|kel/i.test(l));
    if (desaIdx !== -1 && desaIdx + 1 < lines.length) {
      const nextLine = lines[desaIdx + 1];
      if (!/tgl|tanggal|NIB|letak/i.test(nextLine) && nextLine.length > 2) {
        desaVal = nextLine;
      }
    }
  }
  const desa = desaVal ? desaVal.trim().toUpperCase() : '';

  // Kabupaten
  let kabVal = '';
  const kabIdx = lines.findIndex(l => /kabupaten\s*[\/\-]\s*kota|kabupaten|kota/i.test(l));
  if (kabIdx !== -1) {
    const line = lines[kabIdx];
    if (line.includes(':')) {
      const parts = line.split(':');
      if (parts[1] && parts[1].trim().length > 2) {
        kabVal = parts[1].trim();
      }
    }
    if (!kabVal && kabIdx + 1 < lines.length) {
      const nextLine = lines[kabIdx + 1];
      if (!/tgl|tanggal|ketua|penerbitan/i.test(nextLine) && nextLine.length > 2) {
        kabVal = nextLine;
      }
    }
  }
  if (!kabVal) {
    kabVal = findValueAfterLabel(lines, /kabupaten|kab/i);
    if (kabVal && (kabVal.toUpperCase().includes('/ KOTA') || kabVal.trim() === '/')) {
      kabVal = '';
    }
  }
  const kab = kabVal ? kabVal.trim().toUpperCase() : '';

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

    // ── 7. Tanggal Mulai ──────────────────────────────────────────────────
    facility.tanggalMulai = '';
    const mulaiPatterns = [
      /(?:Tanggal\s+)?Mulai\s*[:;=]?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{4})/i,
      /(?:Tanggal\s+)?Mulai\s*[:;=]?\s*(\d{1,2}\s+\w+\s+\d{4})/i,
      /(?:Tanggal\s+)?Mulai\s*[:;=]?\s*(\d{2}[-/]\d{4})/i,
      /Mulai\s*[:;=]?\s*([^\n\r]{4,20})/i,
    ];
    for (const pat of mulaiPatterns) {
      const m = block.match(pat);
      if (m) {
        const raw = m[1].trim();
        let parsed = parseDateDMY(raw) || parseIndonesianDate(raw);
        if (!parsed) {
          const myMatch = raw.match(/^(\d{2})[-/](\d{4})$/);
          if (myMatch) parsed = `${myMatch[2]}-${myMatch[1]}-01`;
        }
        if (parsed) { facility.tanggalMulai = parsed; break; }
      }
    }

    // ── 8. Suku Bunga ─────────────────────────────────────────────────────
    facility.sukuBunga = 0;
    const bungaPatterns = [
      /Suku\s+Bunga\s*(?:\/\s*Imbalan)?\s*[:;=]?\s*([\d.,]+)\s*%/i,
      /Bunga\s*[:;=]?\s*([\d.,]+)\s*%/i,
    ];
    for (const pat of bungaPatterns) {
      const m = block.match(pat);
      if (m) {
        const val = parseFloat(m[1].replace(',', '.')) || 0;
        if (val > 0) { facility.sukuBunga = val; break; }
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
