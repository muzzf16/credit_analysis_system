/**
 * Financial Formulas for BPR BAPERA Credit Analysis
 * Konsumtif & Produktif
 */

// ─── ANGSURAN (FLAT & ANUITAS) ────────────────────────────────────────────────
function hitungAngsuran(plafon, bungaPerTahun, jangkaWaktuBulan, sistemAngsuran = 'FLAT') {
  if (plafon <= 0 || bungaPerTahun <= 0 || jangkaWaktuBulan <= 0) return 0;
  const rateBulanan = bungaPerTahun / 100 / 12;
  
  if (sistemAngsuran === 'ANUITAS') {
    return Math.round((plafon * rateBulanan * Math.pow(1 + rateBulanan, jangkaWaktuBulan)) / (Math.pow(1 + rateBulanan, jangkaWaktuBulan) - 1));
  }
  
  // Default: FLAT
  const pokok = plafon / jangkaWaktuBulan;
  const bunga = plafon * rateBulanan;
  return Math.round(pokok + bunga);
}

// ─── KONSUMTIF ─────────────────────────────────────────────────────────────
function hitungKonsumtif(data) {
  const {
    gajiPokok = 0, tunjangan = 0, bonusRata = 0,
    usahaSampingan = 0, pendapatanPasangan = 0,
    listrik = 0, air = 0, transportasi = 0,
    pendidikan = 0, cicilanExisting = 0, pengurangAngsuran = 0, kebutuhanRumahTangga = 0, pengeluaranLain = 0,
    angsuranDiajukan = 0, plafon = 0, bungaPerTahun = 0, jangkaWaktuBulan = 0,
    useDsr = false, sistemAngsuran = 'FLAT'
  } = data;

  const totalPenghasilan = gajiPokok + tunjangan + bonusRata + usahaSampingan + pendapatanPasangan;
  const totalPengeluaranTanpaCicilan = listrik + air + transportasi + pendidikan + kebutuhanRumahTangga + pengeluaranLain;
  const totalCicilan = cicilanExisting + pengurangAngsuran + angsuranDiajukan;
  const totalPengeluaran = totalPengeluaranTanpaCicilan + cicilanExisting;

  const disposableIncome = totalPenghasilan - totalPengeluaranTanpaCicilan - (cicilanExisting + pengurangAngsuran);

  // DSR = (Total Cicilan semua / Total Penghasilan) * 100
  const dsr = totalPenghasilan > 0 ? (totalCicilan / totalPenghasilan) * 100 : 0;

  // Tentukan Max DSR berdasarkan Total Penghasilan (Tiered DSR)
  let maxDsr = 40;
  if (totalPenghasilan <= 5000000) maxDsr = 30;
  else if (totalPenghasilan <= 15000000) maxDsr = 40;
  else if (totalPenghasilan <= 50000000) maxDsr = 50;
  else maxDsr = 60;

  // RPC = Disposable Income / Angsuran Diajukan * 100 — min 110%
  const rpc = angsuranDiajukan > 0 ? (disposableIncome / angsuranDiajukan) * 100 : 0;

  // Maximum kredit berdasarkan disposable income (95% of disposable income)
  const maxAngsuran = disposableIncome * 0.95;
  const angsuranEfektif = plafon > 0 ? hitungAngsuran(plafon, bungaPerTahun, jangkaWaktuBulan, sistemAngsuran) : angsuranDiajukan;
  const maxKredit = bungaPerTahun > 0 && jangkaWaktuBulan > 0
    ? Math.max(0, Math.floor((maxAngsuran / hitungAngsuran(1000000, bungaPerTahun, jangkaWaktuBulan, sistemAngsuran)) * 1000000))
    : maxAngsuran * jangkaWaktuBulan;

  const layak = useDsr ? (dsr <= maxDsr && rpc >= 110) : (rpc >= 110);

  let keterangan = 'Debitur memenuhi syarat kelayakan kredit konsumtif.';
  if (!layak) {
    if (useDsr && dsr > maxDsr) keterangan = `DSR (${dsr.toFixed(2)}%) melebihi maksimal ${maxDsr}%. `;
    else keterangan = '';
    
    if (rpc < 110) keterangan += `RPC (${rpc.toFixed(2)}%) kurang dari 110%.`;
  }

  return {
    totalPenghasilan,
    totalPengeluaran,
    totalCicilan,
    disposableIncome,
    dsr: parseFloat(dsr.toFixed(2)),
    maxDsr,
    useDsr,
    rpc: parseFloat(rpc.toFixed(2)),
    angsuranEfektif,
    maxKredit,
    statusKelayakan: layak ? 'LAYAK' : 'TIDAK_LAYAK',
    keterangan: keterangan.trim(),
  };
}

