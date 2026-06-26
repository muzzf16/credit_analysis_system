const { instance: extractorRegistry } = require('../registry/extractor.registry');

class ExtractorResolver {
  static resolve(stageCode) {
    const ExtractorClass = extractorRegistry.get(stageCode);
    
    if (!ExtractorClass) {
      // In some designs we might throw, but maybe not all stages emit facts.
      // We will return null if no extractor exists for a stage, so the Builder can skip it.
      return null;
    }

    return ExtractorClass;
  }
}

module.exports = ExtractorResolver;
