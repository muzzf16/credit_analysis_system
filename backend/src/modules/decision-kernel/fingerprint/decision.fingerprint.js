const crypto = require('crypto');

/**
 * Compute governance-policy fingerprint from serialized policy payload.
 * @param {Object} policyPayload
 * @returns {string}
 */
function computePolicyPayloadFingerprint(policyPayload) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(policyPayload));
  return `sha256-${hash.digest('hex')}`;
}

/**
 * Decision Fingerprint — official identity of a credit decision.
 * SHA256(AssessmentFingerprint + IntentFingerprint + PolicyFingerprint + DecisionPayload)
 *
 * @param {Object} params
 * @param {string} params.assessmentFingerprint
 * @param {string} params.intentFingerprint
 * @param {string} params.policyFingerprint
 * @param {Object} params.decisionPayload - kernel body without audit.fingerprints.decision
 * @returns {string}
 */
function computeDecisionFingerprint({
  assessmentFingerprint,
  intentFingerprint,
  policyFingerprint,
  decisionPayload,
}) {
  const hash = crypto.createHash('sha256');
  hash.update(assessmentFingerprint || '');
  hash.update(intentFingerprint || '');
  hash.update(policyFingerprint || '');
  hash.update(JSON.stringify(decisionPayload));
  return `sha256-${hash.digest('hex')}`;
}

/**
 * Build the hashable decision payload (excludes self-referential decision fingerprint).
 * @param {Object} kernelData
 * @returns {Object}
 */
function buildDecisionPayload(kernelData) {
  const { audit, ...rest } = kernelData;
  const auditCopy = audit ? { ...audit, fingerprints: { ...audit.fingerprints } } : {};
  if (auditCopy.fingerprints) {
    delete auditCopy.fingerprints.decision;
  }
  return { ...rest, audit: auditCopy };
}

module.exports = {
  computeDecisionFingerprint,
  computePolicyPayloadFingerprint,
  buildDecisionPayload,
};
