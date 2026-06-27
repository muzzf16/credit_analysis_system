const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const EventBus = require('../../../src/infrastructure/event-bus/EventBus');
const { createEventEnvelope } = require('../../../src/infrastructure/event-bus/EventEnvelope');
const AssessmentWorkflow = require('../../../src/modules/workflows/assessment-workflow');
const DecisionWorkflow = require('../../../src/modules/workflows/decision-workflow');
const ApplicationService = require('../../../src/modules/application/services/application.service');
const CreditApplicationBuilder = require('../../../src/modules/application/entities/CreditApplication');
const WorkflowEvents = require('../../../src/modules/workflows/events/workflow.events');
const { AssessmentEvents } = require('../../../src/modules/assessment/events/assessment.events');
const { DecisionEvents } = require('../../../src/modules/decision-kernel/events/decision.events');
const DecisionIntegrityService = require('../../../src/modules/decision-kernel/services/decision-integrity.service');

describe('DecisionWorkflow — Phase 5 Integration', () => {
  beforeEach(() => {
    EventBus.resetInstance();
  });

  function buildTestApplication() {
    const builder = new CreditApplicationBuilder();
    builder.generateApplicationId();
    builder.setProduct('KREDIT_MODAL_KERJA');
    builder.setAccountOfficer('AO-TEST-001');
    builder.setSubmittedAt();
    return builder.build();
  }

  test('Should produce DecisionKernelCreated after AssessmentReadyForDecision', () => {
    const bus = EventBus.getInstance();
    const assessmentWorkflow = new AssessmentWorkflow(bus);
    const decisionWorkflow = new DecisionWorkflow(bus);
    assessmentWorkflow.register();
    decisionWorkflow.register();

    let kernelCreated = null;
    bus.subscribe(
      DecisionEvents.DECISION_KERNEL_CREATED,
      'TestKernelCapture',
      (envelope) => { kernelCreated = envelope; }
    );

    const application = buildTestApplication();
    ApplicationService.submitApplication(application);

    assert.ok(kernelCreated, 'DecisionKernelCreated should have been emitted');
    assert.strictEqual(kernelCreated.eventType, DecisionEvents.DECISION_KERNEL_CREATED);
    assert.ok(kernelCreated.payload.decisionKernel);
    assert.ok(kernelCreated.payload.decisionKernel.decisionId);
    assert.ok(kernelCreated.payload.decisionKernel.audit.fingerprints.decision);

    const kernel = kernelCreated.payload.decisionKernel;
    const integrity = DecisionIntegrityService.verifyKernel({
      toJSON: () => kernel,
    });
    assert.strictEqual(integrity.valid, true);
  });

  test('Should emit events in order: ReadyForDecision → Requested → KernelCreated', () => {
    const bus = EventBus.getInstance();
    new AssessmentWorkflow(bus).register();
    new DecisionWorkflow(bus).register();

    const application = buildTestApplication();
    ApplicationService.submitApplication(application);

    const events = bus.getEventStore().getAll().map((e) => e.eventType);
    const readyIdx = events.indexOf(WorkflowEvents.ASSESSMENT_READY_FOR_DECISION);
    const requestedIdx = events.indexOf(DecisionEvents.DECISION_REQUESTED);
    const createdIdx = events.indexOf(DecisionEvents.DECISION_KERNEL_CREATED);

    assert.ok(readyIdx >= 0);
    assert.ok(requestedIdx > readyIdx);
    assert.ok(createdIdx > requestedIdx);
  });

  test('Should cache AssessmentContext on AssessmentCreated', () => {
    const bus = EventBus.getInstance();
    const decisionWorkflow = new DecisionWorkflow(bus);
    decisionWorkflow.register();

    const envelope = createEventEnvelope({
      eventType: AssessmentEvents.ASSESSMENT_CREATED,
      aggregate: 'Assessment',
      aggregateId: 'ASM-CACHE-001',
      payload: {
        assessmentContext: {
          assessmentId: 'ASM-CACHE-001',
          integrity: { fingerprint: 'sha256-cache' },
          policy: { fingerprint: 'sha256-policy' },
        },
      },
    });
    bus.publish(envelope);

    assert.ok(decisionWorkflow._getAssessmentStore().has('ASM-CACHE-001'));
  });
});
