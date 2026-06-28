const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

const config = require('../../config');
const { validateAndClean } = require('./document-ai.schemas');
const ocrService = require('../../modules/ocr/services/ocr.service');
const parsers = require('../../modules/ocr/utils/parsers');

/**
 * Preprocess image for OCR using ImageMagick
 * @param {Buffer} imageBuffer 
 * @param {string} type - Tipe dokumen
 * @returns {Promise<Buffer>} Preprocessed Image Buffer
 */
async function preprocessImage(imageBuffer, type) {
  const tmpId = Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  const tmpDir = path.join(os.tmpdir(), `img_prep_${tmpId}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const tmpIn = path.join(tmpDir, 'input.img');
  const tmpOut = path.join(tmpDir, 'output.png');
  fs.writeFileSync(tmpIn, imageBuffer);

  try {
    const args = [tmpIn, '-resize', '1600x1600>'];

    // KTP memiliki watermark biru. Jika digrayscale/normalize, watermark menjadi gelap dan merusak teks.
    if (type === 'ktp') {
      args.push('-deskew', '40%', '-sharpen', '0x1');
    } else {
      args.push('-colorspace', 'gray', '-normalize', '-deskew', '40%', '-sharpen', '0x1');
    }
    args.push(tmpOut);

    await execFileAsync('convert', args);
    
    if (fs.existsSync(tmpOut)) {
      const processedBuffer = fs.readFileSync(tmpOut);
      return processedBuffer;
    } else {
      console.warn(`[Document AI] Preprocessing failed to generate output, returning original buffer.`);
      return imageBuffer;
    }
  } catch (err) {
    console.error(`[Document AI] Error during ImageMagick preprocess:`, err.message);
    return imageBuffer; // Fallback to original
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {
      console.error(`[Document AI] Failed to clean up temp dir: ${tmpDir}`, e.message);
    }
  }
}

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
      return `Baca KTP Indonesia secara akurat.
ATURAN: Jangan menebak. Jika tidak terbaca isi string kosong "". HANYA JSON.

Output JSON:
{"nik":"","nama":"","tempat_tgl_lahir":"","jenis_kelamin":"","alamat":"","rt_rw":"","kel_desa":"","kecamatan":"","agama":"","status_perkawinan":"","pekerjaan":"","kewarganegaraan":"","berlaku_hingga":""}`;

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
      return `Kamu adalah sistem OCR dokumen Indonesia yang ahli membaca Sertifikat Hak Milik (SHM) Indonesia.
ATURAN KETAT:
1. DILARANG mengarang, menebak, atau menambah data yang tidak tertulis di gambar.
2. Jika field tidak terbaca atau tidak ada di gambar ini, isi dengan string kosong "" atau null.
3. Kembalikan HANYA JSON valid tanpa markdown, tanpa komentar.

Gambar ini mungkin salah satu halaman SHM: Cover (DAFTAR ISIAN 206), Pendaftaran Pertama, Peralihan Hak/HT, atau Surat Ukur (DAFTAR ISIAN 207). Ekstrak semua yang terlihat.

PANDUAN BACA:
- Pojok kiri/kanan atas: KODE DOKUMEN format 3 huruf+6 angka (contoh: AAW579903)
- "HAK : MILIK  No. XXXXX" = jenis_hak dan nomor_sertifikat
- Barcode kotak-kotak bawah = NIB format 11.32.08.05.XXXXX (baca tiap kotak, titik = pemisah)
- "f) NAMA PEMEGANG HAK" = nama_pemegang_hak (huruf kapital)
- "Tanggal lahir / akta pendirian" di bawah nama = tanggal_lahir_pemegang (format DD-MM-YYYY, 31051992 = 31-05-1992)
- "b) NIB" = nib
- "e) SURAT UKUR  No." = nomor_surat_ukur (format XXXXX/NamaDesa/TAHUN)
- "Luas :" atau "e) Luas:" = luas dalam m²
- "DAFTAR ISIAN 307 No." dan "DAFTAR ISIAN 208 No." = nomor pencatatan
- "HAK TANGGUNGAN Nomor XXXXX/YYYY" di tabel peralihan = nomor_ht
- Nama bank/kreditur di kolom kanan tabel peralihan = nama_kreditur_ht

Kembalikan JSON persis berikut (isi apa yang terbaca, kosongkan yang tidak ada):
{
  "kode_dokumen": "",
  "nomor_sertifikat": "",
  "jenis_hak": "HAK MILIK",
  "nib": "",
  "nama_pemegang_hak": "",
  "tanggal_lahir_pemegang": "",
  "provinsi": "",
  "kabupaten_kota": "",
  "kecamatan": "",
  "desa_kelurahan": "",
  "kantor_pertanahan": "",
  "luas_m2": 0,
  "luas_terbilang": "",
  "keadaan_tanah": "",
  "nomor_surat_ukur": "",
  "tanggal_surat_ukur": "",
  "asal_hak": "",
  "tanggal_pembukuan": "",
  "daftar_isian_307": "",
  "daftar_isian_208": "",
  "hak_tanggungan_aktif": false,
  "nama_kreditur_ht": "",
  "nomor_ht": ""
}`;

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

    case 'shm_cover':
      return `Baca HALAMAN COVER Sertifikat Hak Milik (SHM).
ATURAN: Baca secara akurat. HANYA JSON.

Output JSON:
{"kode_dokumen":"","nomor_sertifikat":"","jenis_hak":"HAK MILIK","nib":"","provinsi":"","kabupaten_kota":"","kecamatan":"","desa_kelurahan":"","kantor_pertanahan":"","daftar_isian_307":"","daftar_isian_208":""}`;

    // ── SHM: Halaman Pendaftaran Pertama ────────────────────────────────────
    case 'shm_pendaftaran':
      return `Baca halaman PENDAFTARAN - PERTAMA Sertifikat Hak Milik.
ATURAN: Baca tulisan tangan/ketikan di kotak secara akurat. HANYA JSON.

Output JSON:
{"nama_pemegang_hak":"","tanggal_lahir_pemegang":"","nib":"","nomor_sertifikat":"","desa_kelurahan":"","asal_hak":"","luas_m2":0,"keadaan_tanah":"","nomor_surat_ukur":"","tanggal_surat_ukur":"","tanggal_pembukuan":""}`;

    // ── SHM: Halaman Peralihan Hak / Hak Tanggungan ─────────────────────────
    case 'shm_peralihan':
      return `Baca tabel PENDAFTARAN PERALIHAN HAK/HAK TANGGUNGAN di SHM.
ATURAN: Deteksi semua kejadian (HAK TANGGUNGAN, Jual Beli, Pewarisan, dll) di tabel. HANYA JSON.

Output JSON:
{"hak_tanggungan_aktif":false,"nama_kreditur_ht":"","nomor_ht":"","tanggal_apht":"","apht_ppat":"","kejadian":[]}`;

    // ── SHM: Halaman Surat Ukur (DAFTAR ISIAN 207) ──────────────────────────
    case 'shm_surat_ukur':
      return `Baca SURAT UKUR di Sertifikat Hak Milik. HANYA JSON.

Output JSON:
{"kode_dokumen":"","nib":"","nomor_surat_ukur":"","provinsi":"","kabupaten_kota":"","kecamatan":"","desa_kelurahan":"","peta_lembar":"","peta_kotak":"","keadaan_tanah":"","luas_m2":0,"luas_terbilang":"","koordinat":""}`;

    // ── SHM: Halaman Peta Bidang ─────────────────────────────────────────────
    case 'shm_peta':
      return `Baca PETA BIDANG TANAH / SURAT UKUR di SHM. HANYA JSON.

Output JSON:
{"skala":"","nomor_bidang_utama":"","nama_tetangga":[],"label_objek":[],"koordinat":"","penjelasan_legenda":""}`;

    default:
      return `Ekstrak semua teks dan data dari dokumen ini. Kembalikan JSON valid tanpa markdown.`;
  }
}

/**
 * Tesseract Fallback and Parsing Mapper
 * @param {string} rawText 
 * @param {string} type 
 * @returns {object} Clean mapped data
 */
function parseTesseractFallback(rawText, type) {
  switch (type.toLowerCase()) {
    case 'ktp': {
      const parsed = parsers.parseKTP(rawText);
      let rt = '';
      let rw = '';
      if (parsed.alamat) {
        const rtrwMatch = rawText.match(/RT\/?RW\s*[:;=]?\s*(\d{2,3})\s*[\/\-]\s*(\d{2,3})/i) ||
                          parsed.alamat.match(/RT\/?RW\s*(\d{2,3})\s*[\/\-]\s*(\d{2,3})/i);
        if (rtrwMatch) {
          rt = rtrwMatch[1];
          rw = rtrwMatch[2];
        }
      }
      
      let agama = "";
      const agamaMatch = rawText.match(/AGAMA\s*[:;=]?\s*([A-Z\s]+)/i);
      if (agamaMatch) {
        agama = agamaMatch[1].trim();
      }
      
      let pekerjaan = "";
      const pekMatch = rawText.match(/PEKERJAAN\s*[:;=]?\s*([A-Z\s\-\/]+)/i);
      if (pekMatch) {
        pekerjaan = pekMatch[1].trim();
      }

      let tempat_lahir = parsed.tempatLahir || "";
      tempat_lahir = tempat_lahir.replace(/^[A-Z\s\/.-]*\b(?:TEMPAT|TGL|LAHIR|TTL)\b[\s\/.-]*/i, '').trim();
      tempat_lahir = tempat_lahir.replace(/^[^A-Z]+/i, '').trim();

      return {
        nik: parsed.nik || "",
        nama: parsed.nama || "",
        tempat_lahir: tempat_lahir,
        tanggal_lahir: parsed.tanggalLahir || "",
        jenis_kelamin: parsed.gender === 'P' ? 'PEREMPUAN' : 'LAKI-LAKI',
        alamat: parsed.alamat || "",
        rt,
        rw,
        kelurahan: parsed.kelurahan || "",
        kecamatan: parsed.kecamatan || "",
        agama,
        status_perkawinan: parsed.statusNikah || "",
        pekerjaan,
        kewarganegaraan: 'WNI'
      };
    }
    case 'kk': {
      const kkMatch = rawText.match(/NO\s*[:;=]?\s*(\d{16})/i) || rawText.match(/KARTU\s+KELUARGA\s*[\r\n]+(?:NO\.?\s*)?(\d{16})/i);
      const nomor_kk = kkMatch ? kkMatch[1] : '';

      const kepalaMatch = rawText.match(/NAMA\s+KEPALA\s+KELUARGA\s*[:;=]?\s*([A-Z\s.,']+)/i);
      const kepala_keluarga = kepalaMatch ? kepalaMatch[1].trim() : '';

      const alamatMatch = rawText.match(/ALAMAT\s*[:;=]?\s*([A-Z0-9\s.,'\-\/]+)/i);
      const alamat = alamatMatch ? alamatMatch[1].trim() : '';

      return {
        nomor_kk,
        kepala_keluarga,
        alamat,
        anggota: []
      };
    }
    case 'npwp': {
      const npwpMatch = rawText.match(/(\d{2}\.?\d{3}\.?\d{3}\.?\d{1}-?\d{3}\.?\d{3})/);
      const nomor_npwp = npwpMatch ? npwpMatch[1].replace(/[^0-9.\-]/g, '') : '';

      const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
      let nama = '';
      let alamat = '';
      const numIdx = lines.findIndex(l => /(\d{2}\.?\d{3}\.?\d{3}\.?\d{1}-?\d{3}\.?\d{3})/.test(l));
      if (numIdx !== -1) {
        if (numIdx + 1 < lines.length) nama = lines[numIdx + 1].toUpperCase();
        if (numIdx + 2 < lines.length && !/KPP|DIREKTORAT|PAJAK/i.test(lines[numIdx + 2])) {
          alamat = lines[numIdx + 2].toUpperCase();
        }
      }

      return {
        nomor_npwp,
        nama,
        alamat
      };
    }
    case 'shm': {
      const parsed = parsers.parseSHM(rawText);
      let desa = '';
      let kabupaten = '';
      if (parsed.alamatAgunan) {
        const desaMatch = parsed.alamatAgunan.match(/DESA\s+([A-Z\s]+?)(?:,|$)/i);
        if (desaMatch) desa = desaMatch[1].trim();
        const parts = parsed.alamatAgunan.split(',');
        if (parts.length > 2) {
          kabupaten = parts[2].trim().replace(/KABUPATEN|KAB\.?/gi, '').trim();
        }
      }
      return {
        nomor_sertifikat: parsed.nomorSertifikat || "",
        jenis_hak: "HAK MILIK",
        atas_nama: parsed.atasNama || "",
        luas_tanah: parsed.luasTanah ? String(parsed.luasTanah) : "",
        desa,
        kecamatan: parsed.kecamatan || "",
        kabupaten
      };
    }
    case 'shm_cover':
    case 'shm_pendaftaran':
    case 'shm_peralihan':
    case 'shm_surat_ukur':
    case 'shm_peta': {
      // Tesseract tidak efektif untuk ekstraksi per-halaman SHM — return kosong
      console.warn(`[Document AI] Tesseract fallback tidak mendukung tipe ${type}. Kembalikan empty object.`);
      return {};
    }
    case 'bpkb': {
      const parsed = parsers.parseBPKB(rawText);
      let nomor_polisi = '';
      let merk = '';
      let tipe = '';
      let tahun = '';
      if (parsed.deskripsi) {
        const nopolMatch = parsed.deskripsi.match(/NOPOL:\s*([A-Z0-9\s]+)/i);
        if (nopolMatch) nomor_polisi = nopolMatch[1].trim();
        const thnMatch = parsed.deskripsi.match(/THN\s*(\d{4})/i);
        if (thnMatch) tahun = thnMatch[1].trim();
        const cleanDesc = parsed.deskripsi.replace(/NOPOL:.*|THN.*/gi, '').trim();
        const parts = cleanDesc.split(/\s+/);
        if (parts.length > 0) merk = parts[0];
        if (parts.length > 1) tipe = parts.slice(1).join(' ');
      }
      return {
        nomor_bpkb: parsed.nomorSertifikat || "",
        nomor_polisi,
        merk,
        tipe,
        tahun,
        atas_nama: parsed.atasNama || ""
      };
    }
    case 'survey': {
      return {
        jenis_usaha: "",
        perkiraan_skala: "",
        kondisi_bangunan: "",
        indikasi_aktif: true,
        catatan: "Tesseract fallback (analisis foto tidak didukung oleh Tesseract)"
      };
    }
    default:
      return {};
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
    max_tokens: 1024,
    response_format: { type: "json_object" }
  };

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

    const parsed = JSON.parse(content.trim());
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
 * Main Service Method (Process document extraction with adapter + fallback)
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

  // If PDF, convert first page to image for VLM
  if (isPdf) {
    console.log(`[Document AI] PDF detected. Converting first page to PNG...`);
    processingBuffer = await convertPdfToPngBuffer(fileBuffer);
    processingMime = 'image/png';
  }

  // Preprocess Image (ImageMagick) - skip grayscale for KTP (blue watermark)
  console.log(`[Document AI] Pre-processing image for better OCR accuracy...`);
  processingBuffer = await preprocessImage(processingBuffer, type);

  const selectedEngine = config.ocrEngine;
  console.log(`[Document AI] Engine terpilih: ${selectedEngine} | URL VLM: ${config.lfmApiUrl} | tipe: ${type}`);

  // Tesseract OCR as primary, VLM as enhancement fallback
  if (selectedEngine === 'tesseract') {
    console.log(`[Document AI] Menjalankan Tesseract sebagai engine utama...`);
    const tesseractType = type === 'survey' ? 'ktp' : type;
    const ocrResult = await ocrService.processOCR(fileBuffer, tesseractType, mimetype);
    
    const rawText = ocrResult.rawText || '';
    const parsedData = parseTesseractFallback(rawText, type);
    const cleaned = validateAndClean(parsedData, type);
    
    console.log(`[Document AI] ✅ Ekstraksi selesai via Tesseract. Confidence: ${(ocrResult.confidences?._overall || 0.65).toFixed(2)}`);
    return {
      engineUsed: 'tesseract',
      success: true,
      data: cleaned,
      confidences: ocrResult.confidences
    };
  }

  // LFM/GLM Vision as primary with Tesseract fallback
  if (selectedEngine === 'lfm' || selectedEngine === 'glm') {
    try {
      let rawResult;
      let engineName;
      
      if (selectedEngine === 'lfm') {
        rawResult = await callLfmVision(processingBuffer, processingMime, type);
        engineName = 'lfm';
      } else {
        rawResult = await callGlmVision(processingBuffer, processingMime, type);
        engineName = 'glm';
      }
      
      console.log(`[Document AI] ✅ ${engineName.toUpperCase()} berhasil. Validasi JSON schema...`);
      const cleaned = validateAndClean(rawResult, type);
      console.log(`[Document AI] ✅ Ekstraksi selesai via ${engineName.toUpperCase()}. Hasil:`, JSON.stringify(cleaned, null, 2));
      return {
        engineUsed: engineName,
        success: true,
        data: cleaned
      };
    } catch (vlmError) {
      console.warn(`[Document AI ⚠️] VLM gagal — fallback ke Tesseract OCR. Error: ${vlmError.message}`);
    }
  }

  // Final Tesseract fallback
  console.log(`[Document AI] Menjalankan Tesseract fallback untuk tipe: ${type}`);
  const tesseractType = type === 'survey' ? 'ktp' : type;
  const ocrResult = await ocrService.processOCR(fileBuffer, tesseractType, mimetype);

  const rawText = ocrResult.rawText || '';
  const parsedData = parseTesseractFallback(rawText, type);
  const confidences = ocrResult.confidences || {
    nik: 0.7,
    nama: 0.7,
    alamat: 0.6,
    kecamatan: 0.6,
    _overall: 0.65
  };

  return {
    engineUsed: 'tesseract',
    success: true,
    data: validateAndClean(parsedData, type),
    confidences
  };
}

module.exports = {
  extractDocumentData,
  convertPdfToPngBuffer
};
