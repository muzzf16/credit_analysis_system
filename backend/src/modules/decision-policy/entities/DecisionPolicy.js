const OverrideDomain = require('./OverrideDomain');

/**
 * DecisionPolicy Entity
 * Represents the final Governance policy wrapped around a decision.
 */
class DecisionPolicy {
  constructor({ authority, escalation, override, conditions, committeeRules }) {
    if (!authority) {
      throw new Error('DecisionPolicy requires authority.');
    }
    if (!(override instanceof OverrideDomain)) {
      throw new Error('DecisionPolicy override must be an instance of OverrideDomain.');
    }
    if (!Array.isArray(conditions)) {
      throw new Error('DecisionPolicy conditions must be an array.');
    }

    this.authority = authority;
    this.escalation = Object.freeze({ ...escalation });
    this.override = override;
    
    // Freeze inner array
    this.conditions = Object.freeze(conditions.map(c => Object.freeze({ ...c })));
    this.committeeRules = Object.freeze({ ...committeeRules });
    
    this.timestamp = new Date().toISOString();

    Object.freeze(this);
  }
}

module.exports = DecisionPolicy;
