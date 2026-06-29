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
 * Split OCR text into better KTP-oriented lines when Tesseract returns
 * a mostly single-line paragraph.
 * @param {string} text
 * @returns {string}
 */
function segmentKtpText(text) {
  let out = String(text || '').replace(/\r/g, '\n');

  // Ensure known labels begin on their own line.
  const labels = [
    'NIK',
    'NAMA',
    'TEMPAT/TGL LAHIR',
    'TEMPAT LAHIR',
    'TGL LAHIR',
    'JENIS KELAMIN',
    'ALAMAT',
    'RT/RW',
    'RTRW',
    'KEL/DESA',
    'KELURAHAN',
    'DESA',
    'KECAMATAN',
    'AGAMA',
    'STATUS PERKAWINAN',
    'PEKERJAAN',
    'KEWARGANEGARAAN',
    'BERLAKU HINGGA'
  ];

  for (const label of labels) {
    const pattern = new RegExp(`\\s*${label.replace(/\//g, '\\/')}\\s*[:;=]?`, 'gi');
    out = out.replace(pattern, (match) => `\n${match.trim()}`);
  }

  // Put obvious value separators on new lines too.
  out = out
    .replace(/\b([A-Z]{2,})\s{2,}([A-Z]{2,})\b/g, '$1\n$2')
    .replace(/(\d{16})\s+(?=[A-Z])/g, '$1\n')
    .replace(/(\d{2}\s*[\/\-]\s*\d{2,3})\s+(?=[A-Z])/g, '$1\n');

  return out;
}

/**
 * Normalize OCR text for numeric extraction only.
 * This keeps digits intact and converts common letter confusions to digits.
 * @param {string} text
 * @returns {string}
 */
function normalizeOcrDigits(text) {
  return String(text || '')
    .toUpperCase()
    .replace(/[IL|]/g, '1')
    .replace(/[ODQ]/g, '0')
    .replace(/S/g, '5')
    .replace(/B/g, '8')
    .replace(/G/g, '6')
    .replace(/Z/g, '2');
}

/**
 * Normalize OCR text for label matching and comparisons.
 * @param {string} text
 * @returns {string}
 */
function normalizeOcrText(text) {
  return String(text || '').toUpperCase().replace(/\s+/g, ' ').trim();
}

/**
 * Extract the value part from a label line.
 * @param {string} line
 * @returns {string}
 */
function extractInlineValue(line) {
  const parts = String(line || '').split(/[:;=]/);
  if (parts.length < 2) return '';
  return parts.slice(1).join(':').trim();
}

/**
 * Extract text after a label even if no separator exists.
 * @param {string} line
 * @param {RegExp} labelRegex
 * @returns {string}
 */
function extractValueAfterLabelMatch(line, labelRegex) {
  const text = String(line || '');
  const permissiveSource = labelRegex.source.replace(/\\b/g, '');
  const permissiveFlags = labelRegex.flags.replace(/g/g, '');
  const permissiveRegex = new RegExp(permissiveSource, permissiveFlags);
  const match = text.match(permissiveRegex);
  if (!match) return '';
  return text.slice(match.index + match[0].length).replace(/^[:;=\s]+/, '').trim();
}

/**
 * Determine whether a line likely contains an OCR label.
 * @param {string} line
 * @returns {boolean}
 */
function isLikelyLabelLine(line) {
  const normalized = normalizeOcrText(line);
  if (!normalized) return false;
  return /^(NIK|NAMA|TEMPAT\b|TGL\b|TEMPAT\/TGL|JENIS\s*KELAMIN|ALAMAT|RT\s*\/\s*RW|RTRW|KEL\s*\/\s*DESA|KELURAHAN|DESA|KECAMATAN|AGAMA|STATUS\s*PERKAWINAN|STATUS\s*KAWIN|PEKERJAAN|KEWARGANEGARAAN|PEMEGANG\s*HAK|ATAS\s*NAMA|NOMOR|MERK|MEREK|TIPE|TAHUN|KABUPATEN|KOTA|LUAS|NIB|SURAT|HAK)\b/i.test(normalized);
}

/**
 * Check whether a line is a KTP label.
 * @param {string} line
 * @returns {boolean}
 */
