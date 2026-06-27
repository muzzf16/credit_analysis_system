const {
  computeDecisionFingerprint,
  computePolicyPayloadFingerprint,
  buildDecisionPayload,
} = require('../fingerprint/decision.fingerprint');

/**
 * DecisionIntegrityService
 *
 * Separates fingerprint computation from integrity validation.
 * Future: signature verification, hash comparison, audit verification.
 */
class DecisionIntegrityService {
  /**
   * Verify that a kernel's decision fingerprint matches its payload.
   * @param {import('../entities/DecisionKernel')} kernel
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static verifyKernel(kernel) {
    const errors = [];
    const data = kernel.toJSON();
    const { fingerprints } = data.audit;

    if (!fingerprints.assessment) errors.push('Missing assessment fingerprint');
    if (!fingerprints.intent) errors.push('Missing intent fingerprint');
    if (!fingerprints.policy) errors.push('Missing policy fingerprint');
    if (!fingerprints.decision) errors.push('Missing decision fingerprint');

    const payload = buildDecisionPayload(data);
    const expected = computeDecisionFingerprint({
      assessmentFingerprint: fingerprints.assessment,
      intentFingerprint: fingerprints.intent,
      policyFingerprint: fingerprints.policy,
      decisionPayload: payload,
    });

    if (fingerprints.decision !== expected) {
      errors.push('Decision fingerprint mismatch — kernel may have been tampered with');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Verify policy payload fingerprint embedded in audit trail.
   * @param {Object} policyPayload
   * @param {string} expectedFingerprint
   */
  static verifyPolicyFingerprint(policyPayload, expectedFingerprint) {
    const computed = computePolicyPayloadFingerprint(policyPayload);
    return {
      valid: computed === expectedFingerprint,
      expected: expectedFingerprint,
      computed,
    };
  }

  /**
   * Compare two assessment fingerprints for revision lineage integrity.
   */
  static verifyAssessmentLineage(previousFingerprint, currentFingerprint, allowChange = true) {
    if (!allowChange && previousFingerprint !== currentFingerprint) {
      return { valid: false, reason: 'Assessment fingerprint changed without authorized revision' };
    }
    return { valid: true };
  }
}

module.exports = DecisionIntegrityService;
