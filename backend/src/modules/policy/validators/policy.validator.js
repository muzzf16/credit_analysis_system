const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

// Initialize schema validator
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const schemaPath = path.join(__dirname, '../schemas/policy-pack.schema.json');
const schemaData = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const validateSchema = ajv.compile(schemaData);

/**
 * PolicyValidator - Validates policies against schema and checks compatibility.
 */
class PolicyValidator {
  
  /**
   * Validates policy data against the JSON Schema
   * @param {Object} policyData
   * @returns {{valid: boolean, errors: string[]}}
   */
  static validateSchema(policyData) {
    const valid = validateSchema(policyData);
    if (!valid) {
      const errors = validateSchema.errors.map(e => `${e.instancePath} ${e.message}`);
      return { valid: false, errors };
    }
    return { valid: true, errors: [] };
  }

  /**
   * Validates that all rules referenced in the policy exist in the rule library.
   * Ensures we don't activate a policy with undefined rules.
   * 
   * @param {Object} policyData - The policy pack data
   * @param {Object} ruleLibrary - The mock or real rule library index
   * @returns {{valid: boolean, missingRules: string[]}}
   */
  static validateCompatibility(policyData, ruleLibrary) {
    if (!policyData.rules || !Array.isArray(policyData.rules)) {
      return { valid: false, missingRules: [] };
    }

    const missingRules = [];
    
    for (const rule of policyData.rules) {
      if (!ruleLibrary[rule.code]) {
        missingRules.push(rule.code);
      }
    }

    return {
      valid: missingRules.length === 0,
      missingRules
    };
  }
}

module.exports = PolicyValidator;
