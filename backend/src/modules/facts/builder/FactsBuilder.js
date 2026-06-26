const FactCollection = require('../entities/FactCollection');
const ExtractorResolver = require('../resolver/extractor.resolver');

/**
 * FactsBuilder
 * Coordinates the conversion of a technical PipelineResult into semantic Business Facts
 * by routing StageResults to their registered Extractors.
 */
class FactsBuilder {
  /**
   * Build a FactCollection from a PipelineResult
   * @param {Object} pipelineResult 
   * @returns {FactCollection}
   */
  static build(pipelineResult) {
    if (!pipelineResult || !pipelineResult.stages) {
      throw new Error('FactsBuilder: Invalid pipelineResult.');
    }

    const collection = new FactCollection();

    for (const stageResult of pipelineResult.stages) {
      const Extractor = ExtractorResolver.resolve(stageResult.stage);
      
      // If no extractor is registered for this stage, it means this stage 
      // doesn't produce Canonical Facts (perhaps it's purely validation).
      if (Extractor) {
        const facts = Extractor.extract(stageResult);
        collection.addMany(facts);
      }
    }

    // Freeze the collection so it can be safely passed to Decision Builder & AI
    collection.lock();
    return collection;
  }
}

module.exports = FactsBuilder;
