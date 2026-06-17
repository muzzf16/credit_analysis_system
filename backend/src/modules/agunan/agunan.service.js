const db = require('../../config/database');
const { hitungLTV, hitungCoverageRatio } = require('../../utils/financialFormulas');

async function create(data, userId) {
  const { pengajuanId, jenisAgunan, deskripsi, nomorSertifikat, atasNama,
    luasTanah, luasBangunan, nilaiPasar, nilaiNjop, nilaiTaksasi, nilaiLikuidasi,
    alamatAgunan, kecamatan, latitude, longitude } = data;

  // Get plafon for LTV calculation
  const pengajuan = await db.query('SELECT plafon_diajukan FROM pengajuan WHERE id = $1', [pengajuanId]);
  const plafon = pengajuan.rows.length > 0 ? parseFloat(pengajuan.rows[0].plafon_diajukan) : 0;

  const ltv = hitungLTV(nilaiTaksasi, plafon);
  const coverageRatio = hitungCoverageRatio(nilaiLikuidasi, plafon);

  const result = await db.query(
    `INSERT INTO agunan (pengajuan_id, jenis_agunan, deskripsi, nomor_sertifikat, atas_nama,
     luas_tanah, luas_bangunan, nilai_pasar, nilai_njop, nilai_taksasi, nilai_likuidasi,
     ltv, coverage_ratio, alamat_agunan, kecamatan, latitude, longitude, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
    [pengajuanId, jenisAgunan, deskripsi, nomorSertifikat, atasNama,
     luasTanah, luasBangunan, nilaiPasar, nilaiNjop, nilaiTaksasi, nilaiLikuidasi,
     ltv, coverageRatio, alamatAgunan, kecamatan, latitude, longitude, userId]
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
    [agunanId, filePath, fileName, keterangan, latitude, longitude]
  );
  return result.rows[0];
}

module.exports = { create, getByPengajuanId, addFoto };
