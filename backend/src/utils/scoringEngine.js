/**
 * 5C Credit Scoring Engine — BPR BAPERA BATANG
 * Character 25% | Capacity 30% | Capital 15% | Collateral 20% | Condition 10%
 */

const DEFAULT_BOBOT = { character: 25, capacity: 30, capital: 15, collateral: 20, condition: 10 };

function getGrade(score) {
  if (score >= 90) return { grade: 'A', label: 'Sangat Baik', rekomendasi: 'APPROVE' };
  if (score >= 80) return { grade: 'B', label: 'Baik', rekomendasi: 'APPROVE' };
  if (score >= 70) return { grade: 'C', label: 'Cukup', rekomendasi: 'CONDITIONAL_APPROVE' };
  if (score >= 60) return { grade: 'D', label: 'Kurang', rekomendasi: 'CONDITIONAL_APPROVE' };
  return { grade: 'E', label: 'Tidak Layak', rekomendasi: 'REJECT' };
}

/**
 * Hitung total score 5C
 * @param {Object} scores - { character, capacity, capital, collateral, condition } each 0-100
 * @param {Object} bobot - weight per komponen (default: DEFAULT_BOBOT)
 */
function hitungTotalScore(scores, bobot = DEFAULT_BOBOT) {
  const totalBobot = Object.values(bobot).reduce((a, b) => a + b, 0);
  const totalScore =
    (scores.character * bobot.character +
      scores.capacity * bobot.capacity +
      scores.capital * bobot.capital +
      scores.collateral * bobot.collateral +
      scores.condition * bobot.condition) /
    totalBobot;

  const rounded = parseFloat(totalScore.toFixed(2));
  const { grade, label, rekomendasi } = getGrade(rounded);

  return { totalScore: rounded, grade, label, rekomendasi };
}

/**
 * Hitung sub-score CHARACTER dari data SLIK & survey AO
 */
function hitungCharacterScore(data) {
  const { kolektibilitasSlik = 1, reputasiLingkungan = 80, karakterAo = 80 } = data;
  // SLIK kolektibilitas: 1=100, 2=60, 3=30, 4=10, 5=0
  const slikMap = { 1: 100, 2: 60, 3: 30, 4: 10, 5: 0 };
  const slikScore = slikMap[kolektibilitasSlik] ?? 0;
  return Math.round((slikScore * 0.5 + reputasiLingkungan * 0.3 + karakterAo * 0.2));
}

/**
 * Hitung sub-score CAPACITY dari DSR/DSCR
 */
function hitungCapacityScore(data) {
  const { dsr, dscr, jenisKredit } = data;
  if (jenisKredit === 'KONSUMTIF') {
    // DSR: <20%=100, 20-30%=80, 30-40%=60, >40%=20
    if (dsr < 20) return 100;
    if (dsr < 30) return 80;
    if (dsr < 40) return 60;
    return 20;
  } else {
    // DSCR: >2=100, 1.5-2=80, 1.2-1.5=60, 1-1.2=40, <1=10
    if (dscr > 2) return 100;
    if (dscr >= 1.5) return 80;
    if (dscr >= 1.2) return 60;
    if (dscr >= 1) return 40;
    return 10;
  }
}

/**
 * Hitung sub-score CAPITAL dari data keuangan
 */
function hitungCapitalScore(data) {
  const { nilaiAset = 0, totalUtang = 0, labaBersih = 0, omset = 0 } = data;
  const equity = nilaiAset - totalUtang;
  const der = totalUtang > 0 ? totalUtang / (equity || 1) : 0;
  // DER: <0.5=100, 0.5-1=80, 1-2=60, 2-3=40, >3=20
  let derScore = 100;
  if (der > 3) derScore = 20;
  else if (der > 2) derScore = 40;
  else if (der > 1) derScore = 60;
  else if (der > 0.5) derScore = 80;

  const roaScore = omset > 0 ? Math.min(100, (labaBersih / nilaiAset) * 100 * 5) : 50;
  return Math.round(derScore * 0.6 + roaScore * 0.4);
}

/**
 * Hitung sub-score COLLATERAL dari LTV & Coverage
 */
function hitungCollateralScore(data) {
  const { ltv = 100, coverageRatio = 1, jenisAgunan = 'SHM' } = data;
  // Coverage: >2=100, 1.5-2=80, 1.2-1.5=60, 1-1.2=40, <1=10
  let coverScore = 100;
  if (coverageRatio < 1) coverScore = 10;
  else if (coverageRatio < 1.2) coverScore = 40;
  else if (coverageRatio < 1.5) coverScore = 60;
  else if (coverageRatio < 2) coverScore = 80;

  // Jenis agunan bonus
  const agunanBonus = { SHM: 10, SHGB: 8, BPKB: 5, DEPOSITO: 10, AJB: 6, MESIN: 3, PERSEDIAAN: 2 };
  const bonus = agunanBonus[jenisAgunan] || 5;

  return Math.min(100, Math.round(coverScore * 0.8 + bonus * 2));
}

/**
 * Hitung sub-score CONDITION dari sektor & prospek
 */
function hitungConditionScore(data) {
  const { prospekSektor = 70, kondisiEkonomi = 70 } = data;
  return Math.round(prospekSektor * 0.6 + kondisiEkonomi * 0.4);
}

module.exports = {
  hitungTotalScore, hitungCharacterScore, hitungCapacityScore,
  hitungCapitalScore, hitungCollateralScore, hitungConditionScore,
  DEFAULT_BOBOT, getGrade,
};
