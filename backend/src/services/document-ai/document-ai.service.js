const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

const config = require('../../config');
const { validateAndClean } = require('./document-ai.schemas');
const ocrService = require('../../modules/ocr/ocr.service');
const parsers = require('../../modules/ocr/parsers');

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
      return `Kamu adalah sistem OCR dokumen Indonesia. BACA TEKS PERSIS SEPERTI YANG TERTULIS PADA GAMBAR KTP.
ATURAN SANGAT KETAT:
1. DILARANG mengarang, menebak, atau menambahkan kata yang tidak ada di gambar (contoh: jangan tambah "JAKARTA" jika tidak tertulis).
2. Perhatikan ejaan huruf demi huruf dengan sangat teliti!
3. Jika teks tidak terbaca/tidak ada, kembalikan string kosong "".

Ekstrak nilai-nilai berikut dari gambar:
- nik: 16 digit angka NIK
- nama: nama lengkap persis seperti di KTP
- tempat_lahir: HANYA nama kota/kabupaten (kata sebelum tanda koma pada baris "Tempat/Tgl Lahir")
- tanggal_lahir: HANYA tanggal lahir dalam format DD-MM-YYYY (kata setelah tanda koma pada baris "Tempat/Tgl Lahir")
- jenis_kelamin: "LAKI-LAKI" atau "PEREMPUAN"
- alamat: teks persis setelah tulisan "Alamat"
- rt: angka RT saja (dari RT/RW)
- rw: angka RW saja (dari RT/RW)
- kelurahan: teks persis setelah tulisan "Kel/Desa"
- kecamatan: teks persis setelah tulisan "Kecamatan"
- agama: (ISLAM/KRISTEN/KATOLIK/HINDU/BUDHA/KONGHUCU)
- status_perkawinan: BELUM KAWIN / KAWIN / CERAI HIDUP / CERAI MATI
- pekerjaan: jenis pekerjaan
- kewarganegaraan: WNI atau WNA

Kembalikan HANYA JSON valid tanpa markdown:
{"nik":"...","nama":"...","tempat_lahir":"...","tanggal_lahir":"...","jenis_kelamin":"...","alamat":"...","rt":"...","rw":"...","kelurahan":"...","kecamatan":"...","agama":"...","status_perkawinan":"...","pekerjaan":"...","kewarganegaraan":"..."}`;

    case 'kk':
      return `Kamu adalah sistem OCR dokumen Indonesia. Ekstrak data dari gambar Kartu Keluarga (KK) ini.
Kembalikan HANYA JSON valid tanpa markdown, tanpa komentar.
Gunakan format persis berikut:
{"nomor_kk":"","kepala_keluarga":"","alamat":"","rt":"","rw":"","kelurahan":"","kecamatan":"","kabupaten":"","provinsi":"","anggota":[{"nik":"","nama":"","jenis_kelamin":"","tempat_lahir":"","tanggal_lahir":"","agama":"","pendidikan":"","jenis_pekerjaan":"","hubungan_keluarga":"","kewarganegaraan":""}]}
Isi setiap field dari teks yang terlihat. Field kosong isi string kosong.`;

    case 'npwp':
      return `Kamu adalah sistem OCR dokumen Indonesia. Ekstrak data dari gambar NPWP ini.
Kembalikan HANYA JSON valid tanpa markdown, tanpa komentar.
Gunakan format persis berikut:
{"nomor_npwp":"","nama":"","alamat":""}
Untuk nomor_npwp sertakan tanda titik dan strip (contoh: 12.345.678.9-012.000).
Isi setiap field dari teks yang terlihat. Field kosong isi string kosong.`;

    case 'shm':
      return `Kamu adalah sistem OCR dokumen Indonesia. BACA TEKS PERSIS SEPERTI YANG TERTULIS PADA GAMBAR SERTIFIKAT TANAH (SHM).
ATURAN SANGAT KETAT:
1. DILARANG mengarang, menebak, atau menambahkan kata yang tidak ada di gambar.
2. Jika teks tidak terbaca/tidak ada, kembalikan string kosong "".

Ekstrak nilai-nilai berikut dari gambar:
- nomor_sertifikat: angka/nomor sertifikat (biasanya 5 digit setelah "No.")
- jenis_hak: "HAK MILIK" atau jenis hak lainnya
- atas_nama: nama pemegang hak (biasanya ada di bagian "NAMA PEMEGANG HAK")
- luas_tanah: angka luas tanah dalam meter persegi (hanya angkanya saja)
- desa: teks setelah "DESA / KELURAHAN"
- kecamatan: teks setelah "KECAMATAN"
- kabupaten: teks setelah "KABUPATEN / KOTA"

Kembalikan HANYA JSON valid tanpa markdown:
{"nomor_sertifikat":"","jenis_hak":"HAK MILIK","atas_nama":"","luas_tanah":"","desa":"","kecamatan":"","kabupaten":""}`;

    case 'bpkb':
      return `Kamu adalah sistem OCR dokumen Indonesia. Ekstrak data dari gambar BPKB (Buku Pemilik Kendaraan Bermotor) ini.
Kembalikan HANYA JSON valid tanpa markdown, tanpa komentar.
Gunakan format persis berikut:
{"nomor_bpkb":"","nomor_polisi":"","merk":"","tipe":"","tahun":"","nomor_rangka":"","nomor_mesin":"","atas_nama":"","alamat":""}
Isi setiap field dari teks yang terlihat. Field kosong isi string kosong.`;

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
    max_tokens: 700,
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

  const selectedEngine = config.ocrEngine;
  console.log(`[Document AI] Engine terpilih: ${selectedEngine} | URL VLM: ${config.lfmApiUrl} | tipe: ${type}`);

  if (selectedEngine === 'lfm') {
    try {
      const rawResult = await callLfmVision(processingBuffer, processingMime, type);
      console.log(`[Document AI] ✅ LFM berhasil. Validasi JSON schema...`);
      const cleaned = validateAndClean(rawResult, type);
      console.log(`[Document AI] ✅ Ekstraksi selesai via LFM. Fields:`, Object.keys(cleaned).join(', '));
      return {
        engineUsed: 'lfm',
        success: true,
        data: cleaned
      };
    } catch (lfmError) {
      console.warn(
        `[Document AI ⚠️] LFM gagal — fallback ke Tesseract OCR.\n` +
        `  URL: ${config.lfmApiUrl}\n` +
        `  Error: ${lfmError.message}`
      );
      // Lanjut ke Tesseract fallback
    }
  }

  // Tesseract OCR fallback
  console.log(`[Document AI] Menjalankan Tesseract fallback untuk tipe: ${type}`);
  const tesseractType = type === 'survey' ? 'ktp' : type;
  const ocrResult = await ocrService.processOCR(fileBuffer, tesseractType, mimetype);
  
  const rawText = ocrResult.rawText || '';
  const parsedData = parseTesseractFallback(rawText, type);

  return {
    engineUsed: 'tesseract',
    success: true,
    data: validateAndClean(parsedData, type)
  };
}

module.exports = {
  extractDocumentData,
  convertPdfToPngBuffer
};
