const BaseFormula = require('../BaseFormula');

/**
 * Repayment Capacity (RPC) Formula
 * 
 * Computes: (Net Income / Total Installment) * 100
 */
class RPCFormula extends BaseFormula {
  static get metadata() {
    return {
      code: 'RPC',
      version: '1.0.0',
      unit: 'PERCENT',
      precision: 2
    };
  }

  static _compute(input) {
    const { income = 0, installment = 0 } = input;
    
    if (installment <= 0) {
      return 999; // Return a high value if no installment
    }

    return (income / installment) * 100;
  }
}

module.exports = RPCFormula;
