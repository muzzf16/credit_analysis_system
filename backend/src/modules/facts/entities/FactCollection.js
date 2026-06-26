const Fact = require('./Fact');

/**
 * FactCollection
 * A container holding multiple Facts. 
 * Allows retrieval and aggregation, and ensures immutability once built.
 */
class FactCollection {
  constructor() {
    this._facts = new Map(); // code -> Fact
    this._locked = false;
  }

  /**
   * Add a Fact to the collection.
   * If a fact with the same code exists, it resolves conflicts based on confidence or source.
   * Currently, we just overwrite for simplicity, but real business logic would decide.
   * @param {Fact} fact 
   */
  add(fact) {
    if (this._locked) {
      throw new Error('Cannot add to a locked FactCollection');
    }
    if (!(fact instanceof Fact)) {
      throw new Error('Can only add instances of Fact');
    }
    this._facts.set(fact.code, fact);
  }

  addMany(factsArray) {
    for (const f of factsArray) {
      this.add(f);
    }
  }

  get(code) {
    return this._facts.get(code) || null;
  }

  getAll() {
    return Array.from(this._facts.values());
  }

  /**
   * Freezes the collection so no more facts can be added.
   */
  lock() {
    this._locked = true;
    Object.freeze(this._facts);
    Object.freeze(this);
  }

  toJSON() {
    return this.getAll();
  }
}

module.exports = FactCollection;
