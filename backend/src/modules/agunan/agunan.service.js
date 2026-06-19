const db = require('../../config/database');
const { hitungLTV, hitungCoverageRatio } = require('../../utils/financialFormulas');
const { toNum, toStr } = require('../../utils/db-helpers');

async function create(data, userId) {
  const { pengajuanId, jenisAgunan, deskripsi, nomorSertifikat, atasNama,
    luasTanah, luasBangunan, nilaiPasar, nilaiNjop, nilaiTaksasi, nilaiLikuidasi,
    alamatAgunan, kecamatan, latitude, longitude,
    rtRw, kelurahan, kabupaten,
    batasUtara, batasSelatan, batasTimur, batasBarat,
    bentukTanah, permukaanTanah, aksesJalan, jenisJalan,
    lantaiBangunan, rangkaAtap, penutupAtap, dinding, fasilitasListrik, fasilitasAir } = data;

  // Get plafon for LTV calculation
  const pengajuan = await db.query('SELECT plafon_diajukan FROM pengajuan WHERE id = $1', [pengajuanId]);
  const plafon = pengajuan.rows.length > 0 ? parseFloat(pengajuan.rows[0].plafon_diajukan) : 0;

  const ltv = hitungLTV(toNum(nilaiTaksasi), plafon);
  const coverageRatio = hitungCoverageRatio(toNum(nilaiLikuidasi), plafon);

  const result = await db.query(
    `INSERT INTO agunan (pengajuan_id, jenis_agunan, deskripsi, nomor_sertifikat, atas_nama,
     luas_tanah, luas_bangunan, nilai_pasar, nilai_njop, nilai_taksasi, nilai_likuidasi,
     ltv, coverage_ratio, alamat_agunan, kecamatan, latitude, longitude, created_by,
     rt_rw, kelurahan, kabupaten, batas_utara, batas_selatan, batas_timur, batas_barat,
     bentuk_tanah, permukaan_tanah, akses_jalan, jenis_jalan,
     lantai_bangunan, rangka_atap, penutup_atap, dinding, fasilitas_listrik, fasilitas_air)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35) RETURNING *`,
    [pengajuanId, toStr(jenisAgunan), toStr(deskripsi), toStr(nomorSertifikat), toStr(atasNama),
     toNum(luasTanah), toNum(luasBangunan), toNum(nilaiPasar), toNum(nilaiNjop), toNum(nilaiTaksasi), toNum(nilaiLikuidasi),
     ltv, coverageRatio, toStr(alamatAgunan), toStr(kecamatan), toNum(latitude), toNum(longitude), userId,
     toStr(rtRw), toStr(kelurahan), toStr(kabupaten), toStr(batasUtara), toStr(batasSelatan), toStr(batasTimur), toStr(batasBarat),
     toStr(bentukTanah), toStr(permukaanTanah), toStr(aksesJalan), toStr(jenisJalan),
     toStr(lantaiBangunan), toStr(rangkaAtap), toStr(penutupAtap), toStr(dinding), toStr(fasilitasListrik), toStr(fasilitasAir)]
  );
  return result.rows[0];
}

async function getByPengajuanId(pengajuanId) {
  const result = await db.query(
    `SELECT a.*, (SELECT json_agg(f.*) FROM agunan_foto f WHERE f.agunan_id = a.id) as foto
     FROM agunan a WHERE a.pengajuan_id = $1 ORDER BY a.created_at`, [pengajuanId]);
  return result.rows;
}

async function addFoto(agunanId, data) {
  const { filePath, fileName, keterangan, latitude, longitude } = data;
  const result = await db.query(
    `INSERT INTO agunan_foto (agunan_id, file_path, file_name, keterangan, latitude, longitude, timestamp_foto)
     VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING *`,
    [agunanId, filePath, fileName, toStr(keterangan), toNum(latitude), toNum(longitude)]
  );
  return result.rows[0];
}

