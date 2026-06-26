const CapabilityCollection = require('../entities/CapabilityCollection');
const { instance: evaluatorRegistry } = require('../registry/evaluator.registry');

/**
 * CapabilityBuilder
 * Coordinates the conversion of a semantic FactCollection into Business Capabilities
 * by routing the collection to all registered Evaluators.
 */
class CapabilityBuilder {
  /**
   * Build a CapabilityCollection from a FactCollection
   * @param {Object} factCollection 
   * @returns {CapabilityCollection}
   */
  static build(factCollection) {
    if (!factCollection || typeof factCollection.getAll !== 'function') {
      throw new Error('CapabilityBuilder: Invalid FactCollection.');
    }

    const collection = new CapabilityCollection();

    for (const EvaluatorClass of evaluatorRegistry.getAll()) {
      const capability = EvaluatorClass.evaluate(factCollection);
      collection.add(capability);
    }

    // Freeze the collection
    collection.lock();
    return collection;
  }
}

module.exports = CapabilityBuilder;
