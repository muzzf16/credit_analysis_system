const BaseIntentProjector = require('./BaseIntentProjector');

class StandardIntentProjector extends BaseIntentProjector {
  static get metadata() {
    return {
      intentCode: 'STANDARD_INTENT',
      version: '1.0.0'
    };
  }

  static _projectIntent(decisionFactsCollection) {
    // Read the Facts
    const financialEligible = decisionFactsCollection.get('FINANCIAL_ELIGIBILITY');
    
    const derivedFrom = [];
    if (financialEligible) derivedFrom.push('FINANCIAL_ELIGIBILITY');

    const conditions = [];
    let recommendation = 'MANUAL_REVIEW';
    let riskLevel = 'MEDIUM';
    let manualReview = true;
    let authority = 'KOMITE_CABANG'; // Default

    // Simple deterministic projection
    if (financialEligible && financialEligible.value === true) {
      recommendation = 'APPROVE';
      riskLevel = 'LOW';
      manualReview = false;
    } else if (financialEligible && financialEligible.value === false) {
      recommendation = 'APPROVE_WITH_CONDITION';
      riskLevel = 'MEDIUM';
      manualReview = true;
      conditions.push({
        code: 'FINANCIAL_REVIEW_REQUIRED',
        severity: 'MANDATORY',
        source: 'FINANCIAL_POLICY',
        description: 'Debitur tidak memenuhi syarat finansial otomatis, wajib review komite.'
      });
    }

    return {
      code: 'STANDARD_INTENT',
      recommendation,
      riskLevel,
      authority,
      manualReview,
      conditions,
      derivedFrom
    };
  }
}

module.exports = StandardIntentProjector;
