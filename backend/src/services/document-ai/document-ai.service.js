const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

const config = require('../../config');
const { validateAndClean } = require('./document-ai.schemas');
const ocrPipeline = require('./pipeline/ocr.pipeline');



/**
 * Convert PDF to PNG Buffer (First page only)
 * @param {Buffer} pdfBuffer 
 * @returns {Promise<Buffer>} PNG Buffer
 */
async function convertPdfToPngBuffer(pdfBuffer) {
  const tmpId = Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  const tmpDir = path.join(os.tmpdir(), `pdf_conv_${tmpId}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const tmpPdf = path.join(tmpDir, 'source.pdf');
  fs.writeFileSync(tmpPdf, pdfBuffer);

  try {
    // Convert first page (-f 1 -l 1) as PNG at 150 DPI
    await execFileAsync('pdftoppm', ['-png', '-r', '150', '-f', '1', '-l', '1', tmpPdf, path.join(tmpDir, 'page')]);

    const files = fs.readdirSync(tmpDir).filter(f => f.endsWith('.png')).sort();
    if (files.length === 0) {
      throw new Error('PDF conversion to image failed: no output page generated.');
    }

    const firstPageImage = path.join(tmpDir, files[0]);
    const imageBuffer = fs.readFileSync(firstPageImage);
    return imageBuffer;
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (cleanupErr) {
      // ignore
    }
  }
}

/**
 * Generate extraction prompt based on document type
 * @param {string} type 
 * @returns {string} Prompt
 */
function getPromptForType(type) {
  switch (type.toLowerCase()) {
    case 'ktp':
      return `Ekstrak data dari gambar KTP ini.
Tulis ulang semua teks KTP ke dalam format JSON. Jika tidak terbaca, kosongkan. HANYA KELUARKAN JSON.

Format JSON:
{"nik":"isi_nik","nama":"isi_nama","tempat_tgl_lahir":"isi_tempat_tgl_lahir","jenis_kelamin":"isi_jenis_kelamin","alamat":"isi_alamat","rt_rw":"isi_rt_rw","kel_desa":"isi_kel_desa","kecamatan":"isi_kecamatan","agama":"isi_agama","status_perkawinan":"isi_status_perkawinan","pekerjaan":"isi_pekerjaan","kewarganegaraan":"isi_kewarganegaraan","berlaku_hingga":"isi_berlaku_hingga"}`;

    case 'surat_nikah':
      return `Kamu adalah sistem OCR dokumen Indonesia. BACA TEKS PERSIS SEPERTI YANG TERTULIS PADA GAMBAR KUTIPAN AKTA NIKAH / BUKU NIKAH.
ATURAN SANGAT KETAT:
1. DILARANG mengarang, menebak, atau menambahkan kata yang tidak ada di gambar.
2. Jika ada field yang blur, buram, tertutup, atau tidak terbaca dengan yakin, ISI DENGAN STRING KOSONG "".
3. Jangan memperbaiki ejaan nama jika tertulis salah di dokumen.
4. Kembalikan HANYA JSON valid tanpa markdown, tanpa komentar.

Ekstrak nilai-nilai berikut dari gambar:
- suamiNama: Nama Suami
- suamiNik: NIK Suami (biasanya 16 digit)
- istriNama: Nama Istri
- istriNik: NIK Istri (biasanya 16 digit)
- tanggalNikah: Tanggal pendaftaran pernikahan (format teks bebas dari gambar)

Gunakan format persis berikut:
{"suamiNama":"","suamiNik":"","istriNama":"","istriNik":"","tanggalNikah":""}`;

    case 'kk':
      return `Kamu adalah sistem OCR dokumen Indonesia. BACA TEKS PERSIS SEPERTI YANG TERTULIS PADA GAMBAR KARTU KELUARGA (KK).
ATURAN SANGAT KETAT:
1. DILARANG mengarang, menebak, atau menambahkan kata yang tidak ada di gambar.
2. Jika ada field yang blur atau tidak terbaca, ISI DENGAN STRING KOSONG "".
3. Kembalikan HANYA JSON valid tanpa markdown, tanpa komentar.

Ekstrak nilai-nilai berikut:
- nomor_kk: Angka Nomor KK (biasanya 16 digit besar di bagian atas)
- kepala_keluarga: Nama Kepala Keluarga
- alamat: Alamat lengkap
- anggota: array berisi objek anggota keluarga (hanya ambil "nama" dan "nik")

Gunakan format persis berikut:
{"nomor_kk":"","kepala_keluarga":"","alamat":"","anggota":[{"nama":"","nik":""}]}`;

    case 'npwp':
      return `Kamu adalah sistem OCR dokumen Indonesia. BACA TEKS PERSIS SEPERTI YANG TERTULIS PADA GAMBAR KARTU NPWP.
ATURAN SANGAT KETAT:
1. DILARANG mengarang, menebak, atau menambahkan kata yang tidak ada di gambar.
2. Jika field blur atau terpotong, ISI DENGAN STRING KOSONG "".
3. Kembalikan HANYA JSON valid tanpa markdown, tanpa komentar.

Ekstrak:
- nomor_npwp: Angka NPWP
- nama: Nama Wajib Pajak
- alamat: Alamat Wajib Pajak

Gunakan format persis berikut:
{"nomor_npwp":"","nama":"","alamat":""}`;

    case 'shm':
    case 'shm_cover':
    case 'shm_pendaftaran':
    case 'shm_peralihan':
    case 'shm_surat_ukur':
    case 'shm_peta':
      return `text recognition`;

    case 'bpkb':
      return `Kamu adalah sistem OCR dokumen Indonesia. BACA TEKS PERSIS SEPERTI YANG TERTULIS PADA GAMBAR BPKB KENDARAAN.
ATURAN SANGAT KETAT:
1. DILARANG mengarang atau menebak data.
2. Jika data tidak terbaca, ISI STRING KOSONG "".
3. Kembalikan HANYA JSON valid tanpa markdown.

Ekstrak:
- nomor_bpkb: Nomor BPKB (biasanya di sudut/atas)
- nomor_polisi: Nomor Registrasi Kendaraan
- merk: Merk Kendaraan
- tipe: Tipe Kendaraan
- tahun: Tahun Pembuatan (4 digit)
- atas_nama: Nama Pemilik
- alamat: Alamat Pemilik

Gunakan format persis berikut:
{"nomor_bpkb":"","nomor_polisi":"","merk":"","tipe":"","tahun":"","nomor_rangka":"","nomor_mesin":"","atas_nama":"","alamat":""}`;

    case 'survey':
      return `Kamu adalah sistem analisis foto usaha untuk bank perkreditan rakyat.
Analisa foto usaha/tempat usaha ini secara objektif.
Kembalikan HANYA JSON valid tanpa markdown, tanpa komentar.
Gunakan format persis berikut:
{"jenis_usaha":"","perkiraan_skala":"kecil/menengah/besar","kondisi_bangunan":"baik/sedang/kurang","indikasi_aktif":true,"catatan":""}
Pada field catatan, tuliskan observasi singkat tentang kondisi usaha yang terlihat di foto.`;



    default:
      return `Ekstrak semua teks dan data dari dokumen ini. Kembalikan JSON valid tanpa markdown.`;
  }
}

/**
 * Pass 2: Parsing raw text from VLM using LLM (Qwen3.5)
 */
async function callLlmParsing(rawText, type) {
  let schemaInstruction = '';
  switch (type.toLowerCase()) {
    case 'shm_cover':
      schemaInstruction = `{"kode_dokumen":"","nomor_sertifikat":"","jenis_hak":"HAK MILIK","nib":"","provinsi":"","kabupaten_kota":"","kecamatan":"","desa_kelurahan":"","kantor_pertanahan":"","daftar_isian_307":"","daftar_isian_208":""}`;
      break;
    case 'shm_pendaftaran':
      schemaInstruction = `{"nama_pemegang_hak":"","tanggal_lahir_pemegang":"","nib":"","nomor_sertifikat":"","desa_kelurahan":"","asal_hak":"","luas_m2":0,"keadaan_tanah":"","nomor_surat_ukur":"","tanggal_surat_ukur":"","tanggal_pembukuan":""}`;
      break;
    case 'shm_peralihan':
      schemaInstruction = `{"hak_tanggungan_aktif":false,"nama_kreditur_ht":"","nomor_ht":"","tanggal_apht":"","apht_ppat":"","kejadian":[]}`;
      break;
    case 'shm_surat_ukur':
      schemaInstruction = `{"kode_dokumen":"","nib":"","nomor_surat_ukur":"","provinsi":"","kabupaten_kota":"","kecamatan":"","desa_kelurahan":"","peta_lembar":"","peta_kotak":"","keadaan_tanah":"","luas_m2":0,"luas_terbilang":"","koordinat":""}`;
      break;
    case 'shm_peta':
      schemaInstruction = `{"skala":"","nomor_bidang_utama":"","nama_tetangga":[],"label_objek":[],"koordinat":"","penjelasan_legenda":""}`;
      break;
    default:
      schemaInstruction = `{"kode_dokumen":"","nomor_sertifikat":"","jenis_hak":"HAK MILIK","nib":"","nama_pemegang_hak":"","tanggal_lahir_pemegang":"","provinsi":"","kabupaten_kota":"","kecamatan":"","desa_kelurahan":"","kantor_pertanahan":"","luas_m2":0,"luas_terbilang":"","keadaan_tanah":"","nomor_surat_ukur":"","tanggal_surat_ukur":"","asal_hak":"","tanggal_pembukuan":"","daftar_isian_307":"","daftar_isian_208":"","hak_tanggungan_aktif":false,"nama_kreditur_ht":"","nomor_ht":""}`;
      break;
  }

  const prompt = `Kamu adalah AI ekstraksi data profesional. Ekstrak entitas dari teks OCR mentah berikut ke dalam format JSON yang sangat ketat.
ATURAN KETAT:
1. Jika data tidak ada di teks mentah, kosongkan ("" atau 0 atau null).
2. HANYA keluarkan JSON valid tanpa markdown atau teks pengantar.

FORMAT JSON YANG DIHARAPKAN:
${schemaInstruction}

TEKS OCR MENTAH:
${rawText}`;

  const payload = {
    model: config.llmModelName || "qwen3.5",
    messages: [
      { role: "system", content: "You are a precise JSON data extraction AI." },
      { role: "user", content: prompt }
    ],
    temperature: 0.0,
    response_format: { type: "json_object" }
  };

  const url = `${config.llmApiUrl}/chat/completions`;
  console.log(`[Document AI] Memanggil LLM Parsing di ${url} untuk tipe ${type}`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.llmApiKey}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`LLM HTTP ${response.status}: ${await response.text()}`);
    }

    const resJson = await response.json();
    let content = resJson?.choices?.[0]?.message?.content || '{}';
    content = content.trim();
    if (content.startsWith('```')) {
      content = content.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    }
    const jsonStart = content.indexOf('{');
    if (jsonStart > 0) {
      content = content.substring(jsonStart);
    }
    return JSON.parse(content);
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[Document AI] LLM Parsing Error:', err.message);
    throw err;
  }
}

