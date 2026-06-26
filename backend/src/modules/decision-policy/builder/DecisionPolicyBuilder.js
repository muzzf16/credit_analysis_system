const DecisionPolicy = require('../entities/DecisionPolicy');
const AuthorityPolicy = require('../authority/AuthorityPolicy');
const EscalationPolicy = require('../escalation/EscalationPolicy');
const OverridePolicy = require('../override/OverridePolicy');
const ConditionPolicy = require('../conditions/ConditionPolicy');
const CommitteePolicy = require('../committee/CommitteePolicy');

/**
 * DecisionPolicyBuilder
 * Orchestrates all Governance policies to wrap around the DecisionIntent.
 */
class DecisionPolicyBuilder {
  static build(assessmentContext, decisionIntent) {
    if (!assessmentContext || !decisionIntent) {
      throw new Error('DecisionPolicyBuilder requires AssessmentContext and DecisionIntent.');
    }

    const authority = AuthorityPolicy.evaluate(assessmentContext, decisionIntent);
    const escalation = EscalationPolicy.evaluate(assessmentContext, decisionIntent);
    const override = OverridePolicy.evaluate(assessmentContext, decisionIntent);
    const conditions = ConditionPolicy.evaluate(assessmentContext, decisionIntent);
    const committeeRules = CommitteePolicy.evaluate(assessmentContext, decisionIntent);

    return new DecisionPolicy({
      authority,
      escalation,
      override,
      conditions,
      committeeRules
    });
  }
}

module.exports = DecisionPolicyBuilder;
