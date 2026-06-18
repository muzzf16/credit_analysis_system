const db = require('../../config/database');

// Helpers to safely convert empty strings to null for typed DB columns
const toDate = (v) => (v && String(v).trim() !== '' ? v : null);
const toNum = (v) => (v !== null && v !== undefined && String(v).trim() !== '' ? parseFloat(v) : null);
const toInt = (v) => (v !== null && v !== undefined && String(v).trim() !== '' ? parseInt(v, 10) : null);
const toStr = (v) => (v !== null && v !== undefined && String(v).trim() !== '' ? String(v).trim() : null);

async function create(data, userId) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { pengajuanId, tanggalSurvey, kesimpulan, rekomendasi, lingkungan, usaha } = data;

    const surveyResult = await client.query(
      `INSERT INTO survey (pengajuan_id, ao_id, tanggal_survey, kesimpulan, rekomendasi, status)
       VALUES ($1,$2,$3,$4,$5,'SELESAI') RETURNING *`,
      [pengajuanId, userId, toDate(tanggalSurvey), toStr(kesimpulan), toStr(rekomendasi)]
    );
    const surveyId = surveyResult.rows[0].id;

    if (lingkungan) {
      await client.query(
        `INSERT INTO survey_lingkungan (survey_id, karakter_debitur, karakter_keterangan, hubungan_sosial, hubungan_keterangan,
         status_kepemilikan_rumah, kondisi_rumah, latitude, longitude, alamat_survey, foto_rumah)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          surveyId,
          toInt(lingkungan.karakterDebitur),
          toStr(lingkungan.karakterKeterangan),
          toInt(lingkungan.hubunganSosial),
          toStr(lingkungan.hubunganKeterangan),
          toStr(lingkungan.statusKepemilikanRumah),
          toStr(lingkungan.kondisiRumah),
          toNum(lingkungan.latitude),
          toNum(lingkungan.longitude),
          toStr(lingkungan.alamatSurvey),
          JSON.stringify(lingkungan.fotoRumah || [])
        ]
      );
    }

    if (usaha) {
      await client.query(
        `INSERT INTO survey_usaha (survey_id, jenis_usaha, lama_usaha_tahun, jam_operasional, jumlah_karyawan,
         omset_harian, omset_bulanan, hpp_bulanan, biaya_operasional, laba_bersih_bulanan,
         supplier, pelanggan_utama, kompetitor, latitude, longitude, foto_usaha)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          surveyId,
          toStr(usaha.jenisUsaha),
          toInt(usaha.lamaUsahaTahun),
          toStr(usaha.jamOperasional),
          toInt(usaha.jumlahKaryawan),
          toNum(usaha.omsetHarian),
          toNum(usaha.omsetBulanan),
          toNum(usaha.hppBulanan),
          toNum(usaha.biayaOperasional),
          toNum(usaha.labaBersihBulanan),
          toStr(usaha.supplier),
          toStr(usaha.pelangganUtama),
          toStr(usaha.kompetitor),
          toNum(usaha.latitude),
          toNum(usaha.longitude),
          JSON.stringify(usaha.fotoUsaha || [])
        ]
      );
    }

    // Update status pengajuan
    await client.query(`UPDATE pengajuan SET status = 'SURVEY', updated_at = NOW() WHERE id = $1`, [pengajuanId]);

    await client.query('COMMIT');
    return surveyResult.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getByPengajuanId(pengajuanId) {
  const survey = await db.query('SELECT * FROM survey WHERE pengajuan_id = $1', [pengajuanId]);
  if (survey.rows.length === 0) return null;
  const s = survey.rows[0];
  const lingkungan = await db.query('SELECT * FROM survey_lingkungan WHERE survey_id = $1', [s.id]);
  const usaha = await db.query('SELECT * FROM survey_usaha WHERE survey_id = $1', [s.id]);
  return { ...s, lingkungan: lingkungan.rows[0] || null, usaha: usaha.rows[0] || null };
}

module.exports = { create, getByPengajuanId };