/**
 * Send image & prompt to llama.cpp vision model
 * @param {Buffer} buffer - Image buffer
 * @param {string} mimetype - Image mimetype
 * @param {string} type - Document type
 * @returns {Promise<object>} Extracted object
 */
async function callLfmVisionOnce(buffer, mimetype, type, timeoutMs = 90000) {
  const base64Image = `data:${mimetype};base64,${buffer.toString('base64')}`;
  const prompt = getPromptForType(type);

  const payload = {
    model: "LFM2.5-VL-1.6B-Q4_0",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: base64Image } }
        ]
      }
    ],
    temperature: 0.0,
    max_tokens: 1024
  };

  // Hanya terapkan grammar JSON untuk dokumen yang prompt-nya mengharapkan JSON
  if (!type.startsWith('shm')) {
    payload.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${config.lfmApiUrl}/v1/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LFM HTTP ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const resJson = await response.json();
    let content = resJson?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('LFM response tidak mengandung content.');
    }

    content = content.trim();

    // Bersihkan markdown code block jika model mengeluarkannya
    if (content.startsWith('```')) {
      content = content.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    }

    // Cari JSON block pertama jika ada prefix teks
    const jsonStart = content.indexOf('{');
    if (jsonStart > 0) {
      content = content.substring(jsonStart);
    }

    let parsed;
    try {
      parsed = JSON.parse(content.trim());
    } catch (parseError) {
      // Jika model mengembalikan plain text (karena json_object dimatikan),
      // kita bungkus manual agar pipeline bisa mengekstraknya
      console.log(`[LFM VLM RAW] Output (Not JSON):`, content);
      parsed = { raw_text: content.trim().split('\n') };
    }
    
    console.log(`[LFM VLM PARSED] Output:`, parsed);
    return parsed;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Send image & prompt to GLM vision model
 * @param {Buffer} buffer - Image buffer
 * @param {string} mimetype - Image mimetype
 * @param {string} type - Document type
 * @returns {Promise<object>} Extracted object
 */
