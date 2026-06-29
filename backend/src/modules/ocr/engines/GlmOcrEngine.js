const BaseEngine = require('./BaseEngine');
const config = require('../../../config');
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

class GlmOcrEngine extends BaseEngine {
  constructor() {
    super();
    this.apiKey = config.glmApiKey || config.llmApiKey || '';
    this.baseUrl = config.glmApiUrl || 'https://api.llamamind.com/v1';
  }

  getPromptForType(type) {
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

Kembalikan JSON persis berikut (isi apa yang terbaca, kosongkan yang tidak ada):
{"nomor_sertifikat":"","nama_pemegang_hak":"","kecamatan":"","luas_m2":0}`;

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
- tahun: Tahun Pembuatan (4 digit)
- atas_nama: Nama Pemilik

Gunakan format persis berikut:
{"nomor_bpkb":"","nomor_polisi":"","merk":"","tahun":"","atas_nama":""}`;

      default:
        return `Lakukan OCR pada gambar dokumen ini. Ekstrak dan kembalikan seluruh teks yang terlihat secara berurutan dan terstruktur tanpa penjelasan atau format tambahan.`;
    }
  }

  async preprocess(context) {
    // Preprocessing is handled dynamically during recognition
  }

  async recognize(context) {
    const { buffer, mime, documentType } = context;
    console.log(`[GLM] Starting OCR process for type: ${documentType}`);

    const isPdfMagic = buffer.length > 4 && 
                       buffer[0] === 0x25 && 
                       buffer[1] === 0x50 && 
                       buffer[2] === 0x44 && 
                       buffer[3] === 0x46;
    const isPdf = isPdfMagic || mime === 'application/pdf' || documentType.endsWith('.pdf');

    let processingBuffer = buffer;
    let processingMime = mime || 'image/png';

    if (isPdf) {
      console.log(`[GLM] Converting PDF to Image for type: ${documentType}`);
      const tmpId = Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const tmpDir = path.join(os.tmpdir(), `glm_ocr_${tmpId}`);
      fs.mkdirSync(tmpDir, { recursive: true });

      const tmpPdf = path.join(tmpDir, 'source.pdf');
      fs.writeFileSync(tmpPdf, buffer);

      try {
        execSync(`pdftoppm -png -r 150 -f 1 -l 1 "${tmpPdf}" "${tmpDir}/page"`, { stdio: 'ignore' });
        const files = fs.readdirSync(tmpDir).filter(f => f.endsWith('.png')).sort();
        if (files.length > 0) {
          processingBuffer = fs.readFileSync(path.join(tmpDir, files[0]));
          processingMime = 'image/png';
        }
      } catch (err) {
        console.error('[GLM] Error rasterizing PDF:', err.message);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    }

    const base64Image = `data:${processingMime};base64,${processingBuffer.toString('base64')}`;
    
    // For structured document types, return JSON; otherwise return plain text
    const isStructuredType = ['ktp', 'surat_nikah', 'kk', 'npwp', 'shm', 'bpkb'].includes(documentType.toLowerCase());
    let prompt;
    
    if (isStructuredType) {
      prompt = this.getPromptForType(documentType);
    } else {
      prompt = `Lakukan OCR pada gambar dokumen ini. Ekstrak dan kembalikan seluruh teks yang terlihat secara berurutan dan terstruktur tanpa penjelasan atau format tambahan.`;
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'glm-4v',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: base64Image } }
              ]
            }
          ],
          temperature: 0.1,
          max_tokens: 2048,
          ...(isStructuredType ? { response_format: { type: "json_object" } } : {})
        }),
      });

      if (!response.ok) {
        throw new Error(`GLM OCR request failed: ${response.statusText}`);
      }

      const resJson = await response.json();
      let extractedText = resJson?.choices?.[0]?.message?.content || '';
      
      // If GLM returned JSON for structured types, try to parse and return as text for parsers
      if (isStructuredType && extractedText) {
        extractedText = extractedText.trim();
        
        // Clean markdown code blocks if present
        if (extractedText.startsWith('```')) {
          extractedText = extractedText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
        }
        
        // Try to extract JSON and store it for direct use, but also return as text
        try {
          const jsonStart = extractedText.indexOf('{');
          const jsonEnd = extractedText.lastIndexOf('}');
          if (jsonStart >= 0 && jsonEnd > jsonStart) {
            const jsonString = extractedText.substring(jsonStart, jsonEnd + 1);
            const parsed = JSON.parse(jsonString);
            // Store parsed JSON in context for potential direct use
            context.glmParsedData = parsed;
            console.log(`[GLM] Successfully parsed JSON response for ${documentType}`);
          }
        } catch (parseErr) {
          console.warn(`[GLM] Could not parse JSON response, returning raw text:`, parseErr.message);
        }
      }
      
      // Set GLM confidence as 0.8 (good confidence)
      context.confidence = 0.8;
      
      console.log('[GLM] OCR extraction completed. Length:', extractedText.length);
      return extractedText.trim();
    } catch (error) {
      console.error('GLM OCR recognition failed:', error.message);
      throw error;
    }
  }

  async postprocess(context) {
    // Postprocessing handled dynamically
  }
}

module.exports = GlmOcrEngine;
