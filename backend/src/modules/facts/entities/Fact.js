const DefinitionResolver = require('../resolver/definition.resolver');

/**
 * Fact Entity
 * Represents a single Business Fact translated from raw execution outputs.
 * 
 * A Fact cannot exist if its value violates its corresponding FactDefinition.
 */
class Fact {
  constructor({ code, value, source, confidence = 100, evidence = [] }) {
    if (!code || value === undefined || !source) {
      throw new Error('Fact requires code, value, and source.');
    }

    // 1. Resolve canonical definition (throws if missing)
    const definition = DefinitionResolver.resolve(code);

    // 2. Strict Type & Constraint Validation (throws if invalid)
    definition.validateValue(value);

    // 3. Assignment
    this.code = code;
    this.value = value;
    this.source = source;
    this.confidence = confidence;
    this.evidence = Object.freeze([...evidence]);
    this.timestamp = new Date().toISOString();

    // 4. Immutability
    Object.freeze(this);
  }
}

module.exports = Fact;
