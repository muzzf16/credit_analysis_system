const EventBus = require('../../infrastructure/event-bus/EventBus');
const { createEventEnvelope } = require('../../infrastructure/event-bus/EventEnvelope');
const { ApplicationEvents } = require('../application/events/application.events');
const { CaseEvents } = require('../case/events/case.events');
const { AssessmentEvents } = require('../assessment/events/assessment.events');
const WorkflowEvents = require('./events/workflow.events');
const CaseRevisionService = require('../case/services/case-revision.service');
const AssessmentVersionService = require('../assessment/services/assessment-version.service');
const { MemoryRepository, PolicyRegistry, PolicyResolver, PolicyPack } = require('../../modules/policy');
const fs = require('fs');
const path = require('path');

/**
 * AssessmentWorkflow — Orchestrates the Application → Case → Assessment pipeline.
 * 
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  This is where the business logic for sequencing lives.             │
 * │  The Event Bus is pure pub/sub — it does NOT know about this chain. │
 * │                                                                     │
 * │  Flow:                                                              │
 * │    1. ApplicationSubmitted  → Build CreditCase                      │
 * │    2. CreditCaseBuilt       → Build AssessmentContext               │
 * │    3. AssessmentCreated     → Emit AssessmentReadyForDecision       │
 * │                                                                     │
 * │  AssessmentReadyForDecision is the TERMINAL event of Phase 4.       │
 * │  Phase 5 (Decision Platform) will subscribe to it.                  │
 * └──────────────────────────────────────────────────────────────────────┘
 * 
 * Future sibling workflows:
 *   - DisbursementWorkflow
 *   - CollectionWorkflow
 *   - RenewalWorkflow
 *   - EWSWorkflow
 */
class AssessmentWorkflow {
  /**
   * @param {EventBus} [eventBus] - EventBus instance (defaults to singleton)
   * @param {PolicyResolver} [policyResolver] - PolicyResolver instance
   */
  constructor(eventBus, policyResolver = null) {
    this._eventBus = eventBus || EventBus.getInstance();
    
    if (policyResolver) {
      this._policyResolver = policyResolver;
    } else {
      // Bootstrap default for dev/tests
      const repo = new MemoryRepository();
      
      // Mock rule library just to pass compatibility check
      const mockRuleLib = {
        'MIN_AGE': {}, 'MAX_AGE': {}, 'SLIK_CLEARANCE': {},
        'DSR_MAX': {}, 'RPC_MIN': {}, 'DSCR_MIN': {},
        'LTV_MAX': {}, 'SCORING_5C': {}
      };
      const registry = new PolicyRegistry(repo, mockRuleLib);
      
      const fixturePath = path.join(__dirname, '../../modules/policy/fixtures/bpr-bapera-2024.policy.json');
      const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
      
      const policy = new PolicyPack(fixture);
      registry.register(policy);
      registry.requestReview(policy.id);
      registry.approve(policy.id);
      registry.activate(policy.id);
      
      this._policyResolver = new PolicyResolver(repo);
    }
    
    this._registered = false;
  }

  /**
   * Register all event subscriptions for this workflow.
   * Idempotent — calling multiple times has no effect.
   */
  register() {
    if (this._registered) return;

    // Step 1: ApplicationSubmitted → Build CreditCase
    this._eventBus.subscribe(
      ApplicationEvents.APPLICATION_SUBMITTED,
      'AssessmentWorkflow.onApplicationSubmitted',
      (envelope) => this._onApplicationSubmitted(envelope)
    );

    // Step 2: CreditCaseBuilt → Build AssessmentContext
    this._eventBus.subscribe(
      CaseEvents.CASE_BUILT,
      'AssessmentWorkflow.onCreditCaseBuilt',
      (envelope) => this._onCreditCaseBuilt(envelope)
    );

    // Step 3: AssessmentCreated → Emit terminal event
    this._eventBus.subscribe(
      AssessmentEvents.ASSESSMENT_CREATED,
      'AssessmentWorkflow.onAssessmentCreated',
      (envelope) => this._onAssessmentCreated(envelope)
    );

    this._registered = true;
  }

