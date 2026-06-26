class CompletenessEngine {
  /**
   * Evaluates the completeness of an entity by running its corresponding policy.
   * @param {Object} entity - The business entity state
   * @param {Function} completenessPolicy - Pure function defining the policy
   * @returns {Object} { completeness: number, missing: string[] }
   */
  static evaluate(entity, completenessPolicy) {
    if (typeof completenessPolicy !== 'function') {
      throw new Error('Completeness policy must be a function');
    }
    return completenessPolicy(entity);
  }
}

module.exports = CompletenessEngine;
