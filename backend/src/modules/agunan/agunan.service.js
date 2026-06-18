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

module.exports = { create, getByPengajuanId, addFoto };
