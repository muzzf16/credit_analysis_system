class ReadinessEngine {
  /**
   * Evaluates if the entity is ready for the Credit Decision Platform
   * @param {Object} entity - The business entity state
   * @param {Function} readinessPolicy - Pure function defining readiness rules
   * @returns {Object} Readiness status map
   */
  static evaluate(entity, readinessPolicy) {
    if (typeof readinessPolicy !== 'function') {
      throw new Error('Readiness policy must be a function');
    }
    return readinessPolicy(entity);
  }
}

module.exports = ReadinessEngine;
