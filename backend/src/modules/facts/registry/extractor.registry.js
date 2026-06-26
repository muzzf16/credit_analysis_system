const BaseExtractor = require('../extractors/BaseExtractor');

class ExtractorRegistry {
  constructor() {
    this._extractors = new Map();
  }

  register(ExtractorClass) {
    if (!(ExtractorClass.prototype instanceof BaseExtractor) && ExtractorClass !== BaseExtractor) {
      throw new Error('Can only register classes that extend BaseExtractor');
    }
    
    const { stage } = ExtractorClass.metadata;
    if (!stage) {
      throw new Error('Extractor metadata must contain stage code');
    }
    
    if (this._extractors.has(stage)) {
      throw new Error(`Extractor for stage [${stage}] is already registered.`);
    }

    this._extractors.set(stage, ExtractorClass);
  }

  get(stage) {
    return this._extractors.get(stage) || null;
  }
}

const instance = new ExtractorRegistry();
module.exports = {
  ExtractorRegistry,
  instance
};
