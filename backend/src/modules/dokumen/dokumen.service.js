const db = require('../../config/database');
const { minioClient, getPresignedUrl: minioGetPresignedUrl, BUCKET_NAME: BUCKET } = require('../../config/minio');
const { v4: uuid } = require('uuid');
const path = require('path');

async function upload(file, referensiId, referensiTipe, jenisDokumen, userId) {
  const ext = path.extname(file.originalname);
  const objectName = `${referensiTipe.toLowerCase()}/${referensiId}/${uuid()}${ext}`;

  await minioClient.putObject(BUCKET, objectName, file.buffer, file.size, {
    'Content-Type': file.mimetype,
    'x-amz-meta-uploaded-by': userId,
  });

  const result = await db.query(
    `INSERT INTO dokumen (referensi_id, referensi_tipe, jenis_dokumen, file_name, file_path, file_size, mime_type, upload_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [referensiId, referensiTipe, jenisDokumen, file.originalname, objectName, file.size, file.mimetype, userId]
  );
  return result.rows[0];
}

async function getByReferensi(referensiId, referensiTipe) {
  const result = await db.query(
    'SELECT * FROM dokumen WHERE referensi_id = $1 AND referensi_tipe = $2 ORDER BY created_at DESC',
    [referensiId, referensiTipe]
  );
  return result.rows;
}

async function getPresignedUrl(id) {
  const result = await db.query('SELECT file_path, file_name FROM dokumen WHERE id = $1', [id]);
  if (result.rows.length === 0) throw { status: 404, message: 'Dokumen tidak ditemukan.' };
  const url = await minioGetPresignedUrl(result.rows[0].file_path, 3600);
  return { url, fileName: result.rows[0].file_name };
}

module.exports = { upload, getByReferensi, getPresignedUrl };
