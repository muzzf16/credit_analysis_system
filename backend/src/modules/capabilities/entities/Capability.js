const DefinitionResolver = require('../resolver/definition.resolver');

/**
 * Capability Entity
 * Represents a Business Capability translated from a collection of Facts.
 * 
 * A Capability cannot exist if its status violates its corresponding CapabilityDefinition.
 */
class Capability {
  constructor({ code, status, confidence = 100, derivedFrom = [] }) {
    if (!code || !status) {
      throw new Error('Capability requires code and status.');
    }
    if (!Array.isArray(derivedFrom)) {
      throw new Error('Capability derivedFrom must be an array of Fact codes.');
    }

    // 1. Resolve canonical definition (throws if missing)
    const definition = DefinitionResolver.resolve(code);

    // 2. Strict Status Validation (throws if invalid)
    definition.validateStatus(status);

    // 3. Assignment
    this.code = code;
    this.status = status;
    this.confidence = confidence;
    this.derivedFrom = Object.freeze([...derivedFrom]);
    this.timestamp = new Date().toISOString();

    // 4. Immutability
    Object.freeze(this);
  }
}

module.exports = Capability;
