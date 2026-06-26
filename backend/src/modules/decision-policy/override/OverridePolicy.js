const OverrideDomain = require('../entities/OverrideDomain');

class OverridePolicy {
  static evaluate(assessmentContext, decisionIntent) {
    // In a real system, this might check the context to see if an override payload was submitted
    const manualOverride = assessmentContext.manualOverride || null;

    if (manualOverride && manualOverride.enabled) {
      return new OverrideDomain({
        enabled: true,
        approvedBy: manualOverride.approvedBy,
        reason: manualOverride.reason
      });
    }

    return new OverrideDomain({ enabled: false });
  }
}

module.exports = OverridePolicy;
