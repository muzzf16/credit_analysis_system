class CapabilityEngine {
  /**
   * Evaluates the workflow capabilities of an entity (e.g., READY, MISSING, INCOMPLETE)
   * @param {Object} entity - The business entity state
   * @param {Function} capabilityPolicy - Pure function defining capability status
   * @returns {Object} Capability status map
   */
  static evaluate(entity, capabilityPolicy) {
    if (typeof capabilityPolicy !== 'function') {
      throw new Error('Capability policy must be a function');
    }
    return capabilityPolicy(entity);
  }
}

module.exports = CapabilityEngine;
