const BaseProjector = require('./BaseProjector');

class FinancialEligibilityProjector extends BaseProjector {
  static get metadata() {
    return {
      decisionFactCode: 'FINANCIAL_ELIGIBILITY',
      version: '1.0.0'
    };
  }

  static _projectCapability(capabilityCollection) {
    // Read the Capability
    const financialCap = capabilityCollection.get('FINANCIAL');
    
    const derivedFrom = [];
    const reasonCodes = [];
    let isEligible = false;

    if (financialCap) {
      derivedFrom.push('FINANCIAL');
      
      if (financialCap.status === 'READY') {
        isEligible = true;
        reasonCodes.push('FINANCIAL_READY');
      } else {
        reasonCodes.push(`FINANCIAL_${financialCap.status}`);
      }
    } else {
      reasonCodes.push('FINANCIAL_MISSING');
    }

    return {
      code: 'FINANCIAL_ELIGIBILITY',
      value: isEligible,
      derivedFrom: derivedFrom,
      reasonCodes: reasonCodes
    };
  }
}

module.exports = FinancialEligibilityProjector;
