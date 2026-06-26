const { instance: formulaRegistry } = require('../registry/formula.registry');

/**
 * Formula Resolver
 * 
 * Provides dependency resolution for Rules.
 * When a Rule needs to execute a formula (e.g., 'DSR'), it asks the resolver.
 */
class FormulaResolver {
  /**
   * Resolves and executes a formula by code
   * 
   * @param {string} code - The formula code (e.g., 'DSR')
   * @param {Object} input - The input parameters for the formula
   * @returns {Object} Structured formula result { code, value, unit }
   */
  static resolveAndExecute(code, input) {
    const FormulaClass = formulaRegistry.get(code);
    
    if (!FormulaClass) {
      throw new Error(`FormulaResolver: Formula [${code}] not found in registry.`);
    }

    return FormulaClass.execute(input);
  }

  /**
   * Get the metadata of a specific formula (useful for rules verifying unit compatibility)
   * @param {string} code 
   * @returns {Object} metadata
   */
  static getMetadata(code) {
    const FormulaClass = formulaRegistry.get(code);
    if (!FormulaClass) {
      throw new Error(`FormulaResolver: Formula [${code}] not found in registry.`);
    }
    return FormulaClass.metadata;
  }
}

module.exports = FormulaResolver;
