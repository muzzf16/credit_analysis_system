const DefinitionResolver = require('../resolver/definition.resolver');

/**
 * DecisionFact Entity
 * Represents a final variable ready for Decision Builder rules.
 */
class DecisionFact {
  constructor({ code, value, derivedFrom = [], reasonCodes = [] }) {
    if (!code || value === undefined || value === null) {
      throw new Error('DecisionFact requires code and value.');
    }
    if (!Array.isArray(derivedFrom)) {
      throw new Error('DecisionFact derivedFrom must be an array of Capability codes.');
    }
    if (!Array.isArray(reasonCodes)) {
      throw new Error('DecisionFact reasonCodes must be an array.');
    }

    // 1. Resolve canonical definition (throws if missing)
    const definition = DefinitionResolver.resolve(code);

    // 2. Strict Type Validation (throws if invalid)
    definition.validateValue(value);

    // 3. Assignment
    this.code = code;
    this.value = value;
    this.derivedFrom = Object.freeze([...derivedFrom]);
    this.reasonCodes = Object.freeze([...reasonCodes]);
    this.timestamp = new Date().toISOString();

    // 4. Immutability
    Object.freeze(this);
  }
}

module.exports = DecisionFact;
