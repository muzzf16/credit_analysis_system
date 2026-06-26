class EscalationPolicy {
  static evaluate(assessmentContext, decisionIntent) {
    // Basic escalation rule: if business is < 2 years old, escalate
    const businessAgeYears = assessmentContext.businessAgeYears || 0;
    
    if (businessAgeYears < 2) {
      return {
        escalated: true,
        reason: 'Usaha < 2 tahun'
      };
    }

    return {
      escalated: false,
      reason: null
    };
  }
}

module.exports = EscalationPolicy;
