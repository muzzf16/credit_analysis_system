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
  }
}

module.exports = PipelineResult;