async function callGlmVisionOnce(buffer, mimetype, type, timeoutMs = 90000) {
  const base64Image = `data:${mimetype};base64,${buffer.toString('base64')}`;
  const prompt = getPromptForType(type);

  const payload = {
    model: "glm-4v",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: base64Image } }
        ]
      }
    ],
    temperature: 0.0,
    max_tokens: 1024,
    response_format: { type: "json_object" }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${config.glmApiUrl}/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.glmApiKey || config.llmApiKey || ''}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GLM Vision HTTP ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const resJson = await response.json();
    let content = resJson?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('GLM response tidak mengandung content.');
    }

    content = content.trim();

    if (content.startsWith('```')) {
      content = content.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    }

    const jsonStart = content.indexOf('{');
    if (jsonStart > 0) {
      content = content.substring(jsonStart);
    }

    const parsed = JSON.parse(content.trim());
    return parsed;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Panggil GLM Vision dengan 1x retry otomatis sebelum lempar error
 * @param {Buffer} buffer 
 * @param {string} mimetype 
 * @param {string} type 
 * @returns {Promise<object>}
 */
async function callGlmVision(buffer, mimetype, type) {
  const url = `${config.glmApiUrl}/chat/completions`;
  console.log(`[Document AI] Memanggil GLM Vision: ${url} | tipe: ${type}`);

  try {
    return await callGlmVisionOnce(buffer, mimetype, type, 90000);
  } catch (firstErr) {
    console.warn(`[Document AI] GLM Vision percobaan 1 gagal (${firstErr.message}). Mencoba ulang...`);
    try {
      return await callGlmVisionOnce(buffer, mimetype, type, 90000);
    } catch (secondErr) {
      console.error(`[Document AI] GLM Vision percobaan 2 juga gagal: ${secondErr.message}`);
      throw secondErr;
    }
  }
}

