const db = require('./backend/src/config/database');

async function seedData() {
  const pengajuanId = '01e525cd-4f13-402e-8076-420dc7284305';
  console.log('Seeding survey and analisa data for pengajuanId:', pengajuanId);

  try {
    // Check if pengajuan exists
    const p = await db.query('SELECT * FROM pengajuan WHERE id = $1', [pengajuanId]);
    if (p.rows.length === 0) {
      console.log('Pengajuan not found');
      process.exit(1);
    }

    // 1. Ensure survey exists
    let surveyRes = await db.query('SELECT * FROM survey WHERE pengajuan_id = $1', [pengajuanId]);
    let surveyId;
    if (surveyRes.rows.length === 0) {
      const res = await db.query(
        `INSERT INTO survey (pengajuan_id, ao_id, tanggal_survey, kesimpulan, rekomendasi, status)
         VALUES ($1, $2, NOW(), 'Kesimpulan dummy', 'Rekomendasi dummy', 'SELESAI') RETURNING id`,
        [pengajuanId, p.rows[0].ao_id || null]
      );
      surveyId = res.rows[0].id;
    } else {
      surveyId = surveyRes.rows[0].id;
    }

    // 2. Ensure survey_usaha exists
    const suRes = await db.query('SELECT * FROM survey_usaha WHERE survey_id = $1', [surveyId]);
    if (suRes.rows.length === 0) {
      await db.query(
        `INSERT INTO survey_usaha (survey_id, jenis_usaha, lama_usaha_tahun, jam_operasional, jumlah_karyawan,
         omset_harian, omset_bulanan, hpp_bulanan, biaya_operasional, laba_bersih_bulanan,
         supplier, pelanggan_utama, kompetitor, latitude, longitude, foto_usaha)
         VALUES ($1, 'Toko Sembako', 5, '08:00 - 17:00', 2, 500000, 15000000, 10000000, 2000000, 3000000,
         'Distributor A', 'Warga sekitar', 'Minimarket', -6.2, 106.8, '[]')`,
        [surveyId]
      );
    }

    // 3. Ensure analisa_produktif exists
    const apRes = await db.query('SELECT * FROM analisa_produktif WHERE pengajuan_id = $1', [pengajuanId]);
    if (apRes.rows.length === 0) {
      await db.query(
        `INSERT INTO analisa_produktif (pengajuan_id,
         omset_bulan1, omset_bulan2, omset_bulan3, rata_omset,
         hpp_bulan1, hpp_bulan2, hpp_bulan3, rata_hpp,
         biaya_op_bulan1, biaya_op_bulan2, biaya_op_bulan3, rata_biaya_op,
         laba_kotor, laba_bersih, gross_profit_margin, net_profit_margin,
         dscr, working_capital, break_even_point, pengurang_angsuran,
         laba_bersih_stress_10, laba_bersih_stress_20, laba_bersih_stress_30,
         dscr_stress_10, dscr_stress_20, dscr_stress_30,
         status_kelayakan, catatan, analis_id)
         VALUES ($1, 
         15000000, 16000000, 14000000, 15000000,
         10000000, 10500000, 9500000, 10000000,
         2000000, 2000000, 2000000, 2000000,
         5000000, 3000000, 33.33, 20.00,
         2.5, 3000000, 6000000, 0,
         2500000, 2000000, 1500000,
         2.0, 1.5, 1.2,
         'LAYAK', 'Data dummy disisipkan otomatis', null)`
        , [pengajuanId]
      );
    }

    // 4. Update status to ANALISA
    await db.query(`UPDATE pengajuan SET status = 'ANALISA', updated_at = NOW() WHERE id = $1`, [pengajuanId]);

    console.log('Seeding successful!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seedData();
