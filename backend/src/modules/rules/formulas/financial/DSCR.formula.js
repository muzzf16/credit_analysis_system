const BaseFormula = require('../BaseFormula');

/**
 * Debt Service Coverage Ratio (DSCR) Formula
 * 
 * Computes: Net Operating Income / Total Debt Service
 */
class DSCRFormula extends BaseFormula {
  static get metadata() {
    return {
      code: 'DSCR',
      version: '1.0.0',
      unit: 'RATIO',
      precision: 2
    };
  }

  static _compute(input) {
    const { operatingIncome = 0, debtService = 0 } = input;
    
    if (debtService <= 0) {
      return 999; 
    }

    return operatingIncome / debtService;
  }
}

module.exports = DSCRFormula;
