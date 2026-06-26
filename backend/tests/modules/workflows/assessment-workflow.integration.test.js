const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const EventBus = require('../../../src/infrastructure/event-bus/EventBus');
const { createEventEnvelope } = require('../../../src/infrastructure/event-bus/EventEnvelope');
const AssessmentWorkflow = require('../../../src/modules/workflows/assessment-workflow');
const ApplicationService = require('../../../src/modules/application/services/application.service');
const CreditApplicationBuilder = require('../../../src/modules/application/entities/CreditApplication');
const WorkflowEvents = require('../../../src/modules/workflows/events/workflow.events');
const { ApplicationEvents } = require('../../../src/modules/application/events/application.events');
const { CaseEvents } = require('../../../src/modules/case/events/case.events');
const { AssessmentEvents } = require('../../../src/modules/assessment/events/assessment.events');

// ═══════════════════════════════════════════════════════════════
//  AssessmentWorkflow — Full Pipeline Integration Tests
//
//  Validates the entire Phase 4 event chain:
//    ApplicationSubmitted → CreditCaseBuilt → AssessmentCreated 
//    → AssessmentReadyForDecision (terminal)
// ═══════════════════════════════════════════════════════════════

describe('AssessmentWorkflow — Full Pipeline Integration', () => {

  beforeEach(() => {
    EventBus.resetInstance();
  });

  /**
   * Helper: Build and return a test application
   */
  function buildTestApplication(product = 'KREDIT_MODAL_KERJA') {
    const builder = new CreditApplicationBuilder();
    builder.generateApplicationId();
    builder.setProduct(product);
    builder.setAccountOfficer('AO-TEST-001');
    builder.setSubmittedAt();
    return builder.build();
  }

  // ─── Core Pipeline Tests ────────────────────────────────────

  test('Should execute full pipeline: Application → Case → Assessment → ReadyForDecision', () => {
    const bus = EventBus.getInstance();
    const workflow = new AssessmentWorkflow(bus);
    workflow.register();

    // Track terminal event
    let terminalEvent = null;
    bus.subscribe(
      WorkflowEvents.ASSESSMENT_READY_FOR_DECISION,
      'TestTerminalCapture',
      (envelope) => { terminalEvent = envelope; }
    );

    // Submit application
    const application = buildTestApplication();
    ApplicationService.submitApplication(application);

    // Assert: Terminal event was emitted
    assert.ok(terminalEvent, 'AssessmentReadyForDecision event should have been emitted');
    assert.strictEqual(terminalEvent.eventType, WorkflowEvents.ASSESSMENT_READY_FOR_DECISION);
    assert.strictEqual(terminalEvent.aggregate, 'Assessment');
    assert.ok(terminalEvent.payload.assessmentId, 'Should have assessmentId');
    assert.ok(terminalEvent.payload.assessmentFingerprint, 'Should have assessmentFingerprint');
    assert.ok(terminalEvent.payload.policyFingerprint, 'Should have policyFingerprint');
    assert.ok(terminalEvent.payload.applicationId, 'Should have applicationId');
    assert.ok(terminalEvent.payload.caseRevisionId, 'Should have caseRevisionId');
  });

  // ─── Event Order Tests ──────────────────────────────────────

  test('Should emit events in correct order', () => {
    const bus = EventBus.getInstance();
    const workflow = new AssessmentWorkflow(bus);
    workflow.register();

    const application = buildTestApplication('KREDIT_KONSUMTIF');
    ApplicationService.submitApplication(application);

    const store = bus.getEventStore();
    const events = store.getAll();

    assert.strictEqual(events.length, 4, 'Should produce exactly 4 events');
    assert.strictEqual(events[0].eventType, ApplicationEvents.APPLICATION_SUBMITTED);
    assert.strictEqual(events[1].eventType, CaseEvents.CASE_BUILT);
    assert.strictEqual(events[2].eventType, AssessmentEvents.ASSESSMENT_CREATED);
    assert.strictEqual(events[3].eventType, WorkflowEvents.ASSESSMENT_READY_FOR_DECISION);
  });

  // ─── Correlation & Causation Chain Tests ─────────────────────

  test('Should maintain consistent correlationId through entire chain', () => {
    const bus = EventBus.getInstance();
    const workflow = new AssessmentWorkflow(bus);
    workflow.register();

    const application = buildTestApplication();
    ApplicationService.submitApplication(application);

    const store = bus.getEventStore();
    const events = store.getAll();
    const correlationId = events[0].correlationId;

    for (const event of events) {
      assert.strictEqual(event.correlationId, correlationId,
        `Event ${event.eventType} should share root correlationId`);
    }
  });

  test('Should build correct causationId chain (parent → child)', () => {
    const bus = EventBus.getInstance();
    const workflow = new AssessmentWorkflow(bus);
    workflow.register();

    const application = buildTestApplication();
    ApplicationService.submitApplication(application);

    const store = bus.getEventStore();
    const events = store.getAll();

    // [0] ApplicationSubmitted → root event (no causation)
    assert.strictEqual(events[0].causationId, null, 'Root event has no causation');

    // [1] CreditCaseBuilt → caused by ApplicationSubmitted
    assert.strictEqual(events[1].causationId, events[0].eventId,
      'CreditCaseBuilt should be caused by ApplicationSubmitted');

    // [2] AssessmentCreated → caused by CreditCaseBuilt
    assert.strictEqual(events[2].causationId, events[1].eventId,
      'AssessmentCreated should be caused by CreditCaseBuilt');

    // [3] AssessmentReadyForDecision → caused by AssessmentCreated
    assert.strictEqual(events[3].causationId, events[2].eventId,
      'AssessmentReadyForDecision should be caused by AssessmentCreated');
  });

  // ─── Aggregate Metadata Tests ───────────────────────────────

  test('Should tag each event with correct aggregate metadata', () => {
    const bus = EventBus.getInstance();
    const workflow = new AssessmentWorkflow(bus);
    workflow.register();

    const application = buildTestApplication();
    ApplicationService.submitApplication(application);

    const store = bus.getEventStore();
    const events = store.getAll();

    assert.strictEqual(events[0].aggregate, 'Application');
    assert.strictEqual(events[1].aggregate, 'Case');
    assert.strictEqual(events[2].aggregate, 'Assessment');
    assert.strictEqual(events[3].aggregate, 'Assessment');

    // All events should have eventVersion
    for (const event of events) {
      assert.strictEqual(event.eventVersion, '1.0');
    }
  });

  // ─── SHA-256 Integrity Tests ────────────────────────────────

  test('Should include SHA-256 integrity fingerprint in AssessmentContext', () => {
    const bus = EventBus.getInstance();
    const workflow = new AssessmentWorkflow(bus);
    workflow.register();

    const application = buildTestApplication('KREDIT_PEGAWAI');
    ApplicationService.submitApplication(application);

    const store = bus.getEventStore();
    const assessmentEvent = store.getByType(AssessmentEvents.ASSESSMENT_CREATED)[0];

    const ctx = assessmentEvent.payload.assessmentContext;
    assert.ok(ctx.integrity.fingerprint, 'Should have integrity fingerprint');
    assert.ok(ctx.integrity.fingerprint.startsWith('sha256-'), 'Fingerprint should start with sha256-');
    assert.strictEqual(ctx.integrity.algorithm, 'SHA-256');
  });

  test('Should include CreditCase SHA-256 hash in case snapshot', () => {
    const bus = EventBus.getInstance();
    const workflow = new AssessmentWorkflow(bus);
    workflow.register();

    const application = buildTestApplication();
    ApplicationService.submitApplication(application);

    const store = bus.getEventStore();
    const caseEvent = store.getByType(CaseEvents.CASE_BUILT)[0];

    const creditCase = caseEvent.payload.creditCase;
    assert.ok(creditCase.integrity.hash, 'CreditCase should have integrity hash');
    assert.ok(creditCase.integrity.hash.startsWith('sha256-'), 'Hash should start with sha256-');
    assert.strictEqual(creditCase.integrity.algorithm, 'SHA-256');
  });

  // ─── Policy Metadata Tests ─────────────────────────────────

  test('Should carry policy fingerprint through terminal event', () => {
    const bus = EventBus.getInstance();
    const workflow = new AssessmentWorkflow(bus);
    workflow.register();

    const application = buildTestApplication();
    ApplicationService.submitApplication(application);

    const store = bus.getEventStore();
    const terminalEvent = store.getByType(WorkflowEvents.ASSESSMENT_READY_FOR_DECISION)[0];

    assert.ok(terminalEvent.metadata.policyVersion, 'Should have policyVersion in metadata');
    assert.ok(terminalEvent.payload.policyFingerprint, 'Should have policyFingerprint in payload');
    assert.ok(terminalEvent.payload.policyFingerprint.startsWith('sha256-'),
      'Policy fingerprint should be SHA-256');
  });

  // ─── Event Metadata Tests ──────────────────────────────────

  test('Should include workflow step metadata in each event', () => {
    const bus = EventBus.getInstance();
    const workflow = new AssessmentWorkflow(bus);
    workflow.register();

    const application = buildTestApplication();
    ApplicationService.submitApplication(application);

    const store = bus.getEventStore();
    const events = store.getAll();

    // CreditCaseBuilt should have CASE_BUILD step
    assert.strictEqual(events[1].metadata.workflowStep, 'CASE_BUILD');

    // AssessmentCreated should have ASSESSMENT_BUILD step  
    assert.strictEqual(events[2].metadata.workflowStep, 'ASSESSMENT_BUILD');

    // Terminal should have READY_FOR_DECISION step
    assert.strictEqual(events[3].metadata.workflowStep, 'READY_FOR_DECISION');
  });

  // ─── DeadLetterQueue Integration ───────────────────────────

  test('Should route failing consumer to DLQ without crashing pipeline', () => {
    const bus = EventBus.getInstance();
    const workflow = new AssessmentWorkflow(bus);
    workflow.register();

    // Register a failing subscriber AFTER workflow
    bus.subscribe(
      WorkflowEvents.ASSESSMENT_READY_FOR_DECISION,
      'FailingConsumer',
      () => { throw new Error('Consumer crashed intentionally'); }
    );

    const application = buildTestApplication();

    // Should NOT throw — pipeline completes, consumer error goes to DLQ
    assert.doesNotThrow(() => ApplicationService.submitApplication(application));

    const dlq = bus.getDeadLetterQueue();
    assert.strictEqual(dlq.size(), 1);
    assert.strictEqual(dlq.getAll()[0].handlerName, 'FailingConsumer');
    assert.strictEqual(dlq.getAll()[0].error.message, 'Consumer crashed intentionally');
  });

  // ─── Application Validation Tests ──────────────────────────

  test('Should reject submission of cancelled application', () => {
    EventBus.getInstance(); // Ensure instance exists

    const builder = new CreditApplicationBuilder();
    builder.generateApplicationId();
    builder.setProduct('KREDIT_MODAL_KERJA');
    builder.setAccountOfficer('AO-001');
    builder.setStatus('CANCELLED');
    const app = builder.build();

    assert.throws(() => ApplicationService.submitApplication(app), /Cannot submit a cancelled/);
  });

  test('Should reject submission of rejected application', () => {
    EventBus.getInstance();

    const builder = new CreditApplicationBuilder();
    builder.generateApplicationId();
    builder.setProduct('KREDIT_MODAL_KERJA');
    builder.setAccountOfficer('AO-001');
    builder.setStatus('REJECTED');
    const app = builder.build();

    assert.throws(() => ApplicationService.submitApplication(app), /Cannot submit a rejected/);
  });

  test('Should reject submission of null application', () => {
    EventBus.getInstance();
    assert.throws(() => ApplicationService.submitApplication(null), /Application is required/);
  });

  // ─── Separation of Concern Tests ───────────────────────────

  test('EventBus has ZERO business logic — no cascade without Orchestrator', () => {
    const bus = EventBus.getInstance();
    // Intentionally do NOT register AssessmentWorkflow

    let caseBuiltReceived = false;
    bus.subscribe('CreditCaseBuilt', 'Monitor', () => { caseBuiltReceived = true; });

    const envelope = createEventEnvelope({
      eventType: ApplicationEvents.APPLICATION_SUBMITTED,
      aggregate: 'Application',
      aggregateId: 'APP-ORPHAN',
      payload: { application: { applicationId: 'APP-ORPHAN' } }
    });

    bus.publish(envelope);

    assert.strictEqual(caseBuiltReceived, false,
      'EventBus must NOT cascade events without the Orchestrator — pure pub/sub only');

    // EventStore should only have the one published event
    assert.strictEqual(bus.getEventStore().size(), 1);
  });

  test('Workflow register is idempotent — double register should not duplicate handlers', () => {
    const bus = EventBus.getInstance();
    const workflow = new AssessmentWorkflow(bus);
    workflow.register();
    workflow.register(); // Second call should be no-op

    const application = buildTestApplication();
    ApplicationService.submitApplication(application);

    const store = bus.getEventStore();
    const events = store.getAll();

    // Should still be exactly 4 events, not 8
    assert.strictEqual(events.length, 4, 'Double register should not duplicate event chain');
  });

  // ─── EventStore Query Tests ─────────────────────────────────

  test('Should be able to trace full workflow via EventStore.getByCorrelation()', () => {
    const bus = EventBus.getInstance();
    const workflow = new AssessmentWorkflow(bus);
    workflow.register();

    const application = buildTestApplication();
    ApplicationService.submitApplication(application);

    const store = bus.getEventStore();
    const allEvents = store.getAll();
    const correlationId = allEvents[0].correlationId;

    // Query by correlation should return the full chain
    const chain = store.getByCorrelation(correlationId);
    assert.strictEqual(chain.length, 4, 'Correlation trace should return all 4 events');
  });

  test('Should be able to query events by aggregate', () => {
    const bus = EventBus.getInstance();
    const workflow = new AssessmentWorkflow(bus);
    workflow.register();

    const application = buildTestApplication();
    const { application: submitted } = ApplicationService.submitApplication(application);

    const store = bus.getEventStore();

    // Application aggregate should have 1 event
    const appEvents = store.getByAggregate('Application', submitted.applicationId);
    assert.strictEqual(appEvents.length, 1);

    // Assessment aggregate should have 2 events (AssessmentCreated + ReadyForDecision)
    const assessmentEvents = store.getByType(AssessmentEvents.ASSESSMENT_CREATED);
    assert.strictEqual(assessmentEvents.length, 1);
    
    const assessmentId = assessmentEvents[0].aggregateId;
    const assessmentAggregateEvents = store.getByAggregate('Assessment', assessmentId);
    assert.strictEqual(assessmentAggregateEvents.length, 2);
  });
});
