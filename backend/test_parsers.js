const { readFileSync } = require('fs');
const code = readFileSync('./src/modules/ocr/utils/parsers.js', 'utf8');
eval(code);

// Override logic to test
const rawText = "Nama : SAPTO NUGROHO EAE ET\nTempat/Tgl Lahir : KEBUMEN, 10-10-1969";
let data = parseKTP(rawText);

// The logic we want to test
let nameStr = data.nama;
const parts = nameStr.split(' ');
const validShortNames = ['BIN', 'BINTI', 'SRI', 'NUR', 'TRI', 'DWI', 'EKA', 'EDI', 'ALI', 'IDA', 'ADE', 'ANI', 'ARI', 'MIA', 'TIA', 'LIA', 'NIA', 'INA', 'IRA', 'IKA', 'ITA', 'AL', 'LA', 'EL', 'DE', 'VAN', 'DR', 'H', 'HJ', 'ST', 'M', 'S', 'I', 'RR', 'RA', 'NY', 'TN', 'KH', 'TB', 'CUT', 'NYM', 'AYU', 'BGS', 'GDE', 'NGH', 'KT', 'MD', 'KM', 'GD', 'ZUL', 'ABU', 'UMI'];

while (parts.length > 1) {
  const last = parts[parts.length - 1];
  if (last.length <= 3 && !validShortNames.includes(last)) {
    const isAllVowels = /^[AIUEO]+$/.test(last);
    const isAllConsonants = /^[^AIUEO]+$/.test(last);
    const isKnownNoise = ['ET', 'EA', 'AE', 'IE', 'EI', 'EE', 'OO', 'UU', 'II', 'AA'].includes(last);
    if (isAllVowels || isAllConsonants || isKnownNoise) {
      parts.pop();
      continue;
    }
  }
  break;
}
console.log(parts.join(' '));
