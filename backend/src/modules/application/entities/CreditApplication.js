const crypto = require('crypto');

class CreditApplicationBuilder {
  constructor() {
    this.application = {
      applicationId: null,
      product: null,
      status: 'DATA_COLLECTION',
      ao: null,
      submittedAt: null,
      metadata: {
        createdAt: new Date().toISOString(),
        createdBy: 'SYSTEM',
        source: 'NEW_APPLICATION',
        version: '1.0'
      }
    };
  }

  setApplicationId(id) {
    this.application.applicationId = id;
    return this;
  }

  generateApplicationId(prefix = 'PK') {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const year = new Date().getFullYear();
    this.application.applicationId = `${prefix}-${year}-${randomHex}`;
    return this;
  }

  setProduct(productStr) {
    this.application.product = productStr;
    return this;
  }

  setStatus(statusStr) {
    this.application.status = statusStr;
    return this;
  }

  setAccountOfficer(aoId) {
    this.application.ao = aoId;
    return this;
  }

  setSubmittedAt(isoDateString) {
    this.application.submittedAt = isoDateString || new Date().toISOString();
    return this;
  }

  setMetadata(metadataObj) {
    this.application.metadata = { ...this.application.metadata, ...metadataObj };
    return this;
  }

  build() {
    // Return a deep copy to ensure immutability
    return JSON.parse(JSON.stringify(this.application));
  }
}

module.exports = CreditApplicationBuilder;
