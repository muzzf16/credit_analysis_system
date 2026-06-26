const BaseStage = require('../BaseStage');

/**
 * Financial Stage
 * 
 * Orchestrates financial rules like DSR_MAX, RPC_MIN, DSCR_MIN, etc.
 * Uses default strict aggregation (all rules must pass).
 */
class FinancialStage extends BaseStage {
  static get metadata() {
    return {
      code: 'FINANCIAL',
      category: 'ASSESSMENT',
      version: '1.0.0'
    };
  }

  // Inherits default _aggregate: 100 if all pass, 0 if any fail.
  // We can override here if we want a custom scoring model later.
}

module.exports = FinancialStage;
