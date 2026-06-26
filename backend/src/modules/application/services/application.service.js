const PengajuanAdapter = require('../adapters/pengajuan.adapter');
const { createApplicationEvent, ApplicationEvents } = require('../events/application.events');
const EventBus = require('../../../infrastructure/event-bus/EventBus');
const { createEventEnvelope } = require('../../../infrastructure/event-bus/EventEnvelope');

class ApplicationService {
  
  /**
   * Imports a legacy database record and emits a domain event
   * @param {Object} legacyRecord - The raw database record from the old pengajuan system
   * @returns {Object} result containing the canonical application and the generated event
   */
  static importFromLegacy(legacyRecord) {
    if (!legacyRecord) {
      throw new Error('Legacy record is required for import');
    }

    const application = PengajuanAdapter.adapt(legacyRecord);
    
    // In a real system, we'd save this to a DB. For now, it's just pure logic.
    
    const event = createApplicationEvent(
      ApplicationEvents.APPLICATION_CREATED, 
      application.applicationId, 
      { source: 'LEGACY_IMPORT' }
    );

    return {
      application,
      event
    };
  }

  /**
   * Submits an application for assessment processing.
   * 
   * This is the ENTRY POINT for the Assessment Workflow:
   *   1. Validates application state
   *   2. Creates immutable copy with status = ASSESSMENT
   *   3. Publishes ApplicationSubmitted event via Event Bus
   *   4. AssessmentWorkflow orchestrator picks up from here
   * 
   * @param {Object} application - A canonical CreditApplication object
   * @returns {Object} result containing the submitted application and the event envelope
   * @throws {Error} If application is invalid or in a terminal state
   */
  static submitApplication(application) {
    if (!application) {
      throw new Error('Application is required for submission');
    }
    if (!application.applicationId) {
      throw new Error('Application must have an applicationId');
    }
    if (application.status === 'CANCELLED') {
      throw new Error('Cannot submit a cancelled application');
    }
    if (application.status === 'REJECTED') {
      throw new Error('Cannot submit a rejected application');
    }

    // Create a new immutable copy with updated status
    const submittedApplication = {
      ...JSON.parse(JSON.stringify(application)),
      status: 'ASSESSMENT',
      submittedAt: new Date().toISOString()
    };

    // Create canonical event envelope
    const envelope = createEventEnvelope({
      eventType: ApplicationEvents.APPLICATION_SUBMITTED,
      aggregate: 'Application',
      aggregateId: submittedApplication.applicationId,
      payload: {
        application: submittedApplication,
        previousStatus: application.status
      },
      metadata: {
        source: application.metadata?.source || 'UNKNOWN',
        version: application.metadata?.version || '1.0'
      }
    });

    // Publish to Event Bus — workflow orchestrator subscribes to this
    const eventBus = EventBus.getInstance();
    eventBus.publish(envelope);

    return {
      application: submittedApplication,
      envelope
    };
  }

}

module.exports = ApplicationService;
