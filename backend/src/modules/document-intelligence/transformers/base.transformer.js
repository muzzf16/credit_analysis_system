class BaseTransformer {
  /**
   * Translates common PipelineResult properties into a base Business Object structure
   * @param {Object} pipelineResult - Result from OCRPipeline
   * @returns {Object} Base structure
   */
  static getBaseStructure(pipelineResult) {
    return {
      documentId: pipelineResult.documentId || null,
      sessionId: pipelineResult.sessionId || null,
      source: {
        type: pipelineResult.type,
        engine: pipelineResult.engine,
        processingTimeMs: pipelineResult.processingTime
      },
      quality: {
        // We can aggregate evidence scores here or calculate an overall confidence
        score: this.calculateOverallQuality(pipelineResult.evidence)
      },
      validation: {
        isDataComplete: false,
        warnings: pipelineResult.warnings || []
      }
    };
  }

  static calculateOverallQuality(evidence) {
    if (!evidence) return 0;
    const scores = Object.values(evidence).map(e => e.score);
    if (scores.length === 0) return 0;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(avg);
  }

  static transform(pipelineResult) {
    throw new Error('transform() must be implemented by subclasses');
  }
}

module.exports = BaseTransformer;