async function getById(id) {
  const result = await db.query(
    `SELECT a.*, (SELECT json_agg(f.*) FROM agunan_foto f WHERE f.agunan_id = a.id) as foto
     FROM agunan a WHERE a.id = $1`, [id]);
  if (result.rows.length === 0) { const e = new Error('Agunan tidak ditemukan'); e.status = 404; throw e; }
  return result.rows[0];
}

async function update(id, data, userId) {
  const { jenisAgunan, deskripsi, nomorSertifikat, atasNama,
    luasTanah, luasBangunan, nilaiPasar, nilaiNjop, nilaiTaksasi, nilaiLikuidasi,
    alamatAgunan, kecamatan, latitude, longitude,
    rtRw, kelurahan, kabupaten,
    batasUtara, batasSelatan, batasTimur, batasBarat,
    bentukTanah, permukaanTanah, aksesJalan, jenisJalan,
    lantaiBangunan, rangkaAtap, penutupAtap, dinding, fasilitasListrik, fasilitasAir } = data;

  // Recalculate LTV and coverage ratio from plafon
  const agunanRow = await db.query('SELECT pengajuan_id FROM agunan WHERE id = $1', [id]);
  if (agunanRow.rows.length === 0) { const e = new Error('Agunan tidak ditemukan'); e.status = 404; throw e; }
  const pengajuan = await db.query('SELECT plafon_diajukan FROM pengajuan WHERE id = $1', [agunanRow.rows[0].pengajuan_id]);
  const plafon = pengajuan.rows.length > 0 ? parseFloat(pengajuan.rows[0].plafon_diajukan) : 0;
  const ltv = hitungLTV(toNum(nilaiTaksasi), plafon);
  const coverageRatio = hitungCoverageRatio(toNum(nilaiLikuidasi), plafon);

  const result = await db.query(
    `UPDATE agunan SET
      jenis_agunan=$1, deskripsi=$2, nomor_sertifikat=$3, atas_nama=$4,
      luas_tanah=$5, luas_bangunan=$6, nilai_pasar=$7, nilai_njop=$8,
      nilai_taksasi=$9, nilai_likuidasi=$10, ltv=$11, coverage_ratio=$12,
      alamat_agunan=$13, kecamatan=$14, latitude=$15, longitude=$16,
      rt_rw=$17, kelurahan=$18, kabupaten=$19,
      batas_utara=$20, batas_selatan=$21, batas_timur=$22, batas_barat=$23,
      bentuk_tanah=$24, permukaan_tanah=$25, akses_jalan=$26, jenis_jalan=$27,
      lantai_bangunan=$28, rangka_atap=$29, penutup_atap=$30, dinding=$31,
      fasilitas_listrik=$32, fasilitas_air=$33, updated_at=NOW()
    WHERE id=$34 RETURNING *`,
    [toStr(jenisAgunan), toStr(deskripsi), toStr(nomorSertifikat), toStr(atasNama),
     toNum(luasTanah), toNum(luasBangunan), toNum(nilaiPasar), toNum(nilaiNjop),
     toNum(nilaiTaksasi), toNum(nilaiLikuidasi), ltv, coverageRatio,
     toStr(alamatAgunan), toStr(kecamatan), toNum(latitude), toNum(longitude),
     toStr(rtRw), toStr(kelurahan), toStr(kabupaten),
     toStr(batasUtara), toStr(batasSelatan), toStr(batasTimur), toStr(batasBarat),
     toStr(bentukTanah), toStr(permukaanTanah), toStr(aksesJalan), toStr(jenisJalan),
     toStr(lantaiBangunan), toStr(rangkaAtap), toStr(penutupAtap), toStr(dinding),
     toStr(fasilitasListrik), toStr(fasilitasAir), id]
  );
  return result.rows[0];
}

module.exports = { create, getById, update, getByPengajuanId, addFoto };
