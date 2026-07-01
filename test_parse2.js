const rawText = `PROVINSI JAWA TENGAH
ATEN PEMALANG

132?104910180022
HDI PUSPITASARI`;

function normalizeOcrDigits(text) {
  return String(text || '')
    .toUpperCase()
    .replace(/[IL|l\[\]]/g, '1')
    .replace(/[ODQ]/g, '0')
    .replace(/S/g, '5')
    .replace(/B/g, '8')
    .replace(/G/g, '6')
    .replace(/Z/g, '2');
}

const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
let nik = null;

for (const line of lines) {
  // Normalize digits, then aggressively strip all non-digit characters from the line
  const cleanedLine = normalizeOcrDigits(line).replace(/\D/g, '');
  const match = cleanedLine.match(/\d{16}/);
  if (match) {
    nik = match[0];
    break;
  }
}

console.log("Extracted NIK:", nik);

// Fallback Nama
let nama = null;
let foundNik = false;
for (let i = 0; i < lines.length; i++) {
  if (nik && lines[i].replace(/\D/g, '').includes(nik)) {
    foundNik = true;
    continue;
  }
  if (foundNik && lines[i].trim().length >= 3) {
    const candidate = lines[i].replace(/[^A-Z\s\.,']/gi, '').trim();
    if (candidate.length >= 3) {
      nama = candidate;
      break;
    }
  }
}
console.log("Extracted Nama:", nama);

