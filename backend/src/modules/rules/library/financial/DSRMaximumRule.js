const BaseRule = require('../BaseRule');
const FormulaResolver = require('../../resolver/formula.resolver');

/**
 * DSRMaximumRule
 * 
 * Evaluates whether the applicant's Debt Service Ratio exceeds the maximum allowed by policy.
 */
class DSRMaximumRule extends BaseRule {
  static get metadata() {
    return {
      code: 'DSR_MAX',
      category: 'FINANCIAL',
      version: '1.0.0',
      severity: 'HIGH',
      dependsOn: ['DSR'] // Explictly declares dependency on DSR Formula
    };
  }

  static _evaluate(context) {
    const { assessment, stageProfile } = context;

    // Extract inputs from assessment
    const income = assessment.income || 0;
    const installment = assessment.installment || 0;

    // 1. Resolve and execute formula
    const dsrFormulaResult = FormulaResolver.resolveAndExecute('DSR', { income, installment });

    // 2. Get rule parameters from stageProfile
    const ruleConfig = (stageProfile.rules || []).find(r => r.code === 'DSR_MAX');
    const maxThreshold = ruleConfig?.parameters?.threshold || 0.40; // Default 40%

    
    // threshold is usually ratio (0.4), DSR formula returns PERCENT (40.0)
    // So we align them.
    const maxDsrPercent = maxThreshold * 100;
    
    // 3. Evaluate Business Rule
    const passed = dsrFormulaResult.value <= maxDsrPercent;
    
    // 4. Generate Reason Codes
    const reasonCodes = [];
    if (passed) {
      reasonCodes.push('DSR_OK');
    } else {
      reasonCodes.push('DSR_TOO_HIGH');
    }

    // 5. Return inner evaluation structure
    return {
      passed,
      metrics: [
        { code: 'DSR', value: dsrFormulaResult.value }
      ],
      reasonCodes
    };
  }
}

module.exports = DSRMaximumRule;
