const parsers = require('../src/modules/ocr/utils/parsers');

const rawText = `
  NIK : 3325010101900002
  NAMA : IWAN KURNIAWAN
  TEMPAT/TGL LAHIR : BATANG, 12-12-1988
  JENIS KELAMIN : LAKI-LAKI
  ALAMAT : BUMI INDAH RT/RW 03/05
  KEL/DESA : DRIYOREJO
  KECAMATAN : BATANG
  STATUS PERKAWINAN : KAWIN
`;

const parsed = parsers.parseKTP(rawText);
console.log('Parsed KTP:', JSON.stringify(parsed, null, 2));

let rt = '';
let rw = '';
if (parsed.alamat) {
  const rtrwMatch = rawText.match(/RT\/?RW\s*[:;=]?\s*(\d{2,3})\s*[\/\-]\s*(\d{2,3})/i) ||
                    parsed.alamat.match(/RT\/?RW\s*(\d{2,3})\s*[\/\-]\s*(\d{2,3})/i);
  if (rtrwMatch) {
    rt = rtrwMatch[1];
    rw = rtrwMatch[2];
  }
}
console.log('RT/RW Match:', { rt, rw });
