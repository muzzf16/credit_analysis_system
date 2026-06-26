/**
 * Rule Registry
 * 
 * Central registry holding all valid, loaded business rules.
 */
class RuleRegistry {
  constructor() {
    this._rules = new Map(); // code -> Rule Class
  }

  /**
   * Register a Rule class
   * @param {class} RuleClass (Extending BaseRule)
   */
  register(RuleClass) {
    // Enforce contract validation before allowing into the registry
    if (typeof RuleClass.validateContract !== 'function') {
      throw new Error(`Rule [${RuleClass.name}] does not extend BaseRule`);
    }

    RuleClass.validateContract();

    const code = RuleClass.metadata.code;
    if (this._rules.has(code)) {
      throw new Error(`Rule with code [${code}] is already registered.`);
    }

    this._rules.set(code, RuleClass);
  }

  /**
   * Retrieve a Rule class by its code
   * @param {string} code 
   * @returns {class} RuleClass
   */
  get(code) {
    return this._rules.get(code) || null;
  }

  /**
   * Export all metadata for Dashboard / Documentation
   * @returns {Object[]} Array of metadata objects
   */
  exportMetadata() {
    return Array.from(this._rules.values()).map(R => R.metadata);
  }
}

// Singleton for easy access
const instance = new RuleRegistry();
module.exports = {
  RuleRegistry,
  instance
};
