const text = `5 PENA 4 —
Ta 5 300
—, I “5 1 z 52
Ai 1 5 3.
— TN . tt 5 £
In $ | 2
NUN |`;

function normalizeOcrDigits(t) {
  return String(t || '')
    .toUpperCase()
    .replace(/[IL|l\[\]]/g, '1')
    .replace(/[ODQ]/g, '0')
    .replace(/S/g, '5')
    .replace(/B/g, '8')
    .replace(/G/g, '6')
    .replace(/Z/g, '2')
    .replace(/A/g, '4')
    .replace(/T/g, '7')
    .replace(/E/g, '3');
}
const cleaned = normalizeOcrDigits(text);
console.log(cleaned);
const digitsOnly = cleaned.replace(/\D/g, '');
console.log(digitsOnly);
