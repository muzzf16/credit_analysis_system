/**
 * Formula Registry
 * 
 * Central registry holding all valid, loaded formulas.
 * Dashboard or other systems can query this to extract documentation/metadata automatically.
 */
class FormulaRegistry {
  constructor() {
    this._formulas = new Map(); // code -> Formula Class
  }

  /**
   * Register a Formula class
   * @param {class} FormulaClass (Extending BaseFormula)
   */
  register(FormulaClass) {
    // Enforce contract validation before allowing into the registry
    if (typeof FormulaClass.validateContract !== 'function') {
      throw new Error(`Formula [${FormulaClass.name}] does not extend BaseFormula`);
    }

    FormulaClass.validateContract();

    const code = FormulaClass.metadata.code;
    if (this._formulas.has(code)) {
      throw new Error(`Formula with code [${code}] is already registered.`);
    }

    this._formulas.set(code, FormulaClass);
  }

  /**
   * Retrieve a Formula class by its code
   * @param {string} code 
   * @returns {class} FormulaClass
   */
  get(code) {
    return this._formulas.get(code) || null;
  }

  /**
   * Export all metadata for Dashboard / Documentation
   * @returns {Object[]} Array of metadata objects
   */
  exportMetadata() {
    return Array.from(this._formulas.values()).map(F => F.metadata);
  }
}

// Singleton for easy access, but can be instantiated for tests
const instance = new FormulaRegistry();
module.exports = {
  FormulaRegistry,
  instance
};
