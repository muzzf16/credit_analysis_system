class ConditionPolicy {
  static evaluate(assessmentContext, decisionIntent) {
    // Copies conditions recommended by the Intent, 
    // and can inject additional policy-level conditions (e.g. standard admin fees)
    const conditions = [...(decisionIntent.conditions || [])];
    
    // Example: Standard policy condition for all approvals
    if (decisionIntent.recommendation.startsWith('APPROVE')) {
      conditions.push({
        code: 'STANDARD_ADMIN_FEE',
        severity: 'MANDATORY',
        source: 'GLOBAL_POLICY',
        description: 'Potong biaya admin 1% dari pencairan.'
      });
    }

    return conditions;
  }
}

module.exports = ConditionPolicy;
