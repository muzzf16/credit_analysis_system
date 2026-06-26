const Capability = require('../entities/Capability');

/**
 * BaseEvaluator
 * Template class for Capability Evaluators.
 * Takes a FactCollection and outputs a Capability.
 */
class BaseEvaluator {
  static get metadata() {
    throw new Error('Evaluator must define static get metadata() returning { capabilityCode }');
  }

  static evaluate(factCollection) {
    if (!factCollection || typeof factCollection.get !== 'function') {
      throw new Error('BaseEvaluator: Invalid FactCollection provided.');
    }

    const capabilityData = this._evaluateFacts(factCollection);
    
    // Force output to be a Capability Entity
    return new Capability(capabilityData);
  }

  static _evaluateFacts(factCollection) {
    throw new Error('Evaluator must implement _evaluateFacts(factCollection)');
  }
}

module.exports = BaseEvaluator;