function isKtpLabelLine(line) {
  const normalized = normalizeOcrText(line);
  if (!normalized) return false;
  return /^(NIK|NAMA|TEMPAT(?:\s*\/\s*TGL)?(?:\s*LAHIR)?|TGL\s*LAHIR|JENIS\s*KELAMIN|ALAMAT|RT\s*\/\s*RW|RTRW|KEL\s*\/\s*DESA|KELURAHAN|DESA|KECAMATAN|AGAMA|STATUS\s*PERKAWINAN|STATUS\s*KAWIN|PEKERJAAN|KEWARGANEGARAAN)\b/i.test(normalized);
}

/**
 * Find the next meaningful non-empty line after a given index.
 * @param {string[]} lines
 * @param {number} index
 * @returns {string}
 */
function getNextMeaningfulLine(lines, index) {
  for (let i = index + 1; i < lines.length; i++) {
    const candidate = lines[i]?.trim();
    if (candidate) return candidate;
  }
  return '';
}

/**
 * Collect value lines after a label until a stop condition is met.
 * @param {string[]} lines
 * @param {number} index
 * @param {object} options
 * @returns {string[]}
 */
function collectFollowingValueLines(lines, index, options = {}) {
  const {
    maxLines = 3,
    stopWhen = () => false,
    allowInline = true
  } = options;

  const collected = [];
  if (allowInline) {
    const inlineValue = extractInlineValue(lines[index]);
    if (inlineValue) collected.push(inlineValue);
  }

  for (let i = index + 1; i < lines.length && collected.length < maxLines; i++) {
    const candidate = lines[i]?.trim();
    if (!candidate) continue;
    if (stopWhen(candidate)) break;
    collected.push(candidate);
  }

  return collected;
}

/**
 * Parse RT/RW from a chunk of OCR text.
 * @param {string} text
 * @returns {string}
 */
function parseRtRw(text) {
  const raw = String(text || '');
  if (!/[0-9\/\-\s]/.test(raw)) return '';
  if (!/[\/\-]/.test(raw) && raw.replace(/\D/g, '').length > 8) return '';

  const normalized = normalizeOcrDigits(raw).replace(/[^0-9\/\-\s]/g, ' ');
  const match = normalized.match(/\b(\d{3})\s*(?:[\/\-\s])\s*(\d{3})\b/);
  if (!match) return '';

  const left = match[1].replace(/\D/g, '').padStart(3, '0');
  const right = match[2].replace(/\D/g, '').padStart(3, '0');
  return `${left}/${right}`;
}

/**
 * Parse a TTL chunk into place and YYYY-MM-DD date.
 * @param {string} text
 * @returns {{ place: string, date: string }}
 */
