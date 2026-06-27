const crypto = require('crypto');
const AnalysisPackage = require('../entities/AnalysisPackage');

class AnalysisPackageBuilder {
  static build({ decisionKernel, factCollection, capabilityCollection }) {
    if (!decisionKernel || !factCollection || !capabilityCollection) {
      throw new Error('AnalysisPackageBuilder requires decisionKernel, factCollection, and capabilityCollection.');
    }

    const packageId = `PKG-${decisionKernel.decisionId}`;
    const version = '1.0.0';
    const createdAt = new Date().toISOString();

    const packageData = {
      packageId,
      assessmentId: decisionKernel.assessmentId,
      decisionKernel: decisionKernel.toJSON(),
      factCollection: factCollection.toJSON ? factCollection.toJSON() : factCollection,
      capabilityCollection: capabilityCollection.toJSON ? capabilityCollection.toJSON() : capabilityCollection,
      intent: decisionKernel.intent,
      policy: decisionKernel.policy,
      version,
      createdAt,
    };

    packageData.fingerprint = AnalysisPackage.computeFingerprint(packageData);

    return new AnalysisPackage(packageData);
  }
}

module.exports = AnalysisPackageBuilder;