const Fact = require('../entities/Fact');

/**
 * BaseExtractor
 * Template class for all Facts Extractors.
 * Takes a StageResult and outputs an Array of Facts.
 */
class BaseExtractor {
  static get metadata() {
    throw new Error('Extractor must define static get metadata()');
  }

  static extract(stageResult) {
    if (!stageResult || !stageResult.stage || !stageResult.status) {
      throw new Error('BaseExtractor: Invalid stageResult provided.');
    }

    const factsData = this._extractFacts(stageResult);
    
    // Force output to be Array of Fact Entities
    return factsData.map(data => {
      // Inject source if not provided
      if (!data.source) data.source = stageResult.stage;
      return new Fact(data);
    });
  }

  static _extractFacts(stageResult) {
    throw new Error('Extractor must implement _extractFacts(stageResult)');
  }
}

module.exports = BaseExtractor;
