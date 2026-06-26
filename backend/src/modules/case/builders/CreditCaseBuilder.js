const crypto = require('crypto');

class CreditCaseBuilder {
  constructor(caseId, previousRevision = 0) {
    this.state = {
      caseId: caseId || `CASE-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      revision: previousRevision + 1,
      revisionId: null, // will be generated upon build
      data: {
        application: null,
        debitur: null,
        agunan: [],
        creditExposure: null
      },
      sources: {},
      provenance: {},
      quality: {},
      trace: {
        applicationId: null,
        pipelineFingerprint: null,
        builderVersion: '1.0.0',
        createdFromEvents: []
      },
      integrity: {
        hash: null,
        algorithm: 'SHA-256'
      }
    };
  }

  setApplication(applicationData, applicationId) {
    this.state.data.application = applicationData;
    this.state.trace.applicationId = applicationId;
    return this;
  }

  setDebitur(debiturData, sourceMap, provenanceMap, qualityScore) {
    this.state.data.debitur = debiturData;
    this._mergeSources(sourceMap);
    this._mergeProvenance(provenanceMap);
    if (qualityScore) this.state.quality.identity = qualityScore;
    return this;
  }

  addAgunan(agunanData, sourceMap, provenanceMap, qualityScore) {
    this.state.data.agunan.push(agunanData);
    this._mergeSources(sourceMap);
    this._mergeProvenance(provenanceMap);
    if (qualityScore) {
      const index = this.state.data.agunan.length - 1;
      this.state.quality[`agunan[${index}]`] = qualityScore;
    }
    return this;
  }

  setCreditExposure(exposureData, sourceMap, provenanceMap, qualityScore) {
    this.state.data.creditExposure = exposureData;
    this._mergeSources(sourceMap);
    this._mergeProvenance(provenanceMap);
    if (qualityScore) this.state.quality.creditExposure = qualityScore;
    return this;
  }

  addTraceEvent(eventName) {
    if (!this.state.trace.createdFromEvents.includes(eventName)) {
      this.state.trace.createdFromEvents.push(eventName);
    }
    return this;
  }

  setPipelineFingerprint(fingerprint) {
    this.state.trace.pipelineFingerprint = fingerprint;
    return this;
  }

  _mergeSources(sourceMap) {
    if (sourceMap) {
      Object.assign(this.state.sources, sourceMap);
    }
  }

  _mergeProvenance(provenanceMap) {
    if (provenanceMap) {
      Object.assign(this.state.provenance, provenanceMap);
    }
  }

  _computeHash(payload) {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(payload));
    return hash.digest('hex');
  }

  build() {
    if (!this.state.data.application) {
      throw new Error('Application data is required to build a CreditCase');
    }

    // Set Revision ID
    this.state.revisionId = `${this.state.caseId}-R${this.state.revision.toString().padStart(4, '0')}`;

    // Compute payload without integrity block
    const payloadToHash = {
      caseId: this.state.caseId,
      revisionId: this.state.revisionId,
      revision: this.state.revision,
      data: this.state.data,
      sources: this.state.sources,
      provenance: this.state.provenance,
      quality: this.state.quality,
      trace: this.state.trace
    };

    this.state.integrity.hash = `sha256-${this._computeHash(payloadToHash)}`;

    return JSON.parse(JSON.stringify(this.state));
  }
}

module.exports = CreditCaseBuilder;