function parseTtlChunk(text) {
  const raw = String(text || '').replace(/\s+/g, ' ').trim();
  if (!raw) return { place: '', date: '' };

  const withoutLabel = raw
    .replace(/^(?:TEMPAT(?:\s*\/\s*TGL)?(?:\s*LAHIR)?|TGL\s*LAHIR)\s*[:;=,\-/]*/i, '')
    .trim();
  const normalizedDigits = normalizeOcrDigits(withoutLabel);
  const dateMatch = normalizedDigits.match(/(\d{1,2})\s*[-\/.]\s*(\d{1,2})\s*[-\/.]\s*(\d{4})/);

  let place = withoutLabel || raw;
  let date = '';

  if (dateMatch) {
    const [, d, m, y] = dateMatch;
    date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    const beforeDate = withoutLabel.slice(0, dateMatch.index).replace(/[,;:-]+$/g, '').trim();
    if (beforeDate) {
      place = beforeDate;
    } else {
      const commaIdx = withoutLabel.indexOf(',');
      if (commaIdx !== -1) {
        place = withoutLabel.slice(0, commaIdx).trim();
      } else {
        place = withoutLabel.slice(0, withoutLabel.toUpperCase().indexOf(dateMatch[0].toUpperCase())).trim();
      }
    }
  } else {
    const dateOnlyMatch = normalizedDigits.match(/(\d{1,2})\s*[-\/.]\s*(\d{1,2})\s*[-\/.]\s*(\d{4})/);
    if (dateOnlyMatch) {
      const [, d, m, y] = dateOnlyMatch;
      date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }

  place = place
    .replace(/^(?:TEMPAT(?:\s*\/\s*TGL)?(?:\s*LAHIR)?|TGL\s*LAHIR)\s*[:;=,\-/]*/i, '')
    .replace(/\bTEMPAT\b|\bTGL\b|\bLAHIR\b|\bLAHIR\b/gi, ' ')
    .replace(/[,:;]+$/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

  return { place, date };
}

/**
 * Extract a KTP field block from raw OCR text until the next known label.
 * Works for both inline values and multi-line OCR output.
 * @param {string} text
 * @param {string[]} labels
 * @param {string[]} nextLabels
 * @returns {string}
 */
function extractKtpFieldBlock(text, labels, nextLabels) {
  const source = String(text || '').replace(/\r/g, '\n');
  if (!source) return '';

  const escapedLabels = labels.map(label =>
    label
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\s+/g, '\\s*')
      .replace(/\//g, '\\s*\\/\\s*')
  );
  const escapedNextLabels = nextLabels.map(label =>
    label
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\s+/g, '\\s*')
      .replace(/\//g, '\\s*\\/\\s*')
  );

  const labelPattern = escapedLabels.join('|');
  const stopPattern = escapedNextLabels.length
    ? `(?=\\n\\s*(?:${escapedNextLabels.join('|')})\\b|$)`
    : '$';

  const regex = new RegExp(
    `(?:^|\\n)\\s*(?:${labelPattern})\\b\\s*[:;=]?\\s*([\\s\\S]*?)${stopPattern}`,
    'i'
  );
  const match = source.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Generic helper to find the value after a label.
 * @param {string[]} lines
 * @param {RegExp} labelRegex
 * @param {object} options
 * @returns {string}
 */
function findValueAfterLabel(lines, labelRegex, options = {}) {
  const {
    maxLookahead = 3,
    allowInline = true,
    stopWhen = isLikelyLabelLine
  } = options;
  const permissiveSource = labelRegex.source.replace(/\\b/g, '');
  const permissiveFlags = labelRegex.flags.replace(/g/g, '');
  const permissiveRegex = new RegExp(permissiveSource, permissiveFlags);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!labelRegex.test(line) && !permissiveRegex.test(line)) continue;

    if (allowInline) {
      const inlineValue = extractInlineValue(line);
      if (inlineValue && !stopWhen(inlineValue)) {
        return inlineValue.trim();
      }

      const inlineAfterLabel = extractValueAfterLabelMatch(line, labelRegex);
      if (inlineAfterLabel && !stopWhen(inlineAfterLabel)) {
        return inlineAfterLabel.trim();
      }
    }

    const collected = [];
    for (let j = i + 1; j < lines.length && collected.length < maxLookahead; j++) {
      const candidate = lines[j]?.trim();
      if (!candidate) continue;
      if (stopWhen(candidate)) break;
      collected.push(candidate);
      if (candidate.includes(':')) break;
    }

    if (collected.length > 0) {
      return collected.join(' ').trim();
    }
  }

  return '';
}

/**
 * Parser for KTP (Kartu Tanda Penduduk) - State Machine Approach
 * @param {string} text 
 * @returns {object}
 */
function parseKTP(text) {
  const rawText = String(text || '').replace(/\r/g, '\n');
  const lines = getCleanLines(rawText);

  const data = {
    nik: '',
    nama: '',
    tempat_tgl_lahir: '',
    jenis_kelamin: 'LAKI-LAKI',
    alamat: '',
    rt_rw: '',
    kel_desa: '',
    kecamatan: '',
    agama: '',
    status_perkawinan: 'BELUM_KAWIN',
    pekerjaan: '',
    kewarganegaraan: 'WNI',
    berlaku_hingga: 'SEUMUR HIDUP'
  };

  // Extract NIK first. Use numeric-only OCR normalization so digits never
  // get converted back into letters.
  const nikBlock = extractKtpFieldBlock(rawText, ['NIK'], [
    'Nama',
    'Tempat/Tgl Lahir',
    'Tempat Lahir',
    'Tgl Lahir',
    'Jenis Kelamin'
  ]);
  const nikCandidates = [
    nikBlock,
    segmentKtpText(rawText),
    rawText,
    ...lines,
    ...lines.map((line, index) => `${line} ${getNextMeaningfulLine(lines, index)}`)
  ];
  for (const candidate of nikCandidates) {
    const normalized = normalizeOcrDigits(candidate).replace(/\D/g, '');
    const nikMatch = normalized.match(/\d{16}/);
    if (nikMatch) {
      data.nik = nikMatch[0];
      break;
    }
  }

  const namaBlock = extractKtpFieldBlock(rawText, ['Nama'], [
    'Tempat/Tgl Lahir',
    'Tempat Lahir',
    'Tgl Lahir',
    'Jenis Kelamin',
    'Alamat'
  ]);
  if (namaBlock) {
    data.nama = namaBlock
      .split('\n')[0]
      .toUpperCase()
      .replace(/[^A-Z\s.,']/g, ' ')
      .replace(/\b(?:AN|BIN|BINTI)\s*$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const ttlBlock = extractKtpFieldBlock(rawText, ['Tempat/Tgl Lahir', 'Tempat Lahir', 'Tgl Lahir'], [
    'Jenis Kelamin',
    'Alamat'
  ]);
  if (ttlBlock) {
    const { place, date } = parseTtlChunk(ttlBlock);
    if (place && date) data.tempat_tgl_lahir = `${place}, ${date}`;
    else if (place) data.tempat_tgl_lahir = place;
  }

  const alamatBlock = extractKtpFieldBlock(rawText, ['Alamat'], [
    'RT/RW',
    'RTRW',
    'Kel/Desa',
    'Kelurahan',
    'Desa',
    'Kecamatan',
    'Agama'
  ]);
  if (alamatBlock) {
    const cleanedAddressLines = alamatBlock
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .filter(line => !parseRtRw(line));
    data.alamat = cleanedAddressLines
      .join(' ')
      .replace(/[^A-Z0-9\s\/\-().]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

  const rtRwBlock = extractKtpFieldBlock(rawText, ['RT/RW', 'RTRW'], [
    'Kel/Desa',
    'Kelurahan',
    'Desa',
    'Kecamatan',
    'Agama'
  ]);
  const parsedRtRwBlock = parseRtRw(rtRwBlock);
  if (parsedRtRwBlock) data.rt_rw = parsedRtRwBlock;

  const kelDesaBlock = extractKtpFieldBlock(rawText, ['Kel/Desa', 'Kelurahan', 'Desa'], [
    'Kecamatan',
    'Agama',
    'Status Perkawinan',
    'Pekerjaan'
  ]);
  if (kelDesaBlock && !parseRtRw(kelDesaBlock) && !isKtpLabelLine(kelDesaBlock)) {
    data.kel_desa = kelDesaBlock
      .split('\n')[0]
      .toUpperCase()
      .replace(/[^A-Z0-9\s\-()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const kecamatanBlock = extractKtpFieldBlock(rawText, ['Kecamatan'], [
    'Agama',
    'Status Perkawinan',
    'Pekerjaan',
    'Kewarganegaraan'
  ]);
  if (kecamatanBlock && !parseRtRw(kecamatanBlock) && !isKtpLabelLine(kecamatanBlock)) {
    data.kecamatan = kecamatanBlock
      .split('\n')[0]
      .toUpperCase()
      .replace(/[^A-Z0-9\s\-()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1] || '';
    const nextNextLine = lines[i + 2] || '';
    const normalizedLine = normalizeOcrText(line);
    const normalizedNext = normalizeOcrText(nextLine);

    // Detect label and switch state
    if (/\bNIK\b/i.test(normalizedLine) && !data.nik) {
      const nikChunk = collectFollowingValueLines(lines, i, {
        maxLines: 2,
        stopWhen: isKtpLabelLine
      }).join(' ');
      const candidate = normalizeOcrDigits(`${line} ${nikChunk}`);
      const nikMatch = candidate.match(/\b\d{16}\b/);
      if (nikMatch) {
        data.nik = nikMatch[0];
      }
      continue;
    }

    if (/\bNAMA\b/i.test(normalizedLine) && !data.nama) {
      const value = findValueAfterLabel(lines.slice(i), /\bNAMA\b/i, {
        maxLookahead: 2,
        stopWhen: isKtpLabelLine
      });
      if (value && !/\d/.test(value)) {
        data.nama = value.toUpperCase().replace(/[^A-Z\s.,']/g, '').trim();
      }
      continue;
    }

    if ((/\bTEMPAT\b/i.test(normalizedLine) || /\bTGL\b.*\bLAHIR\b/i.test(normalizedLine)) && !data.tempat_tgl_lahir) {
      const ttlChunk = collectFollowingValueLines(lines, i, {
        maxLines: 3,
        stopWhen: isKtpLabelLine
      }).join(' ');
      const { place, date } = parseTtlChunk(`${line} ${ttlChunk}`);
      if (place && date) {
        data.tempat_tgl_lahir = `${place}, ${date}`;
      } else if (place && !data.tempat_tgl_lahir) {
        data.tempat_tgl_lahir = place;
      }
      continue;
    }

    if (/\bJENIS\b.*\bKELAMIN\b/i.test(normalizedLine)) {
      const sexChunk = `${line} ${nextLine} ${nextNextLine}`;
      if (/\bPEREMPUAN\b|\bWANITA\b/i.test(sexChunk)) {
        data.jenis_kelamin = 'PEREMPUAN';
      } else if (/\bLAKI[- ]?LAKI\b/i.test(sexChunk) || normalizedNext === 'L') {
        data.jenis_kelamin = 'LAKI-LAKI';
      } else if (normalizedNext === 'P') {
        data.jenis_kelamin = 'PEREMPUAN';
      } else {
        data.jenis_kelamin = 'LAKI-LAKI';
      }
      continue;
    }

    if (/\bALAMAT\b/i.test(normalizedLine) && !data.alamat) {
      const addressLines = [];
      const inlineValue = extractInlineValue(line);
      if (inlineValue) addressLines.push(inlineValue);

      for (let j = i + 1; j < lines.length; j++) {
        const candidate = lines[j]?.trim();
        if (!candidate) continue;
        if (isKtpLabelLine(candidate)) break;

        const rtRwFromCandidate = parseRtRw(candidate);
        if (rtRwFromCandidate) {
          data.rt_rw = rtRwFromCandidate;
          break;
        }

        addressLines.push(candidate);
        if (addressLines.length >= 4) break;
      }

      let address = addressLines.join(' ').toUpperCase();
      const embeddedRtRwMatch = normalizeOcrDigits(address).match(/\b\d{3}\s*(?:[\/\-])\s*\d{3}\b/);
      if (embeddedRtRwMatch) {
        const embeddedRtRw = parseRtRw(embeddedRtRwMatch[0]);
        data.rt_rw = embeddedRtRw;
        address = address.replace(/\d{1,3}\s*(?:[\/\-\s])\s*\d{1,3}.*/g, ' ');
      }
      data.alamat = address.replace(/[^A-Z0-9\s\/\-()]/g, ' ').replace(/\s+/g, ' ').trim();
      continue;
    }

    if ((/\bRT\s*\/\s*RW\b|\bRTRW\b/i.test(normalizedLine)) && !data.rt_rw) {
      const rtRwChunk = collectFollowingValueLines(lines, i, {
        maxLines: 2,
        stopWhen: isKtpLabelLine
      }).join(' ');
      const rtRw = parseRtRw(`${line} ${rtRwChunk}`);
      if (rtRw) data.rt_rw = rtRw;
      continue;
    }

    if ((/\bKEL\s*\/\s*DESA\b|\bKELURAHAN\b|\bDESA\b/i.test(normalizedLine)) && !data.kel_desa) {
      let value = extractInlineValue(line);
      if (!value || isKtpLabelLine(value) || parseRtRw(value)) {
        const nextValue = getNextMeaningfulLine(lines, i);
        if (nextValue && !isKtpLabelLine(nextValue) && !parseRtRw(nextValue)) {
          value = nextValue;
        }
      }
      if (value && !isKtpLabelLine(value) && !parseRtRw(value)) {
        data.kel_desa = value.toUpperCase().replace(/[^A-Z0-9\s\-()]/g, ' ').replace(/\s+/g, ' ').trim();
      }
      continue;
    }

    if (/\bKECAMATAN\b/i.test(normalizedLine) && !data.kecamatan) {
      const value = findValueAfterLabel(lines.slice(i), /\bKECAMATAN\b/i, {
        maxLookahead: 2,
        stopWhen: isKtpLabelLine
      });
      if (value && !isKtpLabelLine(value) && !parseRtRw(value)) {
        data.kecamatan = value.toUpperCase().replace(/[^A-Z0-9\s\-()]/g, ' ').replace(/\s+/g, ' ').trim();
      }
      continue;
    }

    if (/\bAGAMA\b/i.test(normalizedLine)) {
      const value = findValueAfterLabel(lines.slice(i), /\bAGAMA\b/i, {
        maxLookahead: 1,
        stopWhen: isKtpLabelLine
      });
      if (value) {
        data.agama = value.toUpperCase().trim();
      }
      continue;
    }

    if (/\bSTATUS\b.*\bPERKAWINAN\b|\bSTATUS\b.*\bKAWIN\b/i.test(normalizedLine)) {
      const statusChunk = collectFollowingValueLines(lines, i, {
        maxLines: 2,
        stopWhen: isKtpLabelLine
      }).join(' ');
      if (/BELUM/i.test(statusChunk)) data.status_perkawinan = 'BELUM_KAWIN';
      else if (/CERAI.*MATI/i.test(statusChunk)) data.status_perkawinan = 'CERAI_MATI';
      else if (/CERAI.*HIDUP/i.test(statusChunk)) data.status_perkawinan = 'CERAI_HIDUP';
      else if (/KAWIN|MENIKAH/i.test(statusChunk)) data.status_perkawinan = 'KAWIN';
      continue;
    }

    if (/\bPEKERJAAN\b/i.test(normalizedLine)) {
      const value = findValueAfterLabel(lines.slice(i), /\bPEKERJAAN\b/i, {
        maxLookahead: 2,
        stopWhen: isKtpLabelLine
      });
      if (value) {
        data.pekerjaan = value.toUpperCase().replace(/[^A-Z0-9\s\-()\/.]/g, ' ').replace(/\s+/g, ' ').trim();
      }
      continue;
    }

    if (/\bKEWARGANEGARAAN\b/i.test(normalizedLine)) {
      const value = findValueAfterLabel(lines.slice(i), /\bKEWARGANEGARAAN\b/i, {
        maxLookahead: 1,
        stopWhen: isKtpLabelLine
      });
      if (/WNA/i.test(value)) data.kewarganegaraan = 'WNA';
      else if (/WNI/i.test(value)) data.kewarganegaraan = 'WNI';
      continue;
    }

    // Backstop for very fragmented OCR where label/value are split across
    // consecutive lines without punctuation.
    if (!data.rt_rw) {
      const rtRw = parseRtRw(`${line} ${nextLine}`);
      if (rtRw && /^(?:\d{1,3}\s*[\/\-\s]\s*\d{1,3})$/.test(normalizeOcrDigits(`${line} ${nextLine}`).replace(/[^0-9\/\-\s]/g, ' ').trim())) {
        data.rt_rw = rtRw;
      }
    }
  }

  // Fallbacks for OCR that produces label/value on separate lines with little structure.
  if (!data.nama) {
    const idx = lines.findIndex(l => /\bNAMA\b/i.test(normalizeOcrText(l)));
    if (idx !== -1) {
      for (let j = idx + 1; j < lines.length; j++) {
        const candidate = lines[j]?.trim();
        if (!candidate) continue;
        if (isKtpLabelLine(candidate)) break;
        if (!/\d/.test(candidate)) {
          data.nama = candidate.toUpperCase().replace(/[^A-Z\s.,']/g, '').trim();
          break;
        }
      }
    }
    if (!data.nama) {
      const nikIdx = lines.findIndex(l => /\bNIK\b/i.test(normalizeOcrText(l)));
      if (nikIdx !== -1) {
        for (let j = nikIdx + 1; j < lines.length; j++) {
          const candidate = lines[j]?.trim();
          if (!candidate) continue;
          if (isKtpLabelLine(candidate) || /\d{8,}/.test(candidate)) continue;
          data.nama = candidate.toUpperCase().replace(/[^A-Z\s.,']/g, '').trim();
          if (data.nama) break;
        }
      }
    }
  }

  if (!data.alamat) {
    const idx = lines.findIndex(l => /\bALAMAT\b/i.test(normalizeOcrText(l)));
    if (idx !== -1) {
      const collected = [];
      for (let j = idx + 1; j < lines.length; j++) {
        const candidate = lines[j]?.trim();
        if (!candidate) continue;
        if (isKtpLabelLine(candidate)) break;
        const rtRw = parseRtRw(candidate);
        if (rtRw) {
          data.rt_rw = data.rt_rw || rtRw;
          continue;
        }
        collected.push(candidate);
        if (collected.length >= 4) break;
      }
      if (collected.length > 0) {
        data.alamat = collected.join(' ').toUpperCase().replace(/[^A-Z0-9\s\/\-()]/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }
  }

  if (!data.rt_rw) {
    const rtLine = lines.find(l => parseRtRw(l));
    if (rtLine) data.rt_rw = parseRtRw(rtLine);
  }

  // Clean and normalize fields
  if (data.nama) data.nama = data.nama.replace(/[^A-Z\s.,']/g, '').replace(/\s+/g, ' ').trim();
  if (data.alamat) data.alamat = data.alamat.replace(/\s+/g, ' ').trim();

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
