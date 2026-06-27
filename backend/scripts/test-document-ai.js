/**
 * Test runner script for Document AI Service
 */
const assert = require('assert');
const config = require('../src/config');
const documentAiService = require('../src/services/document-ai/document-ai.service');
const { validateAndClean } = require('../src/services/document-ai/document-ai.schemas');

// Back up original fetch
const originalFetch = global.fetch;

// Helper to simulate a file buffer
const dummyImageBuffer = Buffer.from('dummy-image-content-for-testing-purposes');

async function runTests() {
  console.log('=== STARTING DOCUMENT AI UNIT TESTS ===\n');

  // Test 1: Schema validation and cleaning
  console.log('Test 1: Schema validation and cleaning...');
  try {
    const rawKtp = {
      nik: "1234567890123456",
      nama: "  John Doe  ",
      tempat_lahir: "Batang",
      random_field: "this should be removed"
    };
    const cleanKtp = validateAndClean(rawKtp, 'ktp');
    assert.strictEqual(cleanKtp.nik, "1234567890123456");
    assert.strictEqual(cleanKtp.nama, "John Doe");
    assert.strictEqual(cleanKtp.tempat_lahir, "Batang");
    assert.strictEqual(cleanKtp.random_field, undefined);
    assert.strictEqual(cleanKtp.pekerjaan, "");
    console.log('  ✓ Schema validation passed.');
  } catch (err) {
    console.error('  ✗ Schema validation failed:', err);
    process.exit(1);
  }

  // Test 2: VLM Successful Extraction (Mocking fetch)
  console.log('Test 2: LFM extraction success path...');
  try {
    const mockLfmResponse = {
      choices: [
        {
          message: {
            role: "assistant",
            content: JSON.stringify({
              nik: "3325010101900001",
              nama: "BUDI SANTOSO",
              tempat_lahir: "BATANG",
              tanggal_lahir: "01-01-1990",
              jenis_kelamin: "LAKI-LAKI",
              alamat: "JL. RAYA BATANG NO. 10",
              rt: "01",
              rw: "02",
              kelurahan: "KAUMAN",
              kecamatan: "BATANG",
              agama: "ISLAM",
              status_perkawinan: "BELUM KAWIN",
              pekerjaan: "WIRASWASTA",
              kewarganegaraan: "WNI"
            })
          }
        }
      ]
    };

    global.fetch = async (url, options) => {
      assert.strictEqual(url, `${config.lfmApiUrl}/v1/chat/completions`);
      const body = JSON.parse(options.body);
      assert.strictEqual(body.model, "LFM2.5-VL-1.6B-Q4_0");
      assert.strictEqual(body.response_format.type, "json_object");
      
      return {
        ok: true,
        json: async () => mockLfmResponse
      };
    };

    const origEngine = config.ocrEngine;
    config.ocrEngine = 'lfm';

    const result = await documentAiService.extractDocumentData(dummyImageBuffer, 'ktp', 'image/png', 'ktp.png');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.engineUsed, 'lfm');
    assert.strictEqual(result.data.nik, "3325010101900001");
    assert.strictEqual(result.data.nama, "BUDI SANTOSO");
    assert.strictEqual(result.data.jenis_kelamin, "LAKI-LAKI");

    config.ocrEngine = origEngine;
    console.log('  ✓ LFM extraction success path passed.');
  } catch (err) {
    console.error('  ✗ LFM extraction success path failed:', err);
    process.exit(1);
  }

  // Test 3: Fallback to Tesseract when LFM returns invalid JSON or errors out
  console.log('Test 3: Automatic fallback to Tesseract on LFM error...');
  try {
    global.fetch = async () => {
      throw new Error('Connection refused to http://localhost:1976');
    };

    const originalProcessOCR = require('../src/modules/ocr/services/ocr.service').processOCR;
    require('../src/modules/ocr/services/ocr.service').processOCR = async (buffer, type, mimetype) => {
      return {
        success: true,
        type,
        rawText: `
          NIK : 3325010101900002
          NAMA : IWAN KURNIAWAN
          TEMPAT/TGL LAHIR : BATANG, 12-12-1988
          JENIS KELAMIN : LAKI-LAKI
          ALAMAT : BUMI INDAH RT/RW 03/05
          KEL/DESA : DRIYOREJO
          KECAMATAN : BATANG
          STATUS PERKAWINAN : KAWIN
        `
      };
    };

    const origEngine = config.ocrEngine;
    config.ocrEngine = 'lfm';

    const result = await documentAiService.extractDocumentData(dummyImageBuffer, 'ktp', 'image/png', 'ktp.png');
    
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.engineUsed, 'tesseract');
    assert.strictEqual(result.data.nik, "3325010101900002");
    assert.strictEqual(result.data.nama, "IWAN KURNIAWAN");
    assert.strictEqual(result.data.tempat_lahir, "BATANG");
    assert.strictEqual(result.data.rt, "03");
    assert.strictEqual(result.data.rw, "05");
    assert.strictEqual(result.data.status_perkawinan, "KAWIN");

    config.ocrEngine = origEngine;
    require('../src/modules/ocr/services/ocr.service').processOCR = originalProcessOCR;
    console.log('  ✓ Fallback to Tesseract passed.');
  } catch (err) {
    console.error('  ✗ Fallback to Tesseract failed:', err);
    process.exit(1);
  }

  // Test 4: GLM VLM Successful Extraction (Mocking fetch)
  console.log('Test 4: GLM VLM extraction success path...');
  try {
    const mockGlmResponse = {
      choices: [
        {
          message: {
            role: "assistant",
            content: JSON.stringify({
              nik: "3325010101900003",
              nama: "SITI AMINAH",
              tempat_lahir: "BATANG",
              tanggal_lahir: "02-02-1992",
              jenis_kelamin: "PEREMPUAN",
              alamat: "JL. RAYA BATANG NO. 20",
              rt: "02",
              rw: "03",
              kelurahan: "KAUMAN",
              kecamatan: "BATANG",
              agama: "ISLAM",
              status_perkawinan: "KAWIN",
              pekerjaan: "IBU RUMAH TANGGA",
              kewarganegaraan: "WNI"
            })
          }
        }
      ]
    };

    global.fetch = async (url, options) => {
      assert.strictEqual(url, `${config.glmApiUrl}/chat/completions`);
      const body = JSON.parse(options.body);
      assert.strictEqual(body.model, "glm-4v");
      assert.strictEqual(body.response_format.type, "json_object");
      
      return {
        ok: true,
        json: async () => mockGlmResponse
      };
    };

    const origEngine = config.ocrEngine;
    config.ocrEngine = 'glm';

    const result = await documentAiService.extractDocumentData(dummyImageBuffer, 'ktp', 'image/png', 'ktp.png');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.engineUsed, 'glm');
    assert.strictEqual(result.data.nik, "3325010101900003");
    assert.strictEqual(result.data.nama, "SITI AMINAH");
    assert.strictEqual(result.data.jenis_kelamin, "PEREMPUAN");

    config.ocrEngine = origEngine;
    console.log('  ✓ GLM VLM extraction success path passed.');
  } catch (err) {
    console.error('  ✗ GLM VLM extraction success path failed:', err);
    process.exit(1);
  }

  // Test 5: GlmOcrEngine (legacy pipeline integration)
  console.log('Test 5: GlmOcrEngine legacy integration...');
  try {
    const mockGlmTextResponse = {
      choices: [
        {
          message: {
            role: "assistant",
            content: "NIK : 3325010101900004\nNAMA : AHMAD DAHILAN\n"
          }
        }
      ]
    };

    global.fetch = async (url, options) => {
      assert.strictEqual(url, `${config.glmApiUrl}/chat/completions`);
      const body = JSON.parse(options.body);
      assert.strictEqual(body.model, "glm-4v");
      assert.strictEqual(body.messages[0].content[0].text.includes("OCR"), true);
      
      return {
        ok: true,
        json: async () => mockGlmTextResponse
      };
    };

    const GlmOcrEngine = require('../src/modules/ocr/engines/GlmOcrEngine');
    const engine = new GlmOcrEngine();
    
    const context = {
      buffer: dummyImageBuffer,
      mime: 'image/png',
      documentType: 'ktp'
    };

    const rawText = await engine.recognize(context);
    assert.ok(rawText.includes("NIK : 3325010101900004"));
    assert.ok(rawText.includes("NAMA : AHMAD DAHILAN"));

    console.log('  ✓ GlmOcrEngine integration passed.');
  } catch (err) {
    console.error('  ✗ GlmOcrEngine integration failed:', err);
    process.exit(1);
  }

  // Restore original fetch
  global.fetch = originalFetch;

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY ===');
}

runTests();
