const DefinitionResolver = require('../resolver/definition.resolver');

/**
 * DecisionIntent Entity
 * Represents the final recommended intent of the system, before formal approval.
 */
class DecisionIntent {
  constructor({ code, recommendation, riskLevel, authority, manualReview = false, conditions = [], derivedFrom = [] }) {
    if (!code || !recommendation || !riskLevel || !authority) {
      throw new Error('DecisionIntent requires code, recommendation, riskLevel, and authority.');
    }
    
    if (!Array.isArray(conditions)) {
      throw new Error('DecisionIntent conditions must be an array.');
    }
    
    if (!Array.isArray(derivedFrom)) {
      throw new Error('DecisionIntent derivedFrom must be an array of DecisionFact codes.');
    }

    // 1. Resolve canonical definition (throws if missing)
    const definition = DefinitionResolver.resolve(code);

    // 2. Strict Constraint Validation (throws if invalid)
    definition.validateRecommendation(recommendation);
    definition.validateRiskLevel(riskLevel);

    // 3. Assignment
    this.code = code;
    this.recommendation = recommendation;
    this.riskLevel = riskLevel;
    this.authority = authority;
    this.manualReview = manualReview;
    
    // Freeze inner objects for immutability
    this.conditions = Object.freeze(conditions.map(c => Object.freeze({ ...c })));
    this.derivedFrom = Object.freeze([...derivedFrom]);
    
    this.timestamp = new Date().toISOString();

    // 4. Immutability
    Object.freeze(this);
  }
}

module.exports = DecisionIntent;
