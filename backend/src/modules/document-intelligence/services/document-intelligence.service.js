const db = require('../../../config/database');
const { minioClient, BUCKET_NAME: BUCKET } = require('../../../config/minio');
const { v4: uuid } = require('uuid');
const path = require('path');
const config = require('../../../config');
const documentAiService = require('../../../services/document-ai/document-ai.service');
const { encrypt, decrypt } = require('../../../utils/encryption');

// Helper to safely write logs
function addLog(logs, status, message) {
  const list = Array.isArray(logs) ? logs : [];
  return [
    ...list,
    {
      timestamp: new Date().toISOString(),
      status,
      message
    }
  ];
}

// Simple similarity helper
function getSimilarity(s1, s2) {
  if (!s1 || !s2) return 0;
  s1 = s1.toLowerCase().replace(/[^a-z0-9]/g, '');
  s2 = s2.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s1 === s2) return 100;
  
  // Levenshtein distance
  const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  const distance = track[s2.length][s1.length];
  const maxLen = Math.max(s1.length, s2.length);
  return Math.round(((maxLen - distance) / maxLen) * 100);
}

class DocumentIntelligenceService {
  
  /**
   * Upload file to MinIO and register a new job in the queue
   */
  static async uploadAndCreateJob(file, debiturId, pengajuanId, userId) {
    const jobId = uuid();
    const ext = path.extname(file.originalname);
    const objectName = `doc-intel/${jobId}${ext}`;

    // 1. Upload to MinIO
    await minioClient.putObject(BUCKET, objectName, file.buffer, file.size, {
      'Content-Type': file.mimetype,
      'x-amz-meta-uploaded-by': userId,
    });

    const initialLogs = addLog([], 'PENDING', `File ${file.originalname} uploaded and job created.`);

    // 2. Insert Job in DB
    const queryStr = `
      INSERT INTO document_intelligence_jobs 
      (id, pengajuan_id, debitur_id, file_name, file_path, file_size, mime_type, status, logs, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const params = [
      jobId, 
      pengajuanId || null, 
      debiturId || null, 
      file.originalname, 
      objectName, 
      file.size, 
      file.mimetype, 
      'PENDING', 
      JSON.stringify(initialLogs),
      userId
    ];

    const result = await db.query(queryStr, params);
    const job = result.rows[0];

    // Trigger async processing in the background (no await)
    this.processJob(job.id, file.buffer).catch(err => {
      console.error(`[Doc Intel] Background job processing failed for ${job.id}:`, err);
    });

    return job;
  }

  /**
   * Main Queue Executor: runs classification, OCR, validation, comparison, and updates status
   */
  static async processJob(jobId, fileBuffer = null) {
    const jobResult = await db.query('SELECT * FROM document_intelligence_jobs WHERE id = $1', [jobId]);
    if (jobResult.rows.length === 0) throw new Error('Job tidak ditemukan.');
    let job = jobResult.rows[0];

    try {
      // Update status: CLASSIFYING
      job.status = 'CLASSIFYING';
      job.logs = addLog(job.logs, 'CLASSIFYING', 'Starting document classification.');
      await db.query(
        'UPDATE document_intelligence_jobs SET status = $1, logs = $2, updated_at = NOW() WHERE id = $3',
        [job.status, JSON.stringify(job.logs), jobId]
      );

      // Fetch file buffer if not passed in parameters
      if (!fileBuffer) {
        const stream = await minioClient.getObject(BUCKET, job.file_path);
        const chunks = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        fileBuffer = Buffer.concat(chunks);
      }

      // 1. Classification
      let documentType = job.document_type || 'UNKNOWN';
      if (documentType === 'UNKNOWN') {
        documentType = await this.classifyDocument(fileBuffer, job.mime_type, job.file_name);
      }

      job.document_type = documentType;
      job.status = 'PROCESSING_OCR';
      job.logs = addLog(job.logs, 'PROCESSING_OCR', `Document classified as ${documentType}. Running parser...`);
      await db.query(
        'UPDATE document_intelligence_jobs SET document_type = $1, status = $2, logs = $3, updated_at = NOW() WHERE id = $4',
        [job.document_type, job.status, JSON.stringify(job.logs), jobId]
      );

      // 2. Parser & OCR
      let parsedResult = null;
      if (documentType !== 'UNKNOWN') {
        const typeArg = documentType.toLowerCase();
        parsedResult = await documentAiService.extractDocumentData(
          fileBuffer,
          typeArg,
          job.mime_type,
          job.file_name
        );
      } else {
        parsedResult = {
          success: false,
          engineUsed: 'none',
          data: {}
        };
      }

      const extractedData = parsedResult?.data || {};

      // 3. Validation
      job.status = 'VALIDATING';
      job.logs = addLog(job.logs, 'VALIDATING', 'Validating extracted values.');
      await db.query(
        'UPDATE document_intelligence_jobs SET status = $1, logs = $2, updated_at = NOW() WHERE id = $3',
        [job.status, JSON.stringify(job.logs), jobId]
      );

      const validationResults = this.validateExtractedData(documentType, extractedData);

      // 4. Comparison (Verification against DB)
      let comparisonResults = {};
      if (job.debitur_id || job.pengajuan_id) {
        comparisonResults = await this.compareWithDatabase(
          documentType,
          extractedData,
          job.debitur_id,
          job.pengajuan_id
        );
      }

      // Final status: REVIEW_REQUIRED (needs analyst confirmation before mapping)
      job.status = 'REVIEW_REQUIRED';
      job.logs = addLog(job.logs, 'REVIEW_REQUIRED', 'Processing complete. Waiting for analyst review.');
      
      const updateQuery = `
        UPDATE document_intelligence_jobs 
        SET status = $1, extracted_data = $2, validation_results = $3, comparison_results = $4, logs = $5, updated_at = NOW()
        WHERE id = $6
        RETURNING *
      `;
      const updateParams = [
        job.status,
        JSON.stringify(extractedData),
        JSON.stringify(validationResults),
        JSON.stringify(comparisonResults),
        JSON.stringify(job.logs),
        jobId
      ];
      
      const finalResult = await db.query(updateQuery, updateParams);
      return finalResult.rows[0];

    } catch (error) {
      console.error(`[Doc Intel] Error processing job ${jobId}:`, error);
      job.status = 'FAILED';
      job.logs = addLog(job.logs, 'FAILED', `Error: ${error.message}`);
      await db.query(
        'UPDATE document_intelligence_jobs SET status = $1, logs = $2, updated_at = NOW() WHERE id = $3',
        [job.status, JSON.stringify(job.logs), jobId]
      );
      throw error;
    }
  }

  /**
   * Classify Document using VLM/LLM or simple naming conventions as a fast fallback
   */
  static async classifyDocument(buffer, mimetype, filename) {
    const fn = (filename || '').toLowerCase();
    
    // Naming pattern check first
    if (fn.includes('ktp')) return 'KTP';
    if (fn.includes('kartu_keluarga') || fn.includes('kk') || fn.includes('keluarga')) return 'KK';
    if (fn.includes('npwp')) return 'NPWP';
    if (fn.includes('shm') || fn.includes('sertifikat') || fn.includes('sertipikat')) return 'SHM';
    if (fn.includes('bpkb')) return 'BPKB';
    if (fn.includes('nikah') || fn.includes('kawin') || fn.includes('surat_nikah')) return 'SURAT_NIKAH';
    if (fn.includes('slik') || fn.includes('ideb')) return 'SLIK';
    if (fn.includes('survey')) return 'SURVEY';

    // VLM/LLM-based classification fallback
    try {
      console.log('[Doc Intel] Calling VLM for document classification...');
      // Convert PDF to image if needed
      let imageBuffer = buffer;
      if (mimetype === 'application/pdf') {
        imageBuffer = await documentAiService.convertPdfToPngBuffer(buffer);
      }

      const base64Img = imageBuffer.toString('base64');
      const response = await fetch(`${config.lfmApiUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Tentukan tipe dokumen dari gambar ini. Pilih satu: KTP, KK, NPWP, SHM, BPKB, SURAT_NIKAH, SLIK, SURVEY. Respon HANYA format JSON valid tanpa markdown seperti ini: {"type": "KTP", "reason": "Kartu Identitas KTP"}'
                },
                {
                  type: 'image_url',
                  image_url: { url: `data:image/png;base64,${base64Img}` }
                }
              ]
            }
          ],
          temperature: 0.1,
          max_tokens: 150
        })
      });

      if (response.ok) {
        const json = await response.json();
        let content = json?.choices?.[0]?.message?.content || '';
        if (content.startsWith('```')) {
          content = content.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
        }
        const parsed = JSON.parse(content.trim());
        const detected = (parsed.type || 'UNKNOWN').toUpperCase();
        const validTypes = ['KTP', 'KK', 'NPWP', 'SHM', 'BPKB', 'SURAT_NIKAH', 'SLIK', 'SURVEY'];
        if (validTypes.includes(detected)) {
          return detected;
        }
      }
    } catch (e) {
      console.warn('[Doc Intel] VLM Classification failed, fallback to UNKNOWN:', e.message);
    }

    return 'UNKNOWN';
  }

  /**
   * Validate extracted JSON data based on simple rules
   */
  static validateExtractedData(type, data) {
    const result = {
      is_valid: true,
      errors: [],
      warnings: []
    };

    if (!data) {
      result.is_valid = false;
      result.errors.push('Data kosong.');
      return result;
    }

    switch (type) {
      case 'KTP':
        if (!data.nik) {
          result.is_valid = false;
          result.errors.push('NIK tidak ditemukan.');
        } else if (!/^\d{16}$/.test(data.nik.replace(/\D/g, ''))) {
          result.warnings.push('Format NIK harus 16 digit angka.');
        }
        if (!data.nama) {
          result.is_valid = false;
          result.errors.push('Nama Lengkap tidak ditemukan.');
        }
        break;

      case 'KK':
        if (!data.nomor_kk) {
          result.is_valid = false;
          result.errors.push('Nomor KK tidak ditemukan.');
        }
        if (!data.anggota || !Array.isArray(data.anggota) || data.anggota.length === 0) {
          result.warnings.push('Daftar anggota keluarga kosong.');
        }
        break;

      case 'NPWP':
        if (!data.nomor_npwp) {
          result.is_valid = false;
          result.errors.push('Nomor NPWP tidak ditemukan.');
        }
        break;

      case 'SHM':
        if (!data.nomor_sertifikat) {
          result.is_valid = false;
          result.errors.push('Nomor sertifikat SHM tidak ditemukan.');
        }
        if (!data.nama_pemegang_hak && !data.atas_nama) {
          result.warnings.push('Nama pemegang hak kosong.');
        }
        if (!data.luas_m2 && !data.luas_tanah) {
          result.warnings.push('Luas tanah (m2) tidak terbaca.');
        }
        break;

      case 'BPKB':
        if (!data.nomor_bpkb) {
          result.is_valid = false;
          result.errors.push('Nomor BPKB tidak ditemukan.');
        }
        if (!data.nomor_polisi) {
          result.warnings.push('Nomor polisi (plat nomor) kosong.');
        }
        break;
      
      case 'SURAT_NIKAH':
        if (!data.suamiNama || !data.istriNama) {
          result.warnings.push('Nama suami atau nama istri tidak lengkap.');
        }
        break;
    }

    return result;
  }

  /**
   * Compare extracted OCR data with records stored in database
   */
  static async compareWithDatabase(type, data, debiturId, pengajuanId) {
    const comparison = {
      is_matching: true,
      fields: {}
    };

    let debitur = null;
    if (debiturId) {
      const devRes = await db.query('SELECT * FROM debitur WHERE id = $1', [debiturId]);
      if (devRes.rows.length > 0) {
        debitur = devRes.rows[0];
        debitur.nik = decrypt(debitur.nik);
      }
    } else if (pengajuanId) {
      const qRes = await db.query(
        `SELECT d.* FROM pengajuan p 
         JOIN debitur d ON p.debitur_id = d.id 
         WHERE p.id = $1`,
        [pengajuanId]
      );
      if (qRes.rows.length > 0) {
        debitur = qRes.rows[0];
        debitur.nik = decrypt(debitur.nik);
      }
    }

    if (!debitur) return comparison;

    const addCompareField = (field, dbVal, ocrVal, matchType = 'exact') => {
      let isMatch = false;
      let score = 0;

      if (!dbVal || !ocrVal) {
        isMatch = false;
        score = 0;
      } else if (matchType === 'exact') {
        const cleanDb = String(dbVal).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanOcr = String(ocrVal).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        isMatch = cleanDb === cleanOcr;
        score = isMatch ? 100 : 0;
      } else {
        // String similarity
        score = getSimilarity(String(dbVal), String(ocrVal));
        isMatch = score >= 80;
      }

      if (!isMatch) comparison.is_matching = false;

      comparison.fields[field] = {
        db_value: dbVal || 'N/A',
        ocr_value: ocrVal || 'N/A',
        is_match: isMatch,
        similarity_score: score
      };
    };

    if (type === 'KTP') {
      addCompareField('nik', debitur.nik, data.nik, 'exact');
      addCompareField('nama', debitur.nama, data.nama, 'fuzzy');
      addCompareField('tempat_lahir', debitur.tempat_lahir, data.tempat_lahir, 'fuzzy');
      addCompareField('kecamatan', debitur.kecamatan, data.kecamatan, 'fuzzy');
    } else if (type === 'KK') {
      // If debitur has a KK in DB, we could compare. If not, compare name with kepala_keluarga or anggota
      const namesList = [debitur.nama.toLowerCase()];
      const ocrNames = (data.anggota || []).map(a => (a.nama || '').toLowerCase());
      
      const containsDebitur = ocrNames.some(on => namesList.some(dn => on.includes(dn) || dn.includes(on)));
      comparison.fields['anggota_keluarga_contains_debitur'] = {
        db_value: debitur.nama,
        ocr_value: ocrNames.join(', ') || 'N/A',
        is_match: containsDebitur,
        similarity_score: containsDebitur ? 100 : 0
      };
      if (!containsDebitur) comparison.is_matching = false;
    } else if (type === 'NPWP') {
      addCompareField('nama_pemegang', debitur.nama, data.nama, 'fuzzy');
    } else if (type === 'SHM' && pengajuanId) {
      // Compare with agunan registered in pengajuan
      const agunanRes = await db.query('SELECT * FROM agunan WHERE pengajuan_id = $1 AND jenis_agunan = $2', [pengajuanId, 'TANAH']);
      if (agunanRes.rows.length > 0) {
        const agunan = agunanRes.rows[0];
        addCompareField('nomor_sertifikat', agunan.nomor_sertifikat, data.nomor_sertifikat || data.nomorHakMilik, 'exact');
        addCompareField('atas_nama', agunan.atas_nama, data.nama_pemegang_hak || data.atas_nama, 'fuzzy');
        addCompareField('luas_tanah', agunan.luas_tanah, data.luas_m2 || data.luas, 'exact');
      }
    } else if (type === 'BPKB' && pengajuanId) {
      const agunanRes = await db.query('SELECT * FROM agunan WHERE pengajuan_id = $1 AND jenis_agunan = $2', [pengajuanId, 'KENDARAAN']);
      if (agunanRes.rows.length > 0) {
        const agunan = agunanRes.rows[0];
        addCompareField('nomor_sertifikat', agunan.nomor_sertifikat, data.nomor_bpkb, 'exact');
        addCompareField('atas_nama', agunan.atas_nama, data.atas_nama, 'fuzzy');
      }
    }

    return comparison;
  }

  /**
   * Update extracted data manually during review phase before final mapping
   */
  static async updateJobData(jobId, data) {
    const jobRes = await db.query('SELECT * FROM document_intelligence_jobs WHERE id = $1', [jobId]);
    if (jobRes.rows.length === 0) throw new Error('Job tidak ditemukan.');
    const job = jobRes.rows[0];

    const validationResults = this.validateExtractedData(job.document_type, data);
    let comparisonResults = {};
    if (job.debitur_id || job.pengajuan_id) {
      comparisonResults = await this.compareWithDatabase(
        job.document_type,
        data,
        job.debitur_id,
        job.pengajuan_id
      );
    }

    const updatedLogs = addLog(job.logs, 'REVIEW_REQUIRED', 'Extracted data manually updated by analyst.');

    const result = await db.query(
      `UPDATE document_intelligence_jobs 
       SET extracted_data = $1, validation_results = $2, comparison_results = $3, logs = $4, updated_at = NOW() 
       WHERE id = $5 
       RETURNING *`,
      [JSON.stringify(data), JSON.stringify(validationResults), JSON.stringify(comparisonResults), JSON.stringify(updatedLogs), jobId]
    );

    return result.rows[0];
  }

  /**
   * Map job data to target system entities (Debitur, Agunan, SLIK, etc.)
   */
  static async mapJobToDomain(jobId, userId) {
    const jobRes = await db.query('SELECT * FROM document_intelligence_jobs WHERE id = $1', [jobId]);
    if (jobRes.rows.length === 0) throw new Error('Job tidak ditemukan.');
    const job = jobRes.rows[0];

    if (job.status !== 'REVIEW_REQUIRED') {
      throw new Error(`Mapping tidak diijinkan pada status job saat ini: ${job.status}`);
    }

    const data = job.extracted_data;
    let mappedEntityId = null;
    let mappedEntityType = null;

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      if (job.document_type === 'KTP') {
        mappedEntityType = 'debitur';
        if (job.debitur_id) {
          // Update existing debitur
          mappedEntityId = job.debitur_id;
          await client.query(
            `UPDATE debitur 
             SET nik = $1, nama = $2, tempat_lahir = $3, tanggal_lahir = $4, gender = $5,
                 status_nikah = $6, alamat = $7, kelurahan = $8, kecamatan = $9, agama = $10,
                 updated_at = NOW() 
             WHERE id = $11`,
            [
              encrypt(data.nik),
              data.nama,
              data.tempat_lahir || null,
              data.tanggal_lahir ? data.tanggal_lahir : null,
              (data.jenis_kelamin?.toUpperCase().includes('PEREMPUAN') ? 'P' : 'L'),
              data.status_perkawinan?.includes('BELUM') ? 'BELUM_KAWIN' : 'KAWIN',
              data.alamat || null,
              data.kel_desa || data.kelurahan || null,
              data.kecamatan || null,
              data.agama || null,
              job.debitur_id
            ]
          );
        } else {
          // Create new debitur
          const devRes = await client.query(
            `INSERT INTO debitur (nik, nama, tempat_lahir, tanggal_lahir, gender, status_nikah, alamat, kelurahan, kecamatan, agama, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
            [
              encrypt(data.nik),
              data.nama,
              data.tempat_lahir || null,
              data.tanggal_lahir ? data.tanggal_lahir : null,
              (data.jenis_kelamin?.toUpperCase().includes('PEREMPUAN') ? 'P' : 'L'),
              data.status_perkawinan?.includes('BELUM') ? 'BELUM_KAWIN' : 'KAWIN',
              data.alamat || null,
              data.kel_desa || data.kelurahan || null,
              data.kecamatan || null,
              data.agama || null,
              userId
            ]
          );
          mappedEntityId = devRes.rows[0].id;
          // link debitur to job
          await client.query('UPDATE document_intelligence_jobs SET debitur_id = $1 WHERE id = $2', [mappedEntityId, jobId]);
        }
      } 
      else if (job.document_type === 'SURAT_NIKAH') {
        mappedEntityType = 'pasangan';
        if (job.debitur_id) {
          // Fetch debitur name to check who is the spouse
          const dRes = await client.query('SELECT nama FROM debitur WHERE id = $1', [job.debitur_id]);
          const dName = dRes.rows[0]?.nama || '';
          
          let spouseName = data.istriNama;
          let spouseNik = data.istriNik;
          if (data.suamiNama && (data.suamiNama.toLowerCase().includes(dName.toLowerCase()) || dName.toLowerCase().includes(data.suamiNama.toLowerCase()))) {
            spouseName = data.istriNama;
            spouseNik = data.istriNik;
          } else if (data.istriNama && (data.istriNama.toLowerCase().includes(dName.toLowerCase()) || dName.toLowerCase().includes(data.istriNama.toLowerCase()))) {
            spouseName = data.suamiNama;
            spouseNik = data.suamiNik;
          }

          // Insert or update pasangan table
          await client.query('DELETE FROM pasangan WHERE debitur_id = $1', [job.debitur_id]);
          const pasRes = await client.query(
            `INSERT INTO pasangan (debitur_id, nik, nama, tanggal_lahir)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [
              job.debitur_id,
              spouseNik ? encrypt(spouseNik) : null,
              spouseName || null,
              data.tanggalNikah ? data.tanggalNikah : null
            ]
          );
          mappedEntityId = pasRes.rows[0].id;
        } else {
          throw new Error('Pernikahan memerlukan data debitur utama terlebih dahulu.');
        }
      }
      else if (job.document_type === 'SHM') {
        mappedEntityType = 'agunan';
        if (job.pengajuan_id) {
          // Check if there is an existing land agunan to update
          const agRes = await client.query(
            "SELECT id FROM agunan WHERE pengajuan_id = $1 AND jenis_agunan = 'TANAH' LIMIT 1",
            [job.pengajuan_id]
          );

          const luasTanah = parseFloat(data.luas_m2 || data.luas_tanah || 0);
          const nomorSertifikat = data.nomor_sertifikat || data.nib || 'N/A';
          const atasNama = data.nama_pemegang_hak || data.atas_nama || 'N/A';
          const alamatAgunan = `${data.desa_kelurahan || data.desa || ''}, ${data.kecamatan || ''}, ${data.kabupaten_kota || data.kabupaten || ''}, ${data.provinsi || ''}`;

          if (agRes.rows.length > 0) {
            mappedEntityId = agRes.rows[0].id;
            await client.query(
              `UPDATE agunan 
               SET nomor_sertifikat = $1, atas_nama = $2, luas_tanah = $3, alamat_agunan = $4,
                   kecamatan = $5, updated_at = NOW() 
               WHERE id = $6`,
              [nomorSertifikat, atasNama, luasTanah, alamatAgunan, data.kecamatan || null, mappedEntityId]
            );
          } else {
            // Create new
            const newAg = await client.query(
              `INSERT INTO agunan (pengajuan_id, jenis_agunan, nomor_sertifikat, atas_nama, luas_tanah, alamat_agunan, kecamatan, created_by)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
              [job.pengajuan_id, 'TANAH', nomorSertifikat, atasNama, luasTanah, alamatAgunan, data.kecamatan || null, userId]
            );
            mappedEntityId = newAg.rows[0].id;
          }
        } else {
          throw new Error('Agunan tanah (SHM) memerlukan data Pengajuan Kredit untuk pemetaan.');
        }
      }
      else if (job.document_type === 'BPKB') {
        mappedEntityType = 'agunan';
        if (job.pengajuan_id) {
          const agRes = await client.query(
            "SELECT id FROM agunan WHERE pengajuan_id = $1 AND jenis_agunan = 'KENDARAAN' LIMIT 1",
            [job.pengajuan_id]
          );

          const nomorSertifikat = data.nomor_bpkb || 'N/A';
          const atasNama = data.atas_nama || 'N/A';
          const deskripsi = `${data.merk || ''} ${data.tipe || ''} (${data.tahun || ''}) - Plat: ${data.nomor_polisi || ''}`;

          if (agRes.rows.length > 0) {
            mappedEntityId = agRes.rows[0].id;
            await client.query(
              `UPDATE agunan 
               SET nomor_sertifikat = $1, atas_nama = $2, deskripsi = $3, updated_at = NOW() 
               WHERE id = $4`,
              [nomorSertifikat, atasNama, deskripsi, mappedEntityId]
            );
          } else {
            const newAg = await client.query(
              `INSERT INTO agunan (pengajuan_id, jenis_agunan, nomor_sertifikat, atas_nama, deskripsi, created_by)
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
              [job.pengajuan_id, 'KENDARAAN', nomorSertifikat, atasNama, deskripsi, userId]
            );
            mappedEntityId = newAg.rows[0].id;
          }
        } else {
          throw new Error('Agunan kendaraan (BPKB) memerlukan data Pengajuan Kredit untuk pemetaan.');
        }
      }
      else if (job.document_type === 'SLIK') {
        mappedEntityType = 'slik';
        if (job.pengajuan_id && job.debitur_id) {
          // Check if slik exists
          const slikRes = await client.query(
            "SELECT id FROM slik WHERE pengajuan_id = $1 AND debitur_id = $2 LIMIT 1",
            [job.pengajuan_id, job.debitur_id]
          );

          const totalFasilitas = parseInt(data.totalFasilitas || 0);
          const totalPlafon = parseFloat(data.totalPlafon || 0);
          const totalBakiDebet = parseFloat(data.totalBakiDebet || 0);
          const kolMax = parseInt(data.kolektibilitasTertinggi || 1);
          const details = JSON.stringify(data.detailSlik || []);

          if (slikRes.rows.length > 0) {
            mappedEntityId = slikRes.rows[0].id;
            await client.query(
              `UPDATE slik 
               SET tanggal_slik = NOW(), kolektibilitas_tertinggi = $1, total_fasilitas = $2, 
                   total_plafon = $3, total_baki_debet = $4, detail_slik = $5 
               WHERE id = $6`,
              [kolMax, totalFasilitas, totalPlafon, totalBakiDebet, details, mappedEntityId]
            );
          } else {
            const newSlik = await client.query(
              `INSERT INTO slik (pengajuan_id, debitur_id, tanggal_slik, kolektibilitas_tertinggi, total_fasilitas, total_plafon, total_baki_debet, detail_slik, input_by)
               VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8) RETURNING id`,
              [job.pengajuan_id, job.debitur_id, kolMax, totalFasilitas, totalPlafon, totalBakiDebet, details, userId]
            );
            mappedEntityId = newSlik.rows[0].id;
          }
        } else {
          throw new Error('Data SLIK memerlukan Pengajuan Kredit dan Debitur untuk pemetaan.');
        }
      } else {
        throw new Error(`Pemetaan tipe dokumen ${job.document_type} belum didukung.`);
      }

      // Update job status to COMPLETED
      job.status = 'COMPLETED';
      job.mapping_status = 'MAPPED';
      job.logs = addLog(job.logs, 'COMPLETED', `Successfully mapped extracted data to ${mappedEntityType} record.`);

      await client.query(
        `UPDATE document_intelligence_jobs 
         SET status = $1, mapping_status = $2, mapped_entity_type = $3, mapped_entity_id = $4, logs = $5, updated_at = NOW() 
         WHERE id = $6`,
        [job.status, job.mapping_status, mappedEntityType, mappedEntityId, JSON.stringify(job.logs), jobId]
      );

      // Audit log entry
      await client.query(
        `INSERT INTO audit_logs (user_id, action, tabel_name, record_id, data_after)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userId, 
          'MAP_DOCUMENT', 
          'document_intelligence_jobs', 
          jobId, 
          JSON.stringify({ mapped_entity_type: mappedEntityType, mapped_entity_id: mappedEntityId })
        ]
      );

      await client.query('COMMIT');
      return { success: true, mapped_entity_type: mappedEntityType, mapped_entity_id: mappedEntityId };

    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`[Doc Intel] Mapping error for job ${jobId}:`, err);
      
      // Update job logs to record the mapping failure
      const failLogs = addLog(job.logs, 'REVIEW_REQUIRED', `Mapping failed: ${err.message}`);
      await db.query(
        'UPDATE document_intelligence_jobs SET logs = $1 WHERE id = $2',
        [JSON.stringify(failLogs), jobId]
      );

      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * List jobs with optional filters
   */
  static async getJobs({ status, documentType, pengajuanId, limit = 20, offset = 0 }) {
    let queryStr = `
      SELECT id, pengajuan_id, debitur_id, file_name, file_size, mime_type, document_type, status, mapping_status, created_at, updated_at
      FROM document_intelligence_jobs
    `;
    const params = [];
    const conditions = [];

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (documentType) {
      params.push(documentType);
      conditions.push(`document_type = $${params.length}`);
    }
    if (pengajuanId) {
      params.push(pengajuanId);
      conditions.push(`pengajuan_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      queryStr += ` WHERE ${conditions.join(' AND ')}`;
    }

    queryStr += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) FROM document_intelligence_jobs
      ${conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''}
    `;
    const countParams = params.slice(0, conditions.length);

    const countRes = await db.query(countQuery, countParams);
    const dataRes = await db.query(queryStr, params);

    return {
      jobs: dataRes.rows,
      total: parseInt(countRes.rows[0].count),
      limit,
      offset
    };
  }

  /**
   * Get job detailed status and data
   */
  static async getJobById(jobId) {
    const jobRes = await db.query('SELECT * FROM document_intelligence_jobs WHERE id = $1', [jobId]);
    if (jobRes.rows.length === 0) throw { status: 404, message: 'Job tidak ditemukan.' };
    const job = jobRes.rows[0];

    // Presigned MinIO Url to view the document
    let fileUrl = '';
    try {
      fileUrl = await minioClient.presignedGetObject(BUCKET, job.file_path, 3600);
    } catch (e) {
      console.error(`[Doc Intel] Presigned URL failed for ${job.file_path}`, e);
    }

    let linkedDebitur = null;
    if (job.debitur_id) {
      const devRes = await db.query('SELECT * FROM debitur WHERE id = $1', [job.debitur_id]);
      if (devRes.rows.length > 0) {
        linkedDebitur = devRes.rows[0];
        linkedDebitur.nik = decrypt(linkedDebitur.nik);
      }
    }

    let linkedPengajuan = null;
    if (job.pengajuan_id) {
      const pengRes = await db.query(
        `SELECT p.*, d.nama as debitur_nama 
         FROM pengajuan p
         LEFT JOIN debitur d ON p.debitur_id = d.id
         WHERE p.id = $1`,
        [job.pengajuan_id]
      );
      if (pengRes.rows.length > 0) linkedPengajuan = pengRes.rows[0];
    }

    return {
      ...job,
      file_url: fileUrl,
      linked_debitur: linkedDebitur,
      linked_pengajuan: linkedPengajuan
    };
  }

  /**
   * Delete a job from queue
   */
  static async deleteJob(jobId) {
    const jobRes = await db.query('SELECT file_path FROM document_intelligence_jobs WHERE id = $1', [jobId]);
    if (jobRes.rows.length === 0) throw { status: 404, message: 'Job tidak ditemukan.' };
    const job = jobRes.rows[0];

    // Try deleting from MinIO
    try {
      await minioClient.removeObject(BUCKET, job.file_path);
    } catch (e) {
      console.warn(`[Doc Intel] Failed to delete object ${job.file_path} from MinIO:`, e.message);
    }

    await db.query('DELETE FROM document_intelligence_jobs WHERE id = $1', [jobId]);
    return true;
  }
}

module.exports = DocumentIntelligenceService;
