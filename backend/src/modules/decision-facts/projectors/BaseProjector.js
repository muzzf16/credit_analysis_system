const DecisionFact = require('../entities/DecisionFact');

/**
 * BaseProjector
 * Template class for DecisionFact Projectors.
 * Takes a CapabilityCollection and outputs a DecisionFact.
 */
class BaseProjector {
  static get metadata() {
    throw new Error('Projector must define static get metadata() returning { decisionFactCode }');
  }

  static project(capabilityCollection) {
    if (!capabilityCollection || typeof capabilityCollection.get !== 'function') {
      throw new Error('BaseProjector: Invalid CapabilityCollection provided.');
    }

    const decisionFactData = this._projectCapability(capabilityCollection);
    
    // Force output to be a DecisionFact Entity
    return new DecisionFact(decisionFactData);
  }

  static _projectCapability(capabilityCollection) {
    throw new Error('Projector must implement _projectCapability(capabilityCollection)');
  }
}

module.exports = BaseProjector;
