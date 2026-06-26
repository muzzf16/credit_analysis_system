const DecisionFact = require('./DecisionFact');

/**
 * DecisionFactsCollection
 * A container holding multiple DecisionFacts. 
 * Allows retrieval and ensures immutability once built.
 */
class DecisionFactsCollection {
  constructor() {
    this._facts = new Map();
    this._locked = false;
  }

  add(decisionFact) {
    if (this._locked) {
      throw new Error('Cannot add to a locked DecisionFactsCollection');
    }
    if (!(decisionFact instanceof DecisionFact)) {
      throw new Error('Can only add instances of DecisionFact');
    }
    this._facts.set(decisionFact.code, decisionFact);
  }

  get(code) {
    return this._facts.get(code) || null;
  }

  getAll() {
    return Array.from(this._facts.values());
  }

  lock() {
    this._locked = true;
    Object.freeze(this._facts);
    Object.freeze(this);
  }

  toJSON() {
    const output = {};
    for (const [code, fact] of this._facts.entries()) {
      output[code] = fact.value; // For AI and Builder to easily read
    }
    return output;
  }
  
  toVerboseJSON() {
    return this.getAll();
  }
}

module.exports = DecisionFactsCollection;
