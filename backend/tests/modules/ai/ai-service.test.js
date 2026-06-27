'use strict';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Set env before importing modules
process.env.DB_PORT = process.env.DB_PORT || '5435';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'BprBapera@2024';

const db = require('../../../src/config/database');
const aiService = require('../../../src/modules/ai/ai.service');
const { LLMAdapter } = require('../../../src/modules/ai/adapters');

class MockLLMAdapter extends LLMAdapter {
  constructor(mockContent) {
    super();
    this.mockContent = mockContent;
  }

  async generate(renderedPrompt, options) {
    return {
      content: this.mockContent,
      model: options?.model?.name || 'mock-qwen',
      usage: { promptTokens: 100, completionTokens: 200 },
    };
  }
}

describe('AI Credit Analyst Integration Service Tests', () => {
  let testDebiturId;
  let testPengajuanId;
  let testUserId;

  before(async () => {
    // 1. Get a valid user ID (e.g. AO or ADMIN)
    const userRes = await db.query("SELECT id FROM users WHERE username = 'admin' LIMIT 1");
    if (userRes.rows[0]) {
      testUserId = userRes.rows[0].id;
    } else {
      // Seed a user if none exists
      const insertUser = await db.query(
        `INSERT INTO users (username, email, password_hash, full_name)
         VALUES ('test_ai_user', 'test_ai@bprbapera.co.id', 'hash', 'Test User') RETURNING id`
      );
      testUserId = insertUser.rows[0].id;
    }

    // 2. Insert test debitur
    const debRes = await db.query(
      `INSERT INTO debitur (nama, nik, tempat_lahir, tanggal_lahir, gender, alamat, kelurahan, kecamatan, kabupaten, status_nikah, no_hp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      ['NASABAH AI TEST', '1234567890123456', 'Batang', '1990-01-01', 'L', 'Jl. Testing No. 12', 'Klampok', 'Weleri', 'Kendal', 'KAWIN', '08123456789']
    );
    testDebiturId = debRes.rows[0].id;

    // 3. Insert test pengajuan
    const pengRes = await db.query(
      `INSERT INTO pengajuan (debitur_id, nomor_pengajuan, jenis_kredit, plafon_diajukan, jangka_waktu_bulan, angsuran_perbulan, status, ao_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [testDebiturId, 'P-TEST-AI-001', 'KONSUMTIF', 50000000, 36, 1800000, 'SCORING', testUserId]
    );
    testPengajuanId = pengRes.rows[0].id;

    // 4. Insert test financial analysis
    await db.query(
      `INSERT INTO analisa_konsumtif (pengajuan_id, gaji_pokok, tunjangan, total_penghasilan, cicilan_existing, listrik, air, transportasi, pendidikan, kebutuhan_rumah_tangga, pengeluaran_lain, total_pengeluaran, disposable_income, status_kelayakan, angsuran_diajukan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [testPengajuanId, 5000000, 1000000, 6000000, 500000, 200000, 100000, 300000, 500000, 1500000, 200000, 3300000, 2700000, 'LAYAK', 1800000]
    );

    // 5. Insert test SLIK exposure record
    await db.query(
      `INSERT INTO slik (pengajuan_id, total_baki_debet, total_plafon, kolektibilitas_tertinggi)
       VALUES ($1, $2, $3, $4)`,
      [testPengajuanId, 10000000, 15000000, 1]
    );

    // 6. Insert test credit scoring
    await db.query(
      `INSERT INTO credit_scoring (pengajuan_id, char_score, cap_score, capital_score, coll_score, cond_score, total_score, grade, rekomendasi)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [testPengajuanId, 20, 25, 12, 16, 8, 81, 'B', 'DISETUJUI']
    );
  });

  after(async () => {
    // Cleanup test records
    await db.query('DELETE FROM ai_narrative WHERE pengajuan_id = $1', [testPengajuanId]);
    await db.query('DELETE FROM credit_scoring WHERE pengajuan_id = $1', [testPengajuanId]);
    await db.query('DELETE FROM slik WHERE pengajuan_id = $1', [testPengajuanId]);
    await db.query('DELETE FROM analisa_konsumtif WHERE pengajuan_id = $1', [testPengajuanId]);
    await db.query('DELETE FROM pengajuan WHERE id = $1', [testPengajuanId]);
    await db.query('DELETE FROM debitur WHERE id = $1', [testDebiturId]);
  });

  test('generateNarrative should construct analysis, execute prompt, and persist narrative to database', async () => {
    const mockJsonNarrative = JSON.stringify({
      executiveSummary: 'Analisa Kredit BPR Bapera menyetujui pengajuan kredit nasabah NASABAH AI TEST senilai Rp 50.000.000.',
      borrowerProfile: 'Nasabah bekerja sebagai pegawai dengan gaji total Rp 6.000.000.',
      financialAnalysis: 'Rasio cicilan aman. Total pengeluaran Rp 3.300.000 per bulan.',
      collateralAnalysis: 'Agunan cukup dan memadai.',
      riskAssessment: 'Risiko rendah. Kolektibilitas slik lancar.',
      strengths: 'Karakter baik, track record bersih.',
      weaknesses: 'Plafond limit mendekati DSR max.',
      mitigation: 'Pemotongan gaji otomatis.',
      recommendation: 'APPROVED_WITH_CONDITION',
      appendix: ['Pemblokiran saldo 1 bulan angsuran']
    });

    const mockAdapter = new MockLLMAdapter(mockJsonNarrative);
    aiService.setLLMAdapter(mockAdapter);

    const generated = await aiService.generateNarrative(testPengajuanId);
    assert.ok(generated);
    assert.strictEqual(generated.pengajuan_id, testPengajuanId);
    assert.ok(generated.narrative_data);
    assert.strictEqual(generated.narrative_data.executiveSummary, 'Analisa Kredit BPR Bapera menyetujui pengajuan kredit nasabah NASABAH AI TEST senilai Rp 50.000.000.');
    assert.strictEqual(generated.narrative_data.recommendation, 'APPROVED_WITH_CONDITION');

    // Retrieve from database and verify persistence
    const retrieved = await aiService.getNarrative(testPengajuanId);
    assert.ok(retrieved);
    assert.strictEqual(retrieved.id, generated.id);
    assert.strictEqual(retrieved.narrative_data.executiveSummary, generated.narrative_data.executiveSummary);
  });
});
