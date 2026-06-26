const { instance: projectorRegistry } = require('../registry/projector.registry');

/**
 * DecisionIntentBuilder
 * Delegates to a specified projector to convert a DecisionFactsCollection into a single DecisionIntent.
 */
class DecisionIntentBuilder {
  /**
   * Build a DecisionIntent from a DecisionFactsCollection using the specified intentCode
   * @param {string} intentCode 
   * @param {Object} decisionFactsCollection 
   * @returns {DecisionIntent}
   */
  static build(intentCode, decisionFactsCollection) {
    if (!decisionFactsCollection || typeof decisionFactsCollection.getAll !== 'function') {
      throw new Error('DecisionIntentBuilder: Invalid DecisionFactsCollection.');
    }

    const ProjectorClass = projectorRegistry.get(intentCode);
    if (!ProjectorClass) {
      throw new Error(`DecisionIntentBuilder: No projector found for intentCode [${intentCode}]`);
    }

    return ProjectorClass.project(decisionFactsCollection);
  }
}

module.exports = DecisionIntentBuilder;
