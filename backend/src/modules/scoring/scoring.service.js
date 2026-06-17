const db = require('../../config/database');
const scoring = require('../../utils/scoringEngine');

async function save(data, userId) {
  const { pengajuanId, character, capacity, capital, collateral, condition, bobot, keterangan } = data;

  const b = bobot || scoring.DEFAULT_BOBOT;
  const scores = {
    character: character.score || scoring.hitungCharacterScore(character),
    capacity: capacity.score || scoring.hitungCapacityScore(capacity),
    capital: capital.score || scoring.hitungCapitalScore(capital),
    collateral: collateral.score || scoring.hitungCollateralScore(collateral),
    condition: condition.score || scoring.hitungConditionScore(condition),
  };
  const total = scoring.hitungTotalScore(scores, b);

  await db.query('DELETE FROM credit_scoring WHERE pengajuan_id = $1', [pengajuanId]);
  const result = await db.query(
    `INSERT INTO credit_scoring (pengajuan_id,
     char_slik, char_reputasi, char_karakter_ao, char_score, char_bobot,
     cap_dsr, cap_dscr, cap_penghasilan, cap_score, cap_bobot,
     capital_aset, capital_equity, capital_score, capital_bobot,
     coll_coverage, coll_marketability, coll_ltv, coll_score, coll_bobot,
     cond_sektor, cond_prospek, cond_score, cond_bobot,
     total_score, grade, rekomendasi, keterangan, analis_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29) RETURNING *`,
    [pengajuanId,
     character.slik, character.reputasi, character.karakterAo, scores.character, b.character,
     capacity.dsr, capacity.dscr, capacity.penghasilan, scores.capacity, b.capacity,
     capital.aset, capital.equity, scores.capital, b.capital,
     collateral.coverage, collateral.marketability, collateral.ltv, scores.collateral, b.collateral,
     condition.sektor, condition.prospek, scores.condition, b.condition,
     total.totalScore, total.grade, total.rekomendasi, keterangan, userId]
  );

  await db.query(`UPDATE pengajuan SET status = 'SCORING', updated_at = NOW() WHERE id = $1`, [pengajuanId]);

  return { ...result.rows[0], detail: total };
}

async function getByPengajuanId(pengajuanId) {
  const result = await db.query('SELECT * FROM credit_scoring WHERE pengajuan_id = $1', [pengajuanId]);
  return result.rows[0] || null;
}

module.exports = { save, getByPengajuanId };
