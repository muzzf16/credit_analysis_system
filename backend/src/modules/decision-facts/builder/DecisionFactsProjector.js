const DecisionFactsCollection = require('../entities/DecisionFactsCollection');
const { instance: projectorRegistry } = require('../registry/projector.registry');

/**
 * DecisionFactsProjector
 * Coordinates the conversion of a CapabilityCollection into simple DecisionFacts
 * by routing the collection to all registered Projectors.
 */
class DecisionFactsProjector {
  /**
   * Build a DecisionFactsCollection from a CapabilityCollection
   * @param {Object} capabilityCollection 
   * @returns {DecisionFactsCollection}
   */
  static build(capabilityCollection) {
    if (!capabilityCollection || typeof capabilityCollection.getAll !== 'function') {
      throw new Error('DecisionFactsProjector: Invalid CapabilityCollection.');
    }

    const collection = new DecisionFactsCollection();

    for (const ProjectorClass of projectorRegistry.getAll()) {
      const decisionFact = ProjectorClass.project(capabilityCollection);
      collection.add(decisionFact);
    }

    // Freeze the collection
    collection.lock();
    return collection;
  }
}

module.exports = DecisionFactsProjector;
