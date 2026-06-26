const DecisionIntent = require('../entities/DecisionIntent');

/**
 * BaseIntentProjector
 * Template class for Intent Projectors.
 * Takes a DecisionFactsCollection and outputs a single DecisionIntent aggregate.
 */
class BaseIntentProjector {
  static get metadata() {
    throw new Error('Projector must define static get metadata() returning { intentCode }');
  }

  static project(decisionFactsCollection) {
    if (!decisionFactsCollection || typeof decisionFactsCollection.get !== 'function') {
      throw new Error('BaseIntentProjector: Invalid DecisionFactsCollection provided.');
    }

    const intentData = this._projectIntent(decisionFactsCollection);
    
    // Force output to be a DecisionIntent Entity
    return new DecisionIntent(intentData);
  }

  static _projectIntent(decisionFactsCollection) {
    throw new Error('Projector must implement _projectIntent(decisionFactsCollection)');
  }
}

module.exports = BaseIntentProjector;
