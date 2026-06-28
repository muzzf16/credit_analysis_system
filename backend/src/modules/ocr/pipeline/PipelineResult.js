class PipelineResult {
  constructor(context) {
    this.success = true; // Assuming success if it reached this point
    this.sessionId = context.sessionId;
    this.documentId = context.documentId;
    this.type = context.documentType; // Required by existing frontend/API response
    this.engine = context.engine ? context.engine.constructor.name : null;
    this.processingTime = context.timings.total;
    this.warnings = context.warnings || [];
    this.rawText = context.rawText;
    this.data = context.parsedData; // Frontend expects 'data'
    this.evidence = context.evidence;
    // Map evidence scores (0-100) to confidences (0-1) with camelCase aliases for frontend
    this.confidences = this.buildConfidences(context);
  }

  buildConfidences(context) {
    const confidences = {};
    const evidence = context.evidence || {};
    
    // First, check for Tesseract confidences (direct 0-1 values)
    const tessConf = context._tesseractConfidences || context.tesseractConfidences;
    if (tessConf) {
      for (const [field, conf] of Object.entries(tessConf)) {
        // Tesseract confidences are already 0-1
        confidences[field] = typeof conf === 'number' ? conf : parseFloat(conf) || 0.65;
      }
    }
    
    // Then process evidence (score is 0-100)
    for (const [field, ev] of Object.entries(evidence)) {
      if (ev && typeof ev.score === 'number') {
        // Convert 0-100 to 0-1 scale only if not already set from Tesseract
        if (confidences[field] === undefined) {
          confidences[field] = ev.score / 100;
        }
      }
    }
    
    // Add overall confidence from context if available
    if (context.confidence && confidences._overall === undefined) {
      confidences._overall = context.confidence;
    }
    
    // Map snake_case to camelCase for frontend compatibility
    // Frontend uses fieldKey: 'tempatLahir', 'tanggalLahir', etc.
    const fieldMap = {
      'tempat_lahir': ['tempatLahir', 'tempat_clean'],
      'tanggal_lahir': ['tanggalLahir', 'tanggal_clean'],
      'jenis_kelamin': ['gender', 'jenis_kelamin'],
      'status_perkawinan': ['statusNikah', 'status_perkawinan'],
      'berlaku_hingga': ['berlakuHingga', 'berlaku_hingga'],
      'kewarganegaraan': ['kewarganegaraan'],
      'pekerjaan': ['pekerjaan'],
      'agama': ['agama'],
      'nik': ['nik'],
      'nama': ['nama'],
      'alamat': ['alamat'],
      'rt': ['rt'],
      'rw': ['rw'],
      'kelurahan': ['kelurahan'],
      'kecamatan': ['kecamatan'],
      'kabupaten': ['kabupaten'],
      'desa': ['kelurahan'] // alias
    };
    
    for (const [snake, camelNames] of Object.entries(fieldMap)) {
      if (confidences[snake] !== undefined) {
        const value = confidences[snake];
        for (const camel of camelNames) {
          confidences[camel] = value;
        }
      }
    }
    
    return confidences;
  }
}

module.exports = PipelineResult;
