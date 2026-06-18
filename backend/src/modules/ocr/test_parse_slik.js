const fs = require('fs');
const text = fs.readFileSync('/opt/credit_analysis_system/slik_raw.txt', 'utf8');

function getCleanLines(text) {
  return text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
}

function parseMoney(str) {
  if (!str) return 0;
  let clean = String(str).replace(/Rp\.?\s*/gi, '').trim();
  clean = clean.replace(/\s/g, '');
  if (clean.includes(',') && clean.includes('.')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',') && !clean.includes('.')) {
    const commaIdx = clean.lastIndexOf(',');
    if (clean.substring(commaIdx + 1).length <= 2) {
      clean = clean.replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes('.')) {
    const parts = clean.split('.');
    if (parts[parts.length - 1].length <= 2 && parts.length > 1) {
      clean = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
    } else {
      clean = clean.replace(/\./g, '');
    }
  }
  return parseFloat(clean) || 0;
}

function parseDateDMY(str) {
  if (!str) return '';
  const m = str.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  return '';
}

function parseIndonesianDate(str) {
  if (!str) return '';
  const months = { januari:'01',februari:'02',maret:'03',april:'04',mei:'05',juni:'06',juli:'07',agustus:'08',september:'09',oktober:'10',november:'11',desember:'12',
    jan:'01',feb:'02',mar:'03',apr:'04',jun:'06',jul:'07',ags:'08',sep:'09',okt:'10',nov:'11',des:'12' };
  const parts = str.toLowerCase().replace(/[^a-z0-9\s\-]/g, '').trim().split(/[\s\-]+/);
  if (parts.length >= 3) {
    const day = parts[0].padStart(2, '0');
    const month = months[parts[1]] || '01';
    const year = parts[2];
    if (/^\d{4}$/.test(year)) return `${year}-${month}-${day}`;
  }
  return '';
}

// EXACT MATCH for facilities header: \n followed by 2-10 digits, a dash, and the bank type
const splitRegex = /(?=\n\d{2,10}\s*-\s*(?:PT\.?\s+|BANK\s+|BPR\s+|BKK\s+|KOPERASI\s+|KSP\s+|PD\.?\s+|CV\.?\s+))/gi;

// Try matching facilities. If this fails (e.g., format differs), we fall back.
const facilityBlocks = text.split(splitRegex).filter(block => block.match(/^\n?\d{2,10}\s*-\s*/));

const detailSlik = [];

for (const block of facilityBlocks) {
  const blockLines = getCleanLines(block);
  if (blockLines.length < 2) continue;

  let bankName = '';
  // The block starts with the bank name line
  const firstLine = blockLines[0].toUpperCase();
  
  // Extract bank name from the first line
  let name = firstLine
    .replace(/^\d+\s*-\s*/, '') // Remove prefix "252090 - "
    .split(/\s+(?:Rp|NO\.|No\.|TGL\.|Tgl\.|Kode\s+Pihak|Kualitas|Kuala\s+Kred|Pihak\s+Ke|Nomor\s+Rekening|Kantor|Cabang|KPO|KC|KCP|\t)\b/i)[0] // Splitting by tab (\t) also removes extraneous data
    .split(/[\/\(]/)[0] // Remove (UUS) etc.
    .trim();
  if (name.length >= 3) bankName = name;

  if (!bankName) continue;

  const facility = { bank: bankName, jenisFasilitas: 'Kredit', plafon: 0, bakiDebet: 0, kolektibilitas: 1, jatuhTempo: '' };

  const plafonPatterns = [/Plafon\s+Awal\s*[:;=]?\s*(?:Rp\.?\s*)?([\d.,]+)/i, /Plafon\s*[:;=]?\s*(?:Rp\.?\s*)?([\d.,]+)/i];
  for (const pat of plafonPatterns) {
    const m = block.match(pat);
    if (m) { const val = parseMoney(m[1]); if (val > 0) { facility.plafon = val; break; } }
  }

  const bakiPatterns = [/Baki\s+Debet\s*[:;=]?\s*(?:Rp\.?\s*)?([\d.,]+)/i];
  for (const pat of bakiPatterns) {
    const m = block.match(pat);
    if (m) { const val = parseMoney(m[1]); if (val > 0) { facility.bakiDebet = val; break; } }
  }
  
  // If baki debet pattern not found, try to find it from the first 3 lines (e.g. BNI case)
  if (facility.bakiDebet === 0) {
    for (let i = 0; i < Math.min(3, blockLines.length); i++) {
        const rpMatch = blockLines[i].match(/Rp\s*([\d.,]+)/i);
        if (rpMatch) {
            facility.bakiDebet = parseMoney(rpMatch[1]);
            break;
        }
    }
  }

  // Also try to find Plafon from the line after "0  Plafon  Rp 9.227.962,00"
  if (facility.plafon === 0) {
     const m = block.match(/Plafon\s*(?:Rp\.?\s*)?([\d.,]+)/i);
     if (m) facility.plafon = parseMoney(m[1]);
  }

  const kolPatterns = [/(?:Kualitas|Kolektibilitas|Kol\.?)\s*[:;=]?\s*([1-5])\s*[-–]?\s*(Lancar|Perhatian|Kurang|Diragukan|Macet)?/i];
  for (const pat of kolPatterns) {
    const m = block.match(pat);
    if (m) { facility.kolektibilitas = parseInt(m[1]) || 1; break; }
  }

  const jtPatterns = [/(?:Tanggal\s+)?Jatuh\s+Tempo\s*[:;=]?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{4})/i, /(?:Tanggal\s+)?Jatuh\s+Tempo\s*[:;=]?\s*(\d{1,2}\s+\w+\s+\d{4})/i];
  for (const pat of jtPatterns) {
    const m = block.match(pat);
    if (m) { facility.jatuhTempo = parseDateDMY(m[1].trim()) || parseIndonesianDate(m[1].trim()); break; }
  }

  detailSlik.push(facility);
}

console.log(JSON.stringify(detailSlik, null, 2));
