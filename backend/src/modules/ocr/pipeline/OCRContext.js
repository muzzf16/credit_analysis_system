class OCRContext {
  constructor(options = {}) {
    this.buffer = options.buffer || null;
    this.mime = options.mime || '';
    this.documentType = options.documentType || '';
    
    this.sessionId = options.sessionId || '';
    this.documentId = options.documentId || '';
    this.pipelineFingerprint = options.pipelineFingerprint || '';
    this.buildId = options.buildId || '';
    
    this.engine = null; // Will be set by EngineFactory
    this.metadata = options.metadata || {};
    
    this.rawText = '';
    this.parsedData = null;
    this.response = null;
    
    this.timings = {
      start: Date.now(),
      preprocessing: 0,
      recognition: 0,
      postprocessing: 0,
      total: 0
    };
    
    this.warnings = [];
    this.confidence = null;
    this.evidence = null;
  }
}

module.exports = OCRContext;
