const BaseEvaluator = require('../evaluators/BaseEvaluator');

class EvaluatorRegistry {
  constructor() {
    this._evaluators = new Map();
  }

  register(EvaluatorClass) {
    if (!(EvaluatorClass.prototype instanceof BaseEvaluator) && EvaluatorClass !== BaseEvaluator) {
      throw new Error('Can only register classes that extend BaseEvaluator');
    }
    
    const { capabilityCode } = EvaluatorClass.metadata;
    if (!capabilityCode) {
      throw new Error('Evaluator metadata must contain capabilityCode');
    }
    
    if (this._evaluators.has(capabilityCode)) {
      throw new Error(`Evaluator for capability [${capabilityCode}] is already registered.`);
    }

    this._evaluators.set(capabilityCode, EvaluatorClass);
  }

  get(capabilityCode) {
    return this._evaluators.get(capabilityCode) || null;
  }

  getAll() {
    return Array.from(this._evaluators.values());
  }
}

const instance = new EvaluatorRegistry();
module.exports = {
  EvaluatorRegistry,
  instance
};
