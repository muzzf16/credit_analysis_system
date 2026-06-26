const AssessmentContextBuilder = require('../builders/AssessmentContextBuilder');
const { createAssessmentEvent, AssessmentEvents } = require('../events/assessment.events');

class AssessmentVersionService {
  /**
   * Generates an AssessmentContext from a Case Revision and Policy Pack
   * @param {Object} creditCase - The immutable CreditCase snapshot
   * @param {Object} policySpec - The chosen policy pack details
   * @param {Object} scope - Execution scope
   * @param {Object} previousAssessment - Optional previous assessment for version bumping
   * @returns {Object} result containing the AssessmentContext and Event
   */
  static createAssessment(creditCase, policySpec, scope, previousAssessment = null) {
    if (!creditCase) throw new Error('CreditCase snapshot is required');

    const id = previousAssessment ? previousAssessment.assessmentId : null;
    const version = previousAssessment ? previousAssessment.assessmentVersion : 0;
    
    const builder = new AssessmentContextBuilder(id, version);
    
    builder.setCreditCase(creditCase);
    builder.setScope(scope.purpose, scope.product, scope.simulation);
    builder.setPolicy(policySpec.pack, policySpec.version, policySpec.fingerprint);
    
    // In a real system, these would be computed dynamically based on the case quality
    // For now, we mock the injection of computed metrics
    builder.setQuality(
      96, 
      { readyForScoring: true, readyForCommittee: false }, 
      { identity: 'READY', financial: 'READY', collateral: 'MISSING' }
    );

    // Mocking an assumption injection
    builder.addAssumption('SEASONAL_REVENUE', 'Omzet menggunakan rata-rata 12 bulan.');
    
    // Mocking constraint injection
    builder.addConstraint('MAX_TENOR_60');
    builder.addConstraint('MIN_DSCR_1_2');

    const context = builder.build();
    
    const eventType = previousAssessment ? AssessmentEvents.ASSESSMENT_REBUILT : AssessmentEvents.ASSESSMENT_CREATED;
    const event = createAssessmentEvent(eventType, context.assessmentId, context.assessmentVersion, context.scope);

    return {
      assessmentContext: context,
      event
    };
  }
}

module.exports = AssessmentVersionService;
