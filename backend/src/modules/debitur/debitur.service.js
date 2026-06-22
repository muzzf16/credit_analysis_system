const db = require('../../config/database');
const { encrypt, decrypt, maskNik } = require('../../utils/encryption');

// Helpers to safely convert empty strings to null for typed DB columns
const toDate = (v) => (v && String(v).trim() !== '' ? v : null);
const toNum = (v) => (v !== null && v !== undefined && String(v).trim() !== '' ? parseFloat(v) : null);
const toInt = (v) => (v !== null && v !== undefined && String(v).trim() !== '' ? parseInt(v, 10) : null);

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
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { pribadi, pasangan, pekerjaan, usaha } = data;

    const dResult = await client.query(
      `INSERT INTO debitur (nik, nama, tempat_lahir, tanggal_lahir, gender, status_nikah, pendidikan, agama, alamat, kelurahan, kecamatan, kabupaten, kode_pos, no_hp, no_telp, email, ao_id, created_by, ibu_kandung, hubungan_bank, kredit_aktif)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING *`,
      [encrypt(pribadi.nik), pribadi.nama, pribadi.tempatLahir || null, toDate(pribadi.tanggalLahir), pribadi.gender || null, pribadi.statusNikah || null,
       pribadi.pendidikan || null, pribadi.agama || null, pribadi.alamat || null, pribadi.kelurahan || null, pribadi.kecamatan || null, pribadi.kabupaten || null,
       pribadi.kodePos || null, pribadi.noHp || null, pribadi.noTelp || null, pribadi.email || null, pribadi.aoId || userId, userId,
       pribadi.ibuKandung || null, pribadi.hubunganBank || null, pribadi.kreditAktif || null]
    );
    const debiturId = dResult.rows[0].id;

    // Insert pasangan
    if (pasangan && pribadi.statusNikah === 'KAWIN') {
      await client.query(
        `INSERT INTO pasangan (debitur_id, nik, nama, tempat_lahir, tanggal_lahir, pendidikan, pekerjaan, no_hp)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [debiturId, pasangan.nik ? encrypt(pasangan.nik) : null, pasangan.nama || null, pasangan.tempatLahir || null,
         toDate(pasangan.tanggalLahir), pasangan.pendidikan || null, pasangan.pekerjaan || null, pasangan.noHp || null]
      );
    }

    // Insert pekerjaan
    if (pekerjaan) {
      await client.query(
        `INSERT INTO pekerjaan (debitur_id, jenis_pekerjaan, nama_instansi, jabatan, masa_kerja_tahun, alamat_kantor, no_telp_kantor, gaji_pokok, tunjangan, penghasilan_lain)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [debiturId, pekerjaan.jenisPekerjaan || null, pekerjaan.namaInstansi || null, pekerjaan.jabatan || null,
         toInt(pekerjaan.masaKerjaTahun), pekerjaan.alamatKantor || null, pekerjaan.noTelpKantor || null,
         toNum(pekerjaan.gajiPokok), toNum(pekerjaan.tunjangan), toNum(pekerjaan.penghasilanLain)]
      );
    }

    // Insert usaha
    if (usaha) {
      await client.query(
        `INSERT INTO usaha (debitur_id, nama_usaha, jenis_usaha, lama_usaha_tahun, alamat_usaha, kelurahan_usaha, kecamatan_usaha, omset_bulanan, omset_tahunan, jumlah_karyawan, status_tempat_usaha)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [debiturId, usaha.namaUsaha || null, usaha.jenisUsaha || null, toInt(usaha.lamaUsahaTahun),
         usaha.alamatUsaha || null, usaha.kelurahanUsaha || null, usaha.kecamatanUsaha || null,
         toNum(usaha.omsetBulanan), toNum(usaha.omsetTahunan), toInt(usaha.jumlahKaryawan), usaha.statusTempatUsaha || null]
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
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { pribadi, pasangan, pekerjaan, usaha } = data;

    if (pribadi) {
      await client.query(
        `UPDATE debitur SET nik=COALESCE($1,nik), nama=COALESCE($2,nama), tempat_lahir=COALESCE($3,tempat_lahir), tanggal_lahir=COALESCE($4,tanggal_lahir),
         gender=COALESCE($5,gender), status_nikah=COALESCE($6,status_nikah), pendidikan=COALESCE($7,pendidikan), agama=COALESCE($8,agama),
         alamat=COALESCE($9,alamat), kelurahan=COALESCE($10,kelurahan), kecamatan=COALESCE($11,kecamatan), kabupaten=COALESCE($12,kabupaten),
         kode_pos=COALESCE($13,kode_pos), no_hp=COALESCE($14,no_hp), email=COALESCE($15,email),
         ibu_kandung=COALESCE($16,ibu_kandung), hubungan_bank=COALESCE($17,hubungan_bank), kredit_aktif=COALESCE($18,kredit_aktif),
         updated_at=NOW() WHERE id=$19`,
        [pribadi.nik ? encrypt(pribadi.nik) : null, pribadi.nama || null, pribadi.tempatLahir || null,
         toDate(pribadi.tanggalLahir), pribadi.gender || null, pribadi.statusNikah || null,
         pribadi.pendidikan || null, pribadi.agama || null, pribadi.alamat || null, pribadi.kelurahan || null,
         pribadi.kecamatan || null, pribadi.kabupaten || null, pribadi.kodePos || null, pribadi.noHp || null, pribadi.email || null,
         pribadi.ibuKandung || null, pribadi.hubunganBank || null, pribadi.kreditAktif || null, id]
      );
    }

    if (pasangan) {
      await client.query('DELETE FROM pasangan WHERE debitur_id = $1', [id]);
      await client.query(
        `INSERT INTO pasangan (debitur_id, nik, nama, tempat_lahir, tanggal_lahir, pendidikan, pekerjaan, no_hp) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, pasangan.nik ? encrypt(pasangan.nik) : null, pasangan.nama || null, pasangan.tempatLahir || null,
         toDate(pasangan.tanggalLahir), pasangan.pendidikan || null, pasangan.pekerjaan || null, pasangan.noHp || null]
      );
    }

    if (pekerjaan) {
      await client.query('DELETE FROM pekerjaan WHERE debitur_id = $1', [id]);
      await client.query(
        `INSERT INTO pekerjaan (debitur_id, jenis_pekerjaan, nama_instansi, jabatan, masa_kerja_tahun, alamat_kantor, no_telp_kantor, gaji_pokok, tunjangan, penghasilan_lain) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [id, pekerjaan.jenisPekerjaan || null, pekerjaan.namaInstansi || null, pekerjaan.jabatan || null,
         toInt(pekerjaan.masaKerjaTahun), pekerjaan.alamatKantor || null, pekerjaan.noTelpKantor || null,
         toNum(pekerjaan.gajiPokok), toNum(pekerjaan.tunjangan), toNum(pekerjaan.penghasilanLain)]
      );
    }

    if (usaha) {
      await client.query('DELETE FROM usaha WHERE debitur_id = $1', [id]);
      await client.query(
        `INSERT INTO usaha (debitur_id, nama_usaha, jenis_usaha, lama_usaha_tahun, alamat_usaha, kelurahan_usaha, kecamatan_usaha, omset_bulanan, omset_tahunan, jumlah_karyawan, status_tempat_usaha) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [id, usaha.namaUsaha || null, usaha.jenisUsaha || null, toInt(usaha.lamaUsahaTahun),
         usaha.alamatUsaha || null, usaha.kelurahanUsaha || null, usaha.kecamatanUsaha || null,
         toNum(usaha.omsetBulanan), toNum(usaha.omsetTahunan), toInt(usaha.jumlahKaryawan), usaha.statusTempatUsaha || null]
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

async function remove(id) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    
    const pengajuan = await client.query('SELECT id FROM pengajuan WHERE debitur_id = $1 LIMIT 1', [id]);
    if (pengajuan.rows.length > 0) {
      throw { status: 400, message: 'Tidak dapat menghapus debitur karena memiliki data pengajuan.' };
    }

    await client.query('DELETE FROM pasangan WHERE debitur_id = $1', [id]);
    await client.query('DELETE FROM pekerjaan WHERE debitur_id = $1', [id]);
    await client.query('DELETE FROM usaha WHERE debitur_id = $1', [id]);
    await client.query("DELETE FROM dokumen WHERE referensi_id = $1 AND referensi_tipe = 'DEBITUR'", [id]);
    
    const res = await client.query('DELETE FROM debitur WHERE id = $1', [id]);
    if (res.rowCount === 0) throw { status: 404, message: 'Debitur tidak ditemukan.' };

    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { getAll, getById, create, update, remove };