// ─── PRODUKTIF ─────────────────────────────────────────────────────────────
function hitungProduktif(data) {
  const {
    omsetBulan1 = 0, omsetBulan2 = 0, omsetBulan3 = 0,
    hppBulan1 = 0, hppBulan2 = 0, hppBulan3 = 0,
    biayaOpBulan1 = 0, biayaOpBulan2 = 0, biayaOpBulan3 = 0,
    angsuranPerBulan = 0,
  } = data;

  const rataOmset = (omsetBulan1 + omsetBulan2 + omsetBulan3) / 3;
  const rataHpp = (hppBulan1 + hppBulan2 + hppBulan3) / 3;
  const rataBiayaOp = (biayaOpBulan1 + biayaOpBulan2 + biayaOpBulan3) / 3;

  const labaKotor = rataOmset - rataHpp;
  const labaBersih = labaKotor - rataBiayaOp;

  const grossProfitMargin = rataOmset > 0 ? (labaKotor / rataOmset) * 100 : 0;
  const netProfitMargin = rataOmset > 0 ? (labaBersih / rataOmset) * 100 : 0;

  // DSCR = Laba Bersih / Angsuran — min 1.2
  const dscr = angsuranPerBulan > 0 ? labaBersih / angsuranPerBulan : 0;

  // Working Capital = Omset - HPP - Biaya Op
  const workingCapital = labaBersih;

  // Break Even Point (revenue-based) = Biaya Tetap / (1 - HPP/Omset)
  const biayaTetap = rataBiayaOp;
  const breakEvenPoint = rataOmset > 0 ? biayaTetap / (1 - rataHpp / rataOmset) : 0;

  // Stress Testing
  const stressTest = [10, 20, 30].map((persen) => {
    const omsetStress = rataOmset * (1 - persen / 100);
    const labaStress = omsetStress - rataHpp - rataBiayaOp;
    const dscrStress = angsuranPerBulan > 0 ? labaStress / angsuranPerBulan : 0;
    return {
      persen,
      omset: Math.round(omsetStress),
      labaBersih: Math.round(labaStress),
      dscr: parseFloat(dscrStress.toFixed(2)),
      layak: dscrStress >= 1.2,
    };
  });

  const layak = dscr >= 1.2 && labaBersih > 0;

  return {
    rataOmset: Math.round(rataOmset),
    rataHpp: Math.round(rataHpp),
    rataBiayaOp: Math.round(rataBiayaOp),
    labaKotor: Math.round(labaKotor),
    labaBersih: Math.round(labaBersih),
    grossProfitMargin: parseFloat(grossProfitMargin.toFixed(2)),
    netProfitMargin: parseFloat(netProfitMargin.toFixed(2)),
    dscr: parseFloat(dscr.toFixed(2)),
    workingCapital: Math.round(workingCapital),
    breakEvenPoint: Math.round(breakEvenPoint),
    stressTest,
    statusKelayakan: layak ? 'LAYAK' : 'TIDAK_LAYAK',
    keterangan: !layak
      ? `${dscr < 1.2 ? `DSCR ${dscr.toFixed(2)} di bawah minimum 1.2. ` : ''}${labaBersih <= 0 ? 'Usaha merugi.' : ''}`
      : `DSCR ${dscr.toFixed(2)} memenuhi syarat minimum.`,
  };
}

// ─── LTV & COVERAGE ────────────────────────────────────────────────────────
function hitungLTV(nilaiAgunan, plafon) {
  if (!nilaiAgunan || nilaiAgunan === 0) return 0;
  return parseFloat(((plafon / nilaiAgunan) * 100).toFixed(2));
}

function hitungCoverageRatio(nilaiLikuidasi, plafon) {
  if (!plafon || plafon === 0) return 0;
  return parseFloat((nilaiLikuidasi / plafon).toFixed(2));
}

module.exports = { hitungAngsuran, hitungKonsumtif, hitungProduktif, hitungLTV, hitungCoverageRatio };
