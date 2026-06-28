'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const ocrMapper = require('../../../src/modules/document/ocr-mapper');
const GlmOcrClient = require('../../../src/modules/document/ocr-client');

describe('GLM OCR KTP Integration Tests', () => {
  
  test('ocrMapper.normalizeDate should parse various formats to YYYY-MM-DD', () => {
    assert.strictEqual(ocrMapper.normalizeDate('01-01-1990'), '1990-01-01');
    assert.strictEqual(ocrMapper.normalizeDate('15/08/1985'), '1985-08-15');
    assert.strictEqual(ocrMapper.normalizeDate('2000-12-31'), '2000-12-31');
    assert.strictEqual(ocrMapper.normalizeDate(''), '');
  });

  test('ocrMapper.normalizeGender should map to L/P', () => {
    assert.strictEqual(ocrMapper.normalizeGender('LAKI-LAKI'), 'L');
    assert.strictEqual(ocrMapper.normalizeGender('LAKI'), 'L');
    assert.strictEqual(ocrMapper.normalizeGender('PEREMPUAN'), 'P');
    assert.strictEqual(ocrMapper.normalizeGender(''), 'L');
  });

  test('ocrMapper.normalizeStatusNikah should map to DB ENUMs', () => {
    assert.strictEqual(ocrMapper.normalizeStatusNikah('BELUM KAWIN'), 'BELUM_KAWIN');
    assert.strictEqual(ocrMapper.normalizeStatusNikah('KAWIN'), 'KAWIN');
    assert.strictEqual(ocrMapper.normalizeStatusNikah('CERAI HIDUP'), 'CERAI_HIDUP');
    assert.strictEqual(ocrMapper.normalizeStatusNikah('CERAI MATI'), 'CERAI_MATI');
  });

  test('ocrMapper.mapOcrToDebtorDto should correctly map external response', () => {
    const mockOcrResponse = {
      success: true,
      confidence: 95,
      data: {
        nik: '1234567890123456',
        nama: 'JOKO WIDODO',
        tempat_lahir: 'SOLO',
        tanggal_lahir: '21-06-1961',
        jenis_kelamin: 'LAKI-LAKI',
        alamat: 'JL. KALIURANG KM 5',
        rt: '02',
        rw: '03',
        kelurahan: 'SINDUADI',
        kecamatan: 'MLATI',
        kabupaten: 'SLEMAN',
        provinsi: 'DIY',
        agama: 'ISLAM',
        status_perkawinan: 'KAWIN',
        pekerjaan: 'PRESIDEN',
        kewarganegaraan: 'WNI',
        berlaku_hingga: 'SEUMUR HIDUP'
      },
      fields: {
        nik: { value: '1234567890123456', confidence: 99 },
        nama: { value: 'JOKO WIDODO', confidence: 98 },
        rt: { value: '02', confidence: 75 }
      }
    };

    const mapped = ocrMapper.mapOcrToDebtorDto(mockOcrResponse);

    assert.strictEqual(mapped.success, true);
    assert.strictEqual(mapped.engineUsed, 'glm');
    assert.strictEqual(mapped.data.nik, '1234567890123456');
    assert.strictEqual(mapped.data.nama, 'JOKO WIDODO');
    assert.strictEqual(mapped.data.tempatLahir, 'SOLO');
    assert.strictEqual(mapped.data.tempat_lahir, 'SOLO');
    assert.strictEqual(mapped.data.tanggalLahir, '1961-06-21');
    assert.strictEqual(mapped.data.tanggal_lahir, '1961-06-21');
    assert.strictEqual(mapped.data.gender, 'L');
    assert.strictEqual(mapped.data.statusNikah, 'KAWIN');
    assert.strictEqual(mapped.data.alamat, 'JL. KALIURANG KM 5');
    assert.strictEqual(mapped.data.rt, '02');
    assert.strictEqual(mapped.data.rw, '03');
    assert.strictEqual(mapped.data.kelurahan, 'SINDUADI');
    assert.strictEqual(mapped.data.kecamatan, 'MLATI');
    assert.strictEqual(mapped.data.kabupaten, 'SLEMAN');

    // Confidences check (GLM returns 0-100, mapper converts to 0-1)
    assert.strictEqual(mapped.confidences.nik, 0.99);
    assert.strictEqual(mapped.confidences.nama, 0.98);
    assert.strictEqual(mapped.confidences.rt, 0.75);
    // Fallback confidence check (for field without specific confidence)
    assert.strictEqual(mapped.confidences.kecamatan, 0.95);
  });

  test('GlmOcrClient.uploadKtp should upload file to GLM OCR service and return response', async () => {
    // Mock global fetch
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      assert.match(url, /\/ocr\/ktp$/);
      assert.strictEqual(options.method, 'POST');
      assert.ok(options.body instanceof FormData);

      return {
        ok: true,
        text: async () => JSON.stringify({
          success: true,
          confidence: 92,
          data: {
            nik: '3325010101900001',
            nama: 'BUDI SANTOSO'
          },
          fields: {
            nik: { value: '3325010101900001', confidence: 95 }
          }
        }),
        json: async () => ({
          success: true,
          confidence: 92,
          data: {
            nik: '3325010101900001',
            nama: 'BUDI SANTOSO'
          },
          fields: {
            nik: { value: '3325010101900001', confidence: 95 }
          }
        })
      };
    };

    try {
      const res = await GlmOcrClient.uploadKtp(
        Buffer.from('dummy image'),
        'image/png',
        'ktp.png'
      );

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.confidence, 92);
      assert.strictEqual(res.data.nama, 'BUDI SANTOSO');
    } finally {
      global.fetch = originalFetch;
    }
  });
});