/**
 * Panggil LFM Vision dengan 1x retry otomatis sebelum lempar error
 * @param {Buffer} buffer 
 * @param {string} mimetype 
 * @param {string} type 
 * @returns {Promise<object>}
 */
async function callLfmVision(buffer, mimetype, type) {
  const url = `${config.lfmApiUrl}/v1/chat/completions`;
  console.log(`[Document AI] Memanggil LFM VLM: ${url} | tipe: ${type}`);

  try {
    return await callLfmVisionOnce(buffer, mimetype, type, 90000);
  } catch (firstErr) {
    console.warn(`[Document AI] LFM percobaan 1 gagal (${firstErr.message}). Mencoba ulang...`);
    try {
      return await callLfmVisionOnce(buffer, mimetype, type, 90000);
    } catch (secondErr) {
      console.error(`[Document AI] LFM percobaan 2 juga gagal: ${secondErr.message}`);
      throw secondErr;
    }
  }
}

/**
 * Main Service Method (Process document extraction with Tesseract primary and GLM fallback)
 * @param {Buffer} fileBuffer - Input buffer (image or PDF)
 * @param {string} type - ktp, kk, npwp, shm, bpkb, survey
 * @param {string} mimetype - Original mimetype
 * @param {string} originalname - Original filename
 * @returns {Promise<object>} Clean validated schema object
 */
async function extractDocumentData(fileBuffer, type, mimetype = '', originalname = '') {
  const isPdf = mimetype === 'application/pdf' || (originalname && originalname.toLowerCase().endsWith('.pdf'));
  
  let processingBuffer = fileBuffer;
  let processingMime = mimetype || 'image/png';

  // If PDF, convert first page to image for OCR
  if (isPdf) {
    console.log(`[Document AI] PDF detected. Converting first page to PNG...`);
    processingBuffer = await convertPdfToPngBuffer(fileBuffer);
    processingMime = 'image/png';
  }

  // Run OCR Pipeline
  // VLM fallback wrapper (dengan implementasi Two-Pass untuk SHM)
  const vlmFallback = async (buffer, mime, t) => {
    let result;
    if (config.ocrEngine === 'lfm') {
      result = await callLfmVision(buffer, mime, t);
    } else {
      result = await callGlmVision(buffer, mime, t);
    }
    
    // Single-Pass Pipeline untuk SHM (Bypass LLM, lempar raw_text ke frontend)
    if (t.startsWith('shm')) {
      console.log(`[Document AI] SHM Single-Pass: Mengembalikan hasil raw_text langsung ke frontend`);
      if (result.raw_text) {
        let textToParse = Array.isArray(result.raw_text) ? result.raw_text.join('\n') : result.raw_text;
        return { raw_text: textToParse };
      } else {
        return result;
      }
    }
    
    return result;
  };

  return await ocrPipeline.run(processingBuffer, type, processingMime, vlmFallback);
}

module.exports = {
  extractDocumentData,
  convertPdfToPngBuffer
};
