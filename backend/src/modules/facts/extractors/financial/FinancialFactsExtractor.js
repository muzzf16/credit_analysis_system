const BaseExtractor = require('../BaseExtractor');

class FinancialFactsExtractor extends BaseExtractor {
  static get metadata() {
    return {
      stage: 'FINANCIAL',
      version: '1.0.0'
    };
  }

  static _extractFacts(stageResult) {
    // 1. Evaluate Financial Capacity based on Stage Status and Score
    // In a real scenario, this might look at specific reasonCodes (e.g. DSR_TOO_HIGH).
    
    let capacityValue = 'INADEQUATE';

    if (stageResult.status === 'PASSED') {
      capacityValue = 'ADEQUATE';
    } else if (stageResult.status === 'WARNING') {
      capacityValue = 'LIMITED';
    }

    return [
      {
        code: 'FINANCIAL_CAPACITY',
        value: capacityValue,
        confidence: 100,
        evidence: stageResult.reasonCodes // Store reasons as evidence
      }
    ];
  }
}

module.exports = FinancialFactsExtractor;
