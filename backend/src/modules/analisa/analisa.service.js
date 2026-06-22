const db = require('../../config/database');
const { hitungKonsumtif, hitungProduktif } = require('../../utils/financialFormulas');

// ─── KONSUMTIF ───────────────────────────────────────────────────────────
async function saveKonsumtif(data, userId) {
  const { pengajuanId } = data;
  const calc = hitungKonsumtif(data);

  // Upsert
  await db.query('DELETE FROM analisa_konsumtif WHERE pengajuan_id = $1', [pengajuanId]);
  const result = await db.query(
    `INSERT INTO analisa_konsumtif (pengajuan_id,
     gaji_pokok, tunjangan, bonus_rata, usaha_sampingan, pendapatan_pasangan, total_penghasilan,
     listrik, air, transportasi, pendidikan, cicilan_existing, pengurang_angsuran, kebutuhan_rumah_tangga, pengeluaran_lain, total_pengeluaran,
     disposable_income, angsuran_diajukan, dsr, rpc, max_kredit,
     status_kelayakan, catatan, analis_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24) RETURNING *`,
    [pengajuanId,
     data.gajiPokok || 0, data.tunjangan || 0, data.bonusRata || 0, data.usahaSampingan || 0, data.pendapatanPasangan || 0, calc.totalPenghasilan,
     data.listrik || 0, data.air || 0, data.transportasi || 0, data.pendidikan || 0, data.cicilanExisting || 0, data.pengurangAngsuran || 0, data.kebutuhanRumahTangga || 0, data.pengeluaranLain || 0, calc.totalPengeluaran,
     calc.disposableIncome, data.angsuranDiajukan || calc.angsuranEfektif, calc.dsr, calc.rpc, calc.maxKredit,
     calc.statusKelayakan, data.catatan || calc.keterangan, userId]
  );

  // Update pengajuan status
  await db.query(`UPDATE pengajuan SET status = 'ANALISA', updated_at = NOW() WHERE id = $1`, [pengajuanId]);

  return { ...result.rows[0], kalkulasi: calc };
}

async function getKonsumtif(pengajuanId) {
  const result = await db.query('SELECT * FROM analisa_konsumtif WHERE pengajuan_id = $1', [pengajuanId]);
  return result.rows[0] || null;
}

// ─── PRODUKTIF ───────────────────────────────────────────────────────────
async function saveProduktif(data, userId) {
  const { pengajuanId } = data;
  const calc = hitungProduktif(data);

  await db.query('DELETE FROM analisa_produktif WHERE pengajuan_id = $1', [pengajuanId]);
  const result = await db.query(
    `INSERT INTO analisa_produktif (pengajuan_id,
     omset_bulan1, omset_bulan2, omset_bulan3, rata_omset,
     hpp_bulan1, hpp_bulan2, hpp_bulan3, rata_hpp,
     biaya_op_bulan1, biaya_op_bulan2, biaya_op_bulan3, rata_biaya_op,
     laba_kotor, laba_bersih, gross_profit_margin, net_profit_margin,
     dscr, working_capital, break_even_point, pengurang_angsuran,
     laba_bersih_stress_10, laba_bersih_stress_20, laba_bersih_stress_30,
     dscr_stress_10, dscr_stress_20, dscr_stress_30,
     status_kelayakan, catatan, analis_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30) RETURNING *`,
    [pengajuanId,
     data.omsetBulan1 || 0, data.omsetBulan2 || 0, data.omsetBulan3 || 0, calc.rataOmset,
     data.hppBulan1 || 0, data.hppBulan2 || 0, data.hppBulan3 || 0, calc.rataHpp,
     data.biayaOpBulan1 || 0, data.biayaOpBulan2 || 0, data.biayaOpBulan3 || 0, calc.rataBiayaOp,
     calc.labaKotor, calc.labaBersih, calc.grossProfitMargin, calc.netProfitMargin,
     calc.dscr, calc.workingCapital, calc.breakEvenPoint, data.pengurangAngsuran || 0,
     calc.stressTest[0].labaBersih, calc.stressTest[1].labaBersih, calc.stressTest[2].labaBersih,
     calc.stressTest[0].dscr, calc.stressTest[1].dscr, calc.stressTest[2].dscr,
     calc.statusKelayakan, data.catatan || calc.keterangan, userId]
  );

  await db.query(`UPDATE pengajuan SET status = 'ANALISA', updated_at = NOW() WHERE id = $1`, [pengajuanId]);

  return { ...result.rows[0], kalkulasi: calc };
}

async function getProduktif(pengajuanId) {
  const result = await db.query('SELECT * FROM analisa_produktif WHERE pengajuan_id = $1', [pengajuanId]);
  return result.rows[0] || null;
}

module.exports = { saveKonsumtif, getKonsumtif, saveProduktif, getProduktif };
