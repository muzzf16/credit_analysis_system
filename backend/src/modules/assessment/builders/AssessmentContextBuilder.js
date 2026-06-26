const crypto = require('crypto');

class AssessmentContextBuilder {
  constructor(assessmentId, previousVersion = 0) {
    this.state = {
      assessmentId: assessmentId || `ASM-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      assessmentVersion: previousVersion + 1,
      applicationId: null,
      caseRevisionId: null,
      scope: {
        purpose: 'NEW_LOAN',
        product: null,
        simulation: false
      },
      policy: {
        pack: null,
        version: null,
        fingerprint: null
      },
      quality: {
        completeness: 0,
        readiness: {
          readyForScoring: false,
          readyForCommittee: false
        },
        capabilities: {}
      },
      assumptions: [],
      constraints: [],
      caseSnapshot: null,
      integrity: {
        fingerprint: null,
        algorithm: 'SHA-256'
      }
    };
  }

  setCreditCase(creditCase) {
    if (!creditCase || !creditCase.revisionId) throw new Error('Valid CreditCase is required');
    this.state.caseRevisionId = creditCase.revisionId;
    this.state.applicationId = creditCase.data?.application?.applicationId || 'UNKNOWN';
    // Freeze the snapshot
    this.state.caseSnapshot = JSON.parse(JSON.stringify(creditCase));
    return this;
  }

  setScope(purpose, product, isSimulation = false) {
    this.state.scope.purpose = purpose;
    this.state.scope.product = product;
    this.state.scope.simulation = isSimulation;
    return this;
  }

  setPolicy(pack, version, fingerprint) {
    this.state.policy.pack = pack;
    this.state.policy.version = version;
    this.state.policy.fingerprint = fingerprint;
    return this;
  }

  setQuality(completeness, readiness, capabilities) {
    this.state.quality.completeness = completeness;
    this.state.quality.readiness = readiness;
    this.state.quality.capabilities = capabilities;
    return this;
  }

  addAssumption(code, description) {
    this.state.assumptions.push({ code, description });
    return this;
  }

  addConstraint(constraintCode) {
    this.state.constraints.push(constraintCode);
    return this;
  }

  _computeFingerprint(payload) {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(payload));
    return hash.digest('hex');
  }

  build() {
    if (!this.state.caseSnapshot) throw new Error('Case snapshot is missing');
    if (!this.state.policy.pack) throw new Error('Policy information is missing');

    const payloadToHash = {
      assessmentId: this.state.assessmentId,
      assessmentVersion: this.state.assessmentVersion,
      applicationId: this.state.applicationId,
      caseRevisionId: this.state.caseRevisionId,
      scope: this.state.scope,
      policy: this.state.policy,
      quality: this.state.quality,
      assumptions: this.state.assumptions,
      constraints: this.state.constraints,
      caseSnapshot: this.state.caseSnapshot
    };

    this.state.integrity.fingerprint = `sha256-${this._computeFingerprint(payloadToHash)}`;

    return JSON.parse(JSON.stringify(this.state));
  }
}

module.exports = AssessmentContextBuilder;
