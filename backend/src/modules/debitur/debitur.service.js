const db = require('../../config/database');
const { encrypt, decrypt, maskNik } = require('../../utils/encryption');

async function getAll(page = 1, limit = 10, search = '', aoId = null) {
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];
  if (search) { params.push(`%${search}%`); conditions.push(`(d.nama ILIKE $${params.length} OR d.no_hp ILIKE $${params.length})`); }
  if (aoId) { params.push(aoId); conditions.push(`d.ao_id = $${params.length}`); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQ = await db.query(`SELECT COUNT(*) FROM debitur d ${where}`, params);
  const total = parseInt(countQ.rows[0].count);
  const dataQ = await db.query(
    `SELECT d.id, d.nik, d.nama, d.no_hp, d.kecamatan, d.kabupaten, d.created_at,
            u.full_name as ao_nama,
            (SELECT COUNT(*) FROM pengajuan p WHERE p.debitur_id = d.id) as jumlah_pengajuan
     FROM debitur d
     LEFT JOIN users u ON d.ao_id = u.id
     ${where}
     ORDER BY d.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  // Mask NIK for listing
  dataQ.rows.forEach(r => { r.nik_display = maskNik(r.nik); });
  return { data: dataQ.rows, total, page, limit };
}

async function getById(id) {
  const debitur = await db.query('SELECT * FROM debitur WHERE id = $1', [id]);
  if (debitur.rows.length === 0) throw { status: 404, message: 'Debitur tidak ditemukan.' };
  const d = debitur.rows[0];
  d.nik = decrypt(d.nik);

  const pasangan = await db.query('SELECT * FROM pasangan WHERE debitur_id = $1', [id]);
  if (pasangan.rows.length > 0 && pasangan.rows[0].nik) pasangan.rows[0].nik = decrypt(pasangan.rows[0].nik);

  const pekerjaan = await db.query('SELECT * FROM pekerjaan WHERE debitur_id = $1', [id]);
  const usaha = await db.query('SELECT * FROM usaha WHERE debitur_id = $1', [id]);
  const dokumen = await db.query("SELECT * FROM dokumen WHERE referensi_id = $1 AND referensi_tipe = 'DEBITUR' ORDER BY created_at DESC", [id]);

  return { ...d, pasangan: pasangan.rows[0] || null, pekerjaan: pekerjaan.rows[0] || null, usaha: usaha.rows[0] || null, dokumen: dokumen.rows };
}

async function create(data, userId) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { pribadi, pasangan, pekerjaan, usaha } = data;

    // Insert debitur
    const dResult = await client.query(
      `INSERT INTO debitur (nik, nama, tempat_lahir, tanggal_lahir, gender, status_nikah, pendidikan, agama, alamat, kelurahan, kecamatan, kabupaten, kode_pos, no_hp, no_telp, email, ao_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [encrypt(pribadi.nik), pribadi.nama, pribadi.tempatLahir, pribadi.tanggalLahir, pribadi.gender, pribadi.statusNikah, pribadi.pendidikan, pribadi.agama,
       pribadi.alamat, pribadi.kelurahan, pribadi.kecamatan, pribadi.kabupaten, pribadi.kodePos, pribadi.noHp, pribadi.noTelp, pribadi.email, pribadi.aoId || userId, userId]
    );
    const debiturId = dResult.rows[0].id;

    // Insert pasangan
    if (pasangan && pribadi.statusNikah === 'KAWIN') {
      await client.query(
        `INSERT INTO pasangan (debitur_id, nik, nama, tempat_lahir, tanggal_lahir, pendidikan, pekerjaan, no_hp)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [debiturId, pasangan.nik ? encrypt(pasangan.nik) : null, pasangan.nama, pasangan.tempatLahir, pasangan.tanggalLahir, pasangan.pendidikan, pasangan.pekerjaan, pasangan.noHp]
      );
    }

    // Insert pekerjaan
    if (pekerjaan) {
      await client.query(
        `INSERT INTO pekerjaan (debitur_id, jenis_pekerjaan, nama_instansi, jabatan, masa_kerja_tahun, alamat_kantor, no_telp_kantor, gaji_pokok, tunjangan, penghasilan_lain)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [debiturId, pekerjaan.jenisPekerjaan, pekerjaan.namaInstansi, pekerjaan.jabatan, pekerjaan.masaKerjaTahun, pekerjaan.alamatKantor, pekerjaan.noTelpKantor, pekerjaan.gajiPokok, pekerjaan.tunjangan, pekerjaan.penghasilanLain]
      );
    }

    // Insert usaha
    if (usaha) {
      await client.query(
        `INSERT INTO usaha (debitur_id, nama_usaha, jenis_usaha, lama_usaha_tahun, alamat_usaha, kelurahan_usaha, kecamatan_usaha, omset_bulanan, omset_tahunan, jumlah_karyawan, status_tempat_usaha)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [debiturId, usaha.namaUsaha, usaha.jenisUsaha, usaha.lamaUsahaTahun, usaha.alamatUsaha, usaha.kelurahanUsaha, usaha.kecamatanUsaha, usaha.omsetBulanan, usaha.omsetTahunan, usaha.jumlahKaryawan, usaha.statusTempatUsaha]
      );
    }

    await client.query('COMMIT');
    return await getById(debiturId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function update(id, data, userId) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { pribadi, pasangan, pekerjaan, usaha } = data;

    if (pribadi) {
      await client.query(
        `UPDATE debitur SET nik=COALESCE($1,nik), nama=COALESCE($2,nama), tempat_lahir=COALESCE($3,tempat_lahir), tanggal_lahir=COALESCE($4,tanggal_lahir),
         gender=COALESCE($5,gender), status_nikah=COALESCE($6,status_nikah), pendidikan=COALESCE($7,pendidikan), agama=COALESCE($8,agama),
         alamat=COALESCE($9,alamat), kelurahan=COALESCE($10,kelurahan), kecamatan=COALESCE($11,kecamatan), kabupaten=COALESCE($12,kabupaten),
         kode_pos=COALESCE($13,kode_pos), no_hp=COALESCE($14,no_hp), email=COALESCE($15,email), updated_at=NOW() WHERE id=$16`,
        [pribadi.nik ? encrypt(pribadi.nik) : null, pribadi.nama, pribadi.tempatLahir, pribadi.tanggalLahir, pribadi.gender, pribadi.statusNikah,
         pribadi.pendidikan, pribadi.agama, pribadi.alamat, pribadi.kelurahan, pribadi.kecamatan, pribadi.kabupaten, pribadi.kodePos, pribadi.noHp, pribadi.email, id]
      );
    }

    if (pasangan) {
      await client.query('DELETE FROM pasangan WHERE debitur_id = $1', [id]);
      await client.query(
        `INSERT INTO pasangan (debitur_id, nik, nama, tempat_lahir, tanggal_lahir, pendidikan, pekerjaan, no_hp) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, pasangan.nik ? encrypt(pasangan.nik) : null, pasangan.nama, pasangan.tempatLahir, pasangan.tanggalLahir, pasangan.pendidikan, pasangan.pekerjaan, pasangan.noHp]
      );
    }

    if (pekerjaan) {
      await client.query('DELETE FROM pekerjaan WHERE debitur_id = $1', [id]);
      await client.query(
        `INSERT INTO pekerjaan (debitur_id, jenis_pekerjaan, nama_instansi, jabatan, masa_kerja_tahun, alamat_kantor, no_telp_kantor, gaji_pokok, tunjangan, penghasilan_lain) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [id, pekerjaan.jenisPekerjaan, pekerjaan.namaInstansi, pekerjaan.jabatan, pekerjaan.masaKerjaTahun, pekerjaan.alamatKantor, pekerjaan.noTelpKantor, pekerjaan.gajiPokok, pekerjaan.tunjangan, pekerjaan.penghasilanLain]
      );
    }

    if (usaha) {
      await client.query('DELETE FROM usaha WHERE debitur_id = $1', [id]);
      await client.query(
        `INSERT INTO usaha (debitur_id, nama_usaha, jenis_usaha, lama_usaha_tahun, alamat_usaha, kelurahan_usaha, kecamatan_usaha, omset_bulanan, omset_tahunan, jumlah_karyawan, status_tempat_usaha) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [id, usaha.namaUsaha, usaha.jenisUsaha, usaha.lamaUsahaTahun, usaha.alamatUsaha, usaha.kelurahanUsaha, usaha.kecamatanUsaha, usaha.omsetBulanan, usaha.omsetTahunan, usaha.jumlahKaryawan, usaha.statusTempatUsaha]
      );
    }

    await client.query('COMMIT');
    return await getById(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { getAll, getById, create, update };
