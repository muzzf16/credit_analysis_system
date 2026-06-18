const fs = require('fs');
const text = fs.readFileSync('/opt/credit_analysis_system/slik_raw.txt', 'utf8');

const splitRegex = /(?=\n(?:\d{2,10}\s*-\s*)?(?:PT\.?\s+|BANK\s+|BPR\s+|BKK\s+|KOPERASI\s+|KSP\s+|PD\.?\s+|CV\.?\s+))/gi;

const parts = text.split(splitRegex);
console.log(`Found ${parts.length} parts`);
for (let i = 0; i < parts.length; i++) {
  const lines = parts[i].split('\n').filter(l => l.trim().length > 0);
  if (lines.length > 0) {
    console.log(`Block ${i}: starts with "${lines[0].substring(0, 50)}"`);
  }
}
