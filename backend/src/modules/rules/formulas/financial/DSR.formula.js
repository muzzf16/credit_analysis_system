const BaseFormula = require('../BaseFormula');

/**
 * Debt Service Ratio (DSR) Formula
 * 
 * Computes: (Total Installment / Net Income) * 100
 */
class DSRFormula extends BaseFormula {
  static get metadata() {
    return {
      code: 'DSR',
      version: '1.0.0',
      unit: 'PERCENT',
      precision: 2
    };
  }

  static _compute(input) {
    const { installment = 0, income = 0 } = input;
    
    if (income <= 0) {
      return 0; // Or throw depending on business policy, but usually 0 or Infinity. Returning 0 is safer for calculation.
    }

    return (installment / income) * 100;
  }
}

module.exports = DSRFormula;