  /**
   * Step 1: Build CreditCase from submitted application
   * 
   * ApplicationSubmitted → CaseRevisionService.generateRevision() → CreditCaseBuilt
   * 
   * @private
   * @param {Object} envelope - ApplicationSubmitted event envelope
   */
  _onApplicationSubmitted(envelope) {
    const { application } = envelope.payload;

    if (!application) {
      throw new Error('ApplicationSubmitted event is missing application payload');
    }

    // Build the first CreditCase revision (V1)
    const pipelineFingerprint = `pipeline-${Date.now()}`;
    const { creditCase } = CaseRevisionService.generateRevision(
      null, // No previous case — first revision
      { application },
      pipelineFingerprint,
      [envelope.eventType]
    );

    // Publish CreditCaseBuilt event with full trace chain
    const caseEnvelope = createEventEnvelope({
      eventType: CaseEvents.CASE_BUILT,
      aggregate: 'Case',
      aggregateId: creditCase.caseId,
      payload: { creditCase },
      correlationId: envelope.correlationId,  // Same root trace
      causationId: envelope.eventId,          // Caused by ApplicationSubmitted
      metadata: {
        pipelineFingerprint,
        builderVersion: creditCase.trace.builderVersion,
        workflowStep: 'CASE_BUILD'
      }
    });

    this._eventBus.publish(caseEnvelope);
  }

  /**
   * Step 2: Build AssessmentContext from CreditCase
   * 
   * CreditCaseBuilt → AssessmentVersionService.createAssessment() → AssessmentCreated
   * 
   * @private
   * @param {Object} envelope - CreditCaseBuilt event envelope
   */
  _onCreditCaseBuilt(envelope) {
    const { creditCase } = envelope.payload;

    if (!creditCase) {
      throw new Error('CreditCaseBuilt event is missing creditCase payload');
    }

    // Determine scope from the application data inside the case
    const product = creditCase.data?.application?.product || 'KREDIT_MODAL_KERJA';
    const scope = {
      purpose: 'NEW_LOAN',
      product,
      simulation: false
    };

    // Resolve the active policy pack for this context
    const policyPack = this._policyResolver.resolve({ product });

    // Build AssessmentContext
    // AssessmentVersionService expects policySpec to have {pack, version, fingerprint}
    // policyPack entity natively provides those getters.
    const { assessmentContext } = AssessmentVersionService.createAssessment(
      creditCase,
      policyPack,
      scope
    );

    // Publish AssessmentCreated event
    const assessmentEnvelope = createEventEnvelope({
      eventType: AssessmentEvents.ASSESSMENT_CREATED,
      aggregate: 'Assessment',
      aggregateId: assessmentContext.assessmentId,
      payload: { assessmentContext },
      correlationId: envelope.correlationId,  // Same root trace
      causationId: envelope.eventId,          // Caused by CreditCaseBuilt
      metadata: {
        policyVersion: policyPack.version,
        policyFingerprint: policyPack.fingerprint,
        builderVersion: '1.0.0',
        workflowStep: 'ASSESSMENT_BUILD'
      }
    });

    this._eventBus.publish(assessmentEnvelope);
  }

  /**
   * Step 3: Emit terminal event — AssessmentReadyForDecision
   * 
   * This is the boundary between Phase 4 (Fact Platform) and Phase 5 (Decision Platform).
   * The terminal event carries only the identifiers and fingerprints needed for Phase 5 
   * to fetch the full AssessmentContext if it needs to.
   * 
   * @private
   * @param {Object} envelope - AssessmentCreated event envelope
   */
  _onAssessmentCreated(envelope) {
    const { assessmentContext } = envelope.payload;

    if (!assessmentContext) {
      throw new Error('AssessmentCreated event is missing assessmentContext payload');
    }

    // Emit the terminal event — Phase 4 is complete at this point
    const terminalEnvelope = createEventEnvelope({
      eventType: WorkflowEvents.ASSESSMENT_READY_FOR_DECISION,
      aggregate: 'Assessment',
      aggregateId: assessmentContext.assessmentId,
      payload: {
        assessmentId: assessmentContext.assessmentId,
        assessmentVersion: assessmentContext.assessmentVersion,
        assessmentFingerprint: assessmentContext.integrity.fingerprint,
        applicationId: assessmentContext.applicationId,
        caseRevisionId: assessmentContext.caseRevisionId,
        policyFingerprint: assessmentContext.policy.fingerprint,
        quality: assessmentContext.quality
      },
      correlationId: envelope.correlationId,  // Same root trace
      causationId: envelope.eventId,          // Caused by AssessmentCreated
      metadata: {
        policyVersion: assessmentContext.policy.version,
        workflowStep: 'READY_FOR_DECISION',
        completedAt: new Date().toISOString()
      }
    });

    this._eventBus.publish(terminalEnvelope);
  }
}

module.exports = AssessmentWorkflow;
