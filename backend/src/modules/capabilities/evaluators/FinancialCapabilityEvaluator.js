const BaseEvaluator = require('./BaseEvaluator');

class FinancialCapabilityEvaluator extends BaseEvaluator {
  static get metadata() {
    return {
      capabilityCode: 'FINANCIAL',
      version: '1.0.0'
    };
  }

  static _evaluateFacts(factCollection) {
    // Look for the specific facts we care about
    const financialCapacityFact = factCollection.get('FINANCIAL_CAPACITY');
    
    const derivedFrom = [];
    let status = 'UNKNOWN';

    if (financialCapacityFact) {
      derivedFrom.push('FINANCIAL_CAPACITY');
      
      if (financialCapacityFact.value === 'ADEQUATE') {
        status = 'READY';
      } else if (financialCapacityFact.value === 'LIMITED') {
        status = 'LIMITED';
      } else if (financialCapacityFact.value === 'INADEQUATE') {
        status = 'INADEQUATE';
      }
    }

    return {
      code: 'FINANCIAL',
      status: status,
      confidence: 100,
      derivedFrom: derivedFrom
    };
  }
}

module.exports = FinancialCapabilityEvaluator;
