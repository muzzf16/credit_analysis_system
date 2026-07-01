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

const nikCandidates = [ ...lines ];

for (const cand of nikCandidates) {
    const cleaned = normalizeOcrDigits(cand);
    const digitsOnly = cleaned.replace(/\D/g, '');
    const match = digitsOnly.match(/\d{14,17}/);
    if (match) {
        nik = match[0];
        break;
    }
}
console.log("Extracted NIK:", nik);

let nama = null;
if (!nama && nik) {
    const nikIdx = lines.findIndex(l => {
        const stripped = l.replace(/\D/g, '');
        return stripped.includes(nik) || /\bNIK\b/i.test(l);
    });
    if (nikIdx !== -1) {
        for (let j = nikIdx + 1; j < lines.length; j++) {
            const candidate = lines[j]?.trim();
            if (!candidate) continue;
            
            let cleaned = candidate.toUpperCase().replace(/^(?:NAMA|MAMA|NEMA)\s*[:;=]?\s*/i, '');
            cleaned = cleaned.replace(/[^A-Z\s.,']/g, '').trim();
            
            if (cleaned.length >= 3) {
                nama = cleaned;
                break;
            }
        }
    }
}
console.log("Extracted Nama:", nama);
