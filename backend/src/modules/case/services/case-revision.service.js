const CreditCaseBuilder = require('../builders/CreditCaseBuilder');
const { createCaseEvent, CaseEvents } = require('../events/case.events');

class CaseRevisionService {
  /**
   * Generates a new CreditCase revision from previous state and new data updates
   * @param {Object} previousCase - The previous CreditCase projection (can be null for V1)
   * @param {Object} updates - The new domains to project
   * @param {string} pipelineFingerprint - Hash of the execution pipeline
   * @param {Array} triggerEvents - The business events that triggered this projection
   * @returns {Object} result containing the new CreditCase and the generated event
   */
  static generateRevision(previousCase, updates, pipelineFingerprint, triggerEvents = []) {
    const caseId = previousCase ? previousCase.caseId : null;
    const revision = previousCase ? previousCase.revision : 0;
    
    const builder = new CreditCaseBuilder(caseId, revision);
    builder.setPipelineFingerprint(pipelineFingerprint);
    
    triggerEvents.forEach(e => builder.addTraceEvent(e));

    // Carry over application (immutable)
    const application = updates.application || (previousCase && previousCase.data.application);
    if (application) {
      builder.setApplication(application, application.applicationId);
    }

    // Process Debitur update
    if (updates.debiturData) {
      builder.setDebitur(
        updates.debiturData, 
        updates.debiturSources, 
        updates.debiturProvenance, 
        updates.debiturQuality
      );
    } else if (previousCase && previousCase.data.debitur) {
      // Carry over previous
      const src = Object.keys(previousCase.sources)
        .filter(k => k.startsWith('debitur.'))
        .reduce((res, key) => ({ ...res, [key]: previousCase.sources[key] }), {});
      
      const prov = Object.keys(previousCase.provenance)
        .filter(k => k.startsWith('debitur.'))
        .reduce((res, key) => ({ ...res, [key]: previousCase.provenance[key] }), {});
      
      builder.setDebitur(previousCase.data.debitur, src, prov, previousCase.quality.identity);
    }

    // Process Agunan updates
    // For simplicity, we just take the new agunan array or fallback to previous
    const agunans = updates.agunanList || (previousCase ? previousCase.data.agunan : []);
    agunans.forEach((ag, idx) => {
      // Very simplified provenance copy for demonstration
      builder.addAgunan(ag, null, null, null); 
    });

    const newCase = builder.build();
    
    const eventType = previousCase ? CaseEvents.CASE_REVISION_CREATED : CaseEvents.CASE_BUILT;
    const event = createCaseEvent(eventType, newCase.caseId, newCase.revisionId, newCase.trace);

    return {
      creditCase: newCase,
      event
    };
  }
}

module.exports = CaseRevisionService;
