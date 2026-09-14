const config = require('../../../config');

function normalizeTexts(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === 'string') return item.trim();
    return String(item?.text || '').trim();
  }).filter(Boolean);
}

function parseKtp(texts) {
  const lines = normalizeTexts(texts);
  const result = {};
  const confidences = {};

  const findValue = (patterns) => {
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      for (const pattern of patterns) {
        const m = line.match(pattern);
        if (m) return m[1]?.trim() || (lines[i + 1] || '').trim();
      }
    }
    return '';
  };

  result.nik = findValue([/^(?:NIK)\s*:?\s*(\d[\d\s-]{10,})$/i]);
  result.nama = findValue([/^Nama\s*:?\s*(.+)$/i]);
  result.tempat_tgl_lahir = findValue([/^Tempat\s*\/\s*Tgl\s*Lahir\s*:?\s*(.+)$/i]);
  result.jenis_kelamin = findValue([/^Jenis\s*Kelamin\s*:?\s*(.+)$/i]);
  result.alamat = findValue([/^Alamat\s*:?\s*(.+)$/i]);
  result.rt_rw = findValue([/^RT\s*\/\s*RW\s*:?\s*(\d{1,4}\s*\/\s*\d{1,4})$/i]);
  result.kel_desa = findValue([/^Kel\s*\/\s*Desa\s*:?\s*(.+)$/i]);
  result.kecamatan = findValue([/^Kecamatan\s*:?\s*(.+)$/i]);
  result.agama = findValue([/^Agama\s*:?\s*(.+)$/i]);
  result.status_perkawinan = findValue([/^Status\s*Perkawinan\s*:?\s*(.+)$/i]);
  result.pekerjaan = findValue([/^Pekerjaan\s*:?\s*(.+)$/i]);
  result.kewarganegaraan = findValue([/^Kewarganegaraan\s*:?\s*(.+)$/i]);
  result.berlaku_hingga = findValue([/^Berlaku\s*Hingga\s*:?\s*(.+)$/i]);

  // Paddle can split label and value into separate text boxes.
  const pairs = [
    ['nik', /^NIK$/i], ['nama', /^Nama$/i], ['tempat_tgl_lahir', /^Tempat\/Tgl Lahir$/i],
    ['jenis_kelamin', /^Jenis Kelamin$/i], ['alamat', /^Alamat$/i], ['rt_rw', /^RT\/RW$/i],
    ['kel_desa', /^Kel\/Desa$/i], ['kecamatan', /^Kecamatan$/i], ['agama', /^Agama$/i],
    ['status_perkawinan', /^Status Perkawinan:?$/i], ['pekerjaan', /^Pekerjaan$/i],
    ['kewarganegaraan', /^Kewarganegaraan:?$/i], ['berlaku_hingga', /^Berlaku Hingga$/i]
  ];
  for (const [key, labelPattern] of pairs) {
    if (result[key]) continue;
    const idx = lines.findIndex((x) => labelPattern.test(x));
    if (idx >= 0 && lines[idx + 1]) {
      result[key] = lines[idx + 1].replace(/^:\s*/, '').trim();
    }
  }

  result.nik = String(result.nik || '').replace(/\D/g, '');
  const ttl = String(result.tempat_tgl_lahir || '');
  const ttlMatch = ttl.match(/^\s*([^,]+?)\s*,\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\s*$/);
  if (ttlMatch) {
    result.tempat_lahir = ttlMatch[1].trim();
    result.tanggal_lahir = ttlMatch[2].trim();
  }
  const rr = String(result.rt_rw || '').match(/(\d{1,4})\s*\/\s*(\d{1,4})/);
  if (rr) {
    result.rt = rr[1];
    result.rw = rr[2];
  }

  return result;
}

class PaddleOcrEngine {
  async execute(processingBuffer, processingMime, type) {
    const baseUrl = config.paddleOcrApiUrl;
    if (!baseUrl) {
      return { success: false, error: new Error('PADDLEOCR_API_URL belum dikonfigurasi.') };
    }

    try {
      const form = new FormData();
      form.append('file', new Blob([processingBuffer], { type: processingMime || 'image/png' }), 'document');
      form.append('type', type || 'general');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.paddleOcrTimeoutMs || 30000);

      const started = Date.now();
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/ocr`, {
        method: 'POST',
        body: form,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`PaddleOCR HTTP ${response.status}: ${(await response.text()).substring(0, 300)}`);
      }

      const payload = await response.json();
      if (!payload.success) {
        throw new Error(payload.error || 'PaddleOCR service returned success=false');
      }

      const texts = payload.rec_texts || payload.texts || [];
      const scores = Array.isArray(payload.rec_scores) ? payload.rec_scores.map(Number) : [];
      const confidence = Number(payload.confidence ?? (scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0));
      const data = String(type).toLowerCase() === 'ktp' ? parseKtp(texts) : (payload.data || {});

      const confidences = {};
      if (String(type).toLowerCase() === 'ktp') {
        const lineConfidence = (field) => {
          const value = String(data[field] || '').toLowerCase();
          if (!value) return confidence;
          const idx = texts.findIndex((t) => String(t).toLowerCase().includes(value));
          return idx >= 0 && scores[idx] != null ? scores[idx] : confidence;
        };
        for (const field of Object.keys(data)) confidences[field] = lineConfidence(field);
        confidences._overall = confidence;
      } else {
        confidences._overall = confidence;
      }

      console.log(`[PaddleOcrEngine] ${type}: ${texts.length} text boxes, confidence=${confidence.toFixed(3)}, remote=${Date.now() - started}ms`);

      return {
        success: true,
        data,
        rawText: texts.join('\n'),
        texts,
        boxes: payload.rec_boxes || payload.boxes || [],
        confidences,
        confidence,
        warnings: payload.warnings || [],
        engineUsed: 'paddleocr'
      };
    } catch (err) {
      console.warn('[PaddleOcrEngine] Failed:', err.message);
      return { success: false, error: err, confidence: null };
    }
  }
}

module.exports = new PaddleOcrEngine();
