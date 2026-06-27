const PromptContext = require('../entities/PromptContext');

class PromptContextBuilder {
  static build(analysisPackage) {
    if (!analysisPackage || !analysisPackage.decisionKernel) {
      throw new Error('PromptContextBuilder requires AnalysisPackage with DecisionKernel.');
    }

    const dk = analysisPackage.decisionKernel;

    const contextData = {
      packageId: analysisPackage.packageId,
      summary: {
        decisionId: dk.decisionId,
        assessmentId: dk.assessmentId,
        recommendation: dk.recommendation?.code || dk.recommendation?.status,
        riskLevel: dk.recommendation?.riskLevel,
      },
      risk: PromptContextBuilder._buildRisk(dk),
      facts: PromptContextBuilder._sanitizeFacts(analysisPackage.factCollection),
      capabilities: PromptContextBuilder._sanitizeCapabilities(analysisPackage.capabilityCollection),
      recommendation: {
        status: dk.recommendation?.status,
        code: dk.recommendation?.code,
        riskLevel: dk.recommendation?.riskLevel,
      },
      conditions: dk.conditions || [],
      authority: {
        required: dk.authority?.required,
        resolvedBy: dk.authority?.resolvedBy,
      },
      appendix: {
        createdAt: dk.audit?.createdAt,
        manifest: dk.manifest,
      },
    };

    if (analysisPackage.factCollection?.borrower) {
      contextData.borrower = analysisPackage.factCollection.borrower;
    }

    return new PromptContext(contextData);
  }

  static _buildRisk(decisionKernel) {
    const riskLevel = decisionKernel.recommendation?.riskLevel || 'UNKNOWN';
    const factors = [];

    if (decisionKernel.override?.enabled) {
      factors.push('Override applied');
    }
    if (decisionKernel.conditions?.some?.(c => c.mandatory)) {
      factors.push('Mandatory conditions present');
    }

    return { level: riskLevel, factors };
  }

  static _sanitizeFacts(factCollection) {
    if (!factCollection || typeof factCollection.toJSON !== 'function') {
      return factCollection || {};
    }
    return factCollection.toJSON();
  }

  static _sanitizeCapabilities(capabilityCollection) {
    if (!capabilityCollection || typeof capabilityCollection.toJSON !== 'function') {
      return capabilityCollection || {};
    }
    return capabilityCollection.toJSON();
  }
}

module.exports = PromptContextBuilder;