const BaseFormula = require('../BaseFormula');

/**
 * Loan to Value (LTV) Formula
 * 
 * Computes: (Loan Amount / Collateral Value) * 100
 */
class LTVFormula extends BaseFormula {
  static get metadata() {
    return {
      code: 'LTV',
      version: '1.0.0',
      unit: 'PERCENT',
      precision: 2
    };
  }

  static _compute(input) {
    const { loanAmount = 0, collateralValue = 0 } = input;
    
    if (collateralValue <= 0) {
      return 999; 
    }

    return (loanAmount / collateralValue) * 100;
  }
}

module.exports = LTVFormula;
