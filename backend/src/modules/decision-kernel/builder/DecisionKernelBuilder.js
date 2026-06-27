const crypto = require('crypto');
const DecisionKernel = require('../entities/DecisionKernel');
const DecisionManifestLoader = require('../manifest/DecisionManifestLoader');
const { instance: intentDefinitionRegistry } = require('../../decision-intent/registry/definition.registry');
const {
  computeDecisionFingerprint,
  computePolicyPayloadFingerprint,
  buildDecisionPayload,
} = require('../fingerprint/decision.fingerprint');

/**
 * DecisionKernelBuilder
 * Assembles Intent + Policy into the canonical DecisionKernel aggregate root.
 */
class DecisionKernelBuilder {
  /**
   * @param {Object} assessmentContext
   * @param {import('../../decision-intent/entities/DecisionIntent')} decisionIntent
   * @param {import('../../decision-policy/entities/DecisionPolicy')} decisionPolicy
   * @param {Object} [options]
   * @param {string} [options.decisionId]
   * @param {number} [options.revision]
   * @param {string} [options.previousRevisionId]
   */
  static build(assessmentContext, decisionIntent, decisionPolicy, options = {}) {
    if (!assessmentContext || !decisionIntent || !decisionPolicy) {
      throw new Error('DecisionKernelBuilder requires AssessmentContext, DecisionIntent, and DecisionPolicy.');
    }

    const manifest = DecisionManifestLoader.load();
    const revision = options.revision || 1;
    const decisionId = options.decisionId || DecisionKernelBuilder._generateDecisionId();
    const revisionId = `${decisionId}-R${revision.toString().padStart(4, '0')}`;

    const intentPayload = DecisionKernelBuilder._serializeIntent(decisionIntent);
    const policyPayload = DecisionKernelBuilder._serializePolicy(decisionPolicy);

    const intentFingerprint = DecisionKernelBuilder._resolveIntentFingerprint(decisionIntent.code);
    const assessmentFingerprint = assessmentContext.integrity?.fingerprint
      || assessmentContext.policy?.fingerprint
      || 'unknown';
    const policyFingerprint = computePolicyPayloadFingerprint(policyPayload);

    const recommendationStatus = DecisionKernel.RECOMMENDATION_STATUS[decisionIntent.recommendation]
      || decisionIntent.recommendation;

    const conditions = DecisionKernelBuilder._mergeConditions(decisionIntent, decisionPolicy);

    const kernelBody = {
      decisionId,
      revisionId,
      revision,
      assessmentId: assessmentContext.assessmentId,
      intent: intentPayload,
      policy: policyPayload,
      recommendation: {
        status: recommendationStatus,
        code: decisionIntent.recommendation,
        riskLevel: decisionIntent.riskLevel,
      },
      authority: {
        required: decisionPolicy.authority,
        intentAuthority: decisionIntent.authority,
        resolvedBy: 'AuthorityPolicy',
        escalation: decisionPolicy.escalation,
        committeeRules: decisionPolicy.committeeRules,
      },
      conditions,
      override: {
        allowed: decisionPolicy.override.enabled === true,
        enabled: decisionPolicy.override.enabled,
        approvedBy: decisionPolicy.override.approvedBy,
        reason: decisionPolicy.override.reason,
      },
      manifest: {
        version: manifest.version,
        decisionModel: manifest.decisionModel,
        fingerprint: manifest.fingerprint,
      },
      audit: {
        fingerprints: {
          assessment: assessmentFingerprint,
          policy: policyFingerprint,
          intent: intentFingerprint,
          manifest: manifest.fingerprint,
          decision: null,
        },
        createdAt: new Date().toISOString(),
        algorithm: 'SHA-256',
      },
    };

    const decisionFingerprint = computeDecisionFingerprint({
      assessmentFingerprint,
      intentFingerprint,
      policyFingerprint,
      decisionPayload: buildDecisionPayload(kernelBody),
    });
    kernelBody.audit.fingerprints.decision = decisionFingerprint;

    return new DecisionKernel(kernelBody);
  }

  static _generateDecisionId() {
    const year = new Date().getFullYear();
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `DEC-${year}-${suffix}`;
  }

  static _serializeIntent(intent) {
    return {
      code: intent.code,
      recommendation: intent.recommendation,
      riskLevel: intent.riskLevel,
      authority: intent.authority,
      manualReview: intent.manualReview,
      conditions: [...intent.conditions],
      derivedFrom: [...intent.derivedFrom],
      timestamp: intent.timestamp,
    };
  }

  static _serializePolicy(policy) {
    return {
      authority: policy.authority,
      escalation: { ...policy.escalation },
      override: {
        enabled: policy.override.enabled,
        approvedBy: policy.override.approvedBy,
        reason: policy.override.reason,
      },
      conditions: policy.conditions.map((c) => ({ ...c })),
      committeeRules: { ...policy.committeeRules },
      timestamp: policy.timestamp,
    };
  }

  static _resolveIntentFingerprint(intentCode) {
    const def = intentDefinitionRegistry.get(intentCode);
    if (def?.fingerprint) return `sha256-${def.fingerprint}`;
    return `sha256-unknown-intent-${intentCode}`;
  }

  static _mergeConditions(intent, policy) {
    const seen = new Set();
    const merged = [];

    for (const c of [...intent.conditions, ...policy.conditions]) {
      const key = c.code || JSON.stringify(c);
      if (!seen.has(key)) {
        seen.add(key);
        merged.push({ ...c });
      }
    }
    return merged;
  }
}

module.exports = DecisionKernelBuilder;
