const { instance: ruleRegistry } = require('../registry/rule.registry');

/**
 * Rule Resolver
 * 
 * Responsible for finding a Rule implementation based on its code.
 */
class RuleResolver {
  /**
   * Resolves a Rule Class by code
   * 
   * @param {string} code - The rule code (e.g., 'DSR_MAX')
   * @returns {class} The Rule Class extending BaseRule
   */
  static resolve(code) {
    const RuleClass = ruleRegistry.get(code);
    
    if (!RuleClass) {
      throw new Error(`RuleResolver: Rule [${code}] not found in registry.`);
    }

    return RuleClass;
  }
}

module.exports = RuleResolver;
