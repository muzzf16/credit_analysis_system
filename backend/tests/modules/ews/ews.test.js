'use strict';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');

// Set env before importing config/db
process.env.DB_PORT = process.env.DB_PORT || '5435';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'BprBapera@2024';

const db = require('../../../src/config/database');
const ewsService = require('../../../src/modules/ews/ews.service');
const monitoringService = require('../../../src/modules/monitoring/monitoring.service');

describe('Early Warning System (EWS) Module Tests', () => {
  let testUserId;
  let testDebiturId;
  let testPengajuanId;
  let testMonitoringId;

  before(async () => {
    // 1. Get or create test user
    const userRes = await db.query("SELECT id FROM users WHERE username = 'admin' LIMIT 1");
    if (userRes.rows[0]) {
      testUserId = userRes.rows[0].id;
    } else {
      const insertUser = await db.query(
        `INSERT INTO users (username, email, password_hash, full_name, role_id)
         VALUES ('test_ews_user', 'test_ews@bprbapera.co.id', 'hash', 'Test EWS User',
                 (SELECT id FROM roles WHERE name = 'ADMIN' LIMIT 1))
         RETURNING id`
      );
      testUserId = insertUser.rows[0].id;
    }

    // 2. Create test debitur
    const debiturRes = await db.query(
      `INSERT INTO debitur (nik, nama, no_hp, alamat, ibu_kandung, hubungan_bank, kredit_aktif, created_by)
       VALUES ('1234567890123458', 'Test EWS Debitur', '081234567890', 'Batang', 'Ibu Test', 'Nasabah Baru', 'Tidak Ada', $1)
       RETURNING id`,
      [testUserId]
    );
    testDebiturId = debiturRes.rows[0].id;

    // 3. Create test pengajuan
    const pengajuanRes = await db.query(
      `INSERT INTO pengajuan (nomor_pengajuan, debitur_id, jenis_kredit, tujuan_kredit, plafon_diajukan, jangka_waktu_bulan, suku_bunga, angsuran_perbulan, status, ao_id, created_by)
       VALUES ('BPR/KRD/2026/TEST1', $1, 'PRODUKTIF', 'Modal Kerja', 50000000.00, 12, 12.00, 4500000.00, 'DISETUJUI', $2, $2)
       RETURNING id`,
      [testDebiturId, testUserId]
    );
    testPengajuanId = pengajuanRes.rows[0].id;

    // 4. Create monitoring record using monitoringService
    const monitoring = await monitoringService.create({
      pengajuanId: testPengajuanId,
      debiturId: testDebiturId,
      plafonDisetujui: 50000000.00,
      tanggalPencairan: '2026-01-01',
      jangkaWaktuBulan: 12,
      angsuranPerbulan: 4500000.00,
      catatan: 'Pencairan EWS test'
    });
    testMonitoringId = monitoring.id;
  });

  after(async () => {
    // Clean up all test tables in reverse order of foreign keys
    await db.query('DELETE FROM ews WHERE monitoring_id = $1', [testMonitoringId]);
    await db.query('DELETE FROM pembayaran WHERE monitoring_id = $1', [testMonitoringId]);
    await db.query('DELETE FROM monitoring WHERE id = $1', [testMonitoringId]);
    await db.query('DELETE FROM pengajuan WHERE id = $1', [testPengajuanId]);
    await db.query('DELETE FROM debitur WHERE id = $1', [testDebiturId]);
  });

  test('EWS Scan should not create alerts for on-time loan', async () => {
    // Set all payments in the past as TEPAT_WAKTU or future
    await db.query(
      `UPDATE pembayaran SET status = 'TEPAT_WAKTU', tanggal_bayar = CURRENT_DATE
       WHERE monitoring_id = $1 AND tanggal_jatuh_tempo < CURRENT_DATE`,
      [testMonitoringId]
    );

    const stats = await ewsService.scanEws();
    assert.ok(stats.scanned >= 1);

    // Verify no active alert exists in DB for this pengajuan
    const alerts = await db.query(
      "SELECT * FROM ews WHERE pengajuan_id = $1 AND status_alert = 'AKTIF'",
      [testPengajuanId]
    );
    assert.strictEqual(alerts.rows.length, 0);
  });

  test('EWS Scan should create warning alert for overdue payments', async () => {
    // Set one past payment to BELUM (past due)
    await db.query(
      `UPDATE pembayaran SET status = 'BELUM', tanggal_bayar = NULL
       WHERE monitoring_id = $1 AND angsuran_ke = 1`,
      [testMonitoringId]
    );

    // Update the payment's due date to be 15 days ago
    await db.query(
      `UPDATE pembayaran SET tanggal_jatuh_tempo = CURRENT_DATE - INTERVAL '15 days'
       WHERE monitoring_id = $1 AND angsuran_ke = 1`,
      [testMonitoringId]
    );

    const stats = await ewsService.scanEws();
    assert.ok(stats.alertsCreated >= 1 || stats.alertsUpdated >= 1);

    // Verify alert exists
    const alerts = await db.query(
      "SELECT * FROM ews WHERE pengajuan_id = $1 AND status_alert = 'AKTIF'",
      [testPengajuanId]
    );
    assert.strictEqual(alerts.rows.length, 1);
    const alert = alerts.rows[0];
    assert.ok(alert.dpd >= 14 && alert.dpd <= 16);
    assert.strictEqual(alert.risk_score, 'MEDIUM');
    assert.strictEqual(alert.trigger_type, 'TUNGGAKAN');
  });

  test('EWS logAoVisit should update qualitative markers and risk score to HIGH', async () => {
    const updatedAlert = await ewsService.logAoVisit(testMonitoringId, {
      penurunanOmzet: true,
      penurunanCashflow: true,
      kondisiAgunan: 'Rusak Sebagian',
      catatan: 'AO inspects collateral and business. Collateral degraded and omzet dropped.'
    }, testUserId);

    assert.strictEqual(updatedAlert.penurunan_omzet, true);
    assert.strictEqual(updatedAlert.penurunan_cashflow, true);
    assert.strictEqual(updatedAlert.risk_score, 'HIGH');

    // Verify database
    const dbAlerts = await db.query("SELECT * FROM ews WHERE id = $1", [updatedAlert.id]);
    assert.strictEqual(dbAlerts.rows[0].risk_score, 'HIGH');
  });

  test('EWS Scan should auto-resolve alert once payments are fully caught up and qualitative risk goes away', async () => {
    // 1. Mark all payments as paid
    await db.query(
      `UPDATE pembayaran SET status = 'TEPAT_WAKTU', tanggal_bayar = CURRENT_DATE
       WHERE monitoring_id = $1`,
      [testMonitoringId]
    );

    // 2. Set qualitative parameters back to normal in EWS table
    await db.query(
      `UPDATE ews SET penurunan_omzet = false, penurunan_cashflow = false, kondisi_agunan = 'Normal'
       WHERE monitoring_id = $1 AND status_alert = 'AKTIF'`,
      [testMonitoringId]
    );

    // 3. Scan again
    const stats = await ewsService.scanEws();
    assert.strictEqual(stats.resolved, 1);

    // 4. Verify in DB
    const dbAlerts = await db.query(
      "SELECT * FROM ews WHERE pengajuan_id = $1 AND status_alert = 'RESOLVED'",
      [testPengajuanId]
    );
    assert.strictEqual(dbAlerts.rows.length, 1);
  });
});
