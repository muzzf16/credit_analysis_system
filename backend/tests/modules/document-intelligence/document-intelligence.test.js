'use strict';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');

process.env.DB_PORT = process.env.DB_PORT || '5435';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'BprBapera@2024';

const db = require('../../../src/config/database');
const { encrypt } = require('../../../src/utils/encryption');
const { initBucket } = require('../../../src/config/minio');
const DocumentIntelligenceService = require('../../../src/modules/document-intelligence/services/document-intelligence.service');

describe('Document Intelligence Center Module Tests', () => {
  let testUserId;
  let testDebiturId;
  let testPengajuanId;
  let testJobId;

  before(async () => {
    // Initialize MinIO bucket for tests
    await initBucket();

    // 1. Get or create test user
    const userRes = await db.query("SELECT id FROM users WHERE username = 'admin' LIMIT 1");
    if (userRes.rows[0]) {
      testUserId = userRes.rows[0].id;
    } else {
      const insertUser = await db.query(
        `INSERT INTO users (username, email, password_hash, full_name, role_id)
         VALUES ('test_doc_intel_user', 'test_doc_intel@bprbapera.co.id', 'hash', 'Test DocIntel User',
                 (SELECT id FROM roles WHERE name = 'ADMIN' LIMIT 1))
         RETURNING id`
      );
      testUserId = insertUser.rows[0].id;
    }

    // 2. Create test debitur (using encrypted NIK and setting comparison fields)
    const encryptedNik = encrypt('1234567890123459');
    const debiturRes = await db.query(
      `INSERT INTO debitur (nik, nama, no_hp, alamat, tempat_lahir, kecamatan, ibu_kandung, hubungan_bank, kredit_aktif, created_by)
       VALUES ($1, 'Test DocIntel Debitur', '081234567891', 'Batang', 'Batang', 'Batang', 'Ibu Test', 'Nasabah Baru', 'Tidak Ada', $2)
       RETURNING id`,
      [encryptedNik, testUserId]
    );
    testDebiturId = debiturRes.rows[0].id;

    // 3. Create test pengajuan
    const pengajuanRes = await db.query(
      `INSERT INTO pengajuan (nomor_pengajuan, debitur_id, jenis_kredit, tujuan_kredit, plafon_diajukan, jangka_waktu_bulan, suku_bunga, angsuran_perbulan, status, ao_id, created_by)
       VALUES ('BPR/KRD/2026/TEST2', $1, 'PRODUKTIF', 'Modal Kerja', 30000000.00, 12, 12.00, 2700000.00, 'DRAFT', $2, $2)
       RETURNING id`,
      [testDebiturId, testUserId]
    );
    testPengajuanId = pengajuanRes.rows[0].id;
  });

  after(async () => {
    // Clean up test records
    if (testJobId) {
      await db.query('DELETE FROM document_intelligence_jobs WHERE id = $1', [testJobId]);
    }
    await db.query('DELETE FROM pengajuan WHERE id = $1', [testPengajuanId]);
    await db.query('DELETE FROM debitur WHERE id = $1', [testDebiturId]);
  });

  test('Should successfully upload and create a document job', async () => {
    const mockFile = {
      originalname: 'ktp_test.png',
      mimetype: 'image/png',
      size: 1024,
      buffer: Buffer.from('mock file content')
    };

    const job = await DocumentIntelligenceService.uploadAndCreateJob(
      mockFile,
      testDebiturId,
      testPengajuanId,
      testUserId
    );

    assert.ok(job.id);
    assert.strictEqual(job.file_name, 'ktp_test.png');
    assert.strictEqual(job.status, 'PENDING');
    assert.strictEqual(job.debitur_id, testDebiturId);
    assert.strictEqual(job.pengajuan_id, testPengajuanId);
    
    testJobId = job.id;
  });

  test('Should classify document types correctly using filename hints', async () => {
    const ktpType = await DocumentIntelligenceService.classifyDocument(null, 'image/png', 'nasabah_ktp_joko.png');
    assert.strictEqual(ktpType, 'KTP');

    const shmType = await DocumentIntelligenceService.classifyDocument(null, 'image/png', 'sertifikat_shm_tanah.png');
    assert.strictEqual(shmType, 'SHM');

    const unknownType = await DocumentIntelligenceService.classifyDocument(null, 'image/png', 'random_photo.png');
    assert.strictEqual(unknownType, 'UNKNOWN');
  });

  test('Should validate extracted data schema correctly', async () => {
    const validKtp = { nik: '1234567890123456', nama: 'Budi Santoso' };
    const invalidKtp = { nama: 'Budi Santoso' };

    const validRes = DocumentIntelligenceService.validateExtractedData('KTP', validKtp);
    assert.strictEqual(validRes.is_valid, true);

    const invalidRes = DocumentIntelligenceService.validateExtractedData('KTP', invalidKtp);
    assert.strictEqual(invalidRes.is_valid, false);
    assert.ok(invalidRes.errors.includes('NIK tidak ditemukan.'));
  });

  test('Should correctly calculate comparison with DB records', async () => {
    const ocrData = {
      nik: '1234567890123459',
      nama: 'Test DocIntel Debitur',
      tempat_lahir: 'Batang',
      kecamatan: 'Batang'
    };

    const comp = await DocumentIntelligenceService.compareWithDatabase(
      'KTP',
      ocrData,
      testDebiturId,
      null
    );

    assert.strictEqual(comp.is_matching, true);
    assert.strictEqual(comp.fields.nik.is_match, true);
    assert.strictEqual(comp.fields.nama.is_match, true);
  });

  test('Should map KTP job to debitur record successfully', async () => {
    // 1. Manually update job to REVIEW_REQUIRED with verified data
    const ocrData = {
      nik: '1234567890123459',
      nama: 'Test DocIntel Debitur Edited',
      tempat_lahir: 'Batang',
      tanggal_lahir: '1990-01-01',
      jenis_kelamin: 'LAKI-LAKI',
      status_perkawinan: 'BELUM_KAWIN',
      alamat: 'Jl. Pemuda Batang',
      kel_desa: 'Kauman',
      kecamatan: 'Batang',
      agama: 'ISLAM',
      pekerjaan: 'PNS'
    };

    await db.query(
      `UPDATE document_intelligence_jobs 
       SET status = 'REVIEW_REQUIRED', extracted_data = $1
       WHERE id = $2`,
      [JSON.stringify(ocrData), testJobId]
    );

    // 2. Map to debitur
    const mapRes = await DocumentIntelligenceService.mapJobToDomain(testJobId, testUserId);
    assert.strictEqual(mapRes.success, true);
    assert.strictEqual(mapRes.mapped_entity_type, 'debitur');

    // 3. Verify debitur name has been updated in DB
    const checkDev = await db.query('SELECT nama FROM debitur WHERE id = $1', [testDebiturId]);
    assert.strictEqual(checkDev.rows[0].nama, 'Test DocIntel Debitur Edited');

    // 4. Verify job is completed
    const checkJob = await db.query('SELECT status, mapping_status FROM document_intelligence_jobs WHERE id = $1', [testJobId]);
    assert.strictEqual(checkJob.rows[0].status, 'COMPLETED');
    assert.strictEqual(checkJob.rows[0].mapping_status, 'MAPPED');
  });
});
