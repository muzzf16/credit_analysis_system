const EventBus = require('../../infrastructure/event-bus/EventBus');
const { createEventEnvelope } = require('../../infrastructure/event-bus/EventEnvelope');
const WorkflowEvents = require('../workflows/events/workflow.events');
const { AssessmentEvents } = require('../assessment/events/assessment.events');
const { DecisionEvents } = require('../decision-kernel/events/decision.events');
const DecisionOrchestrator = require('../decision-kernel/services/decision-orchestrator.service');
const { bootstrapDecisionPlatform } = require('../decision-kernel/bootstrap/decision-platform.bootstrap');

/**
 * DecisionWorkflow — Orchestrates Phase 5 Credit Decision Platform.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  AssessmentReadyForDecision → DecisionOrchestrator → DecisionKernel  │
 * │                                                                     │
 * │  This workflow does NOT contain business rules.                     │
 * │  It only sequences: Intent → Policy → Kernel (via Orchestrator).    │
 * │                                                                     │
 * │  Committee Workflow subscribes to DecisionKernelCreated.            │
 * └──────────────────────────────────────────────────────────────────────┘
 */
class DecisionWorkflow {
  /**
   * @param {EventBus} [eventBus]
   */
  constructor(eventBus) {
    this._eventBus = eventBus || EventBus.getInstance();
    this._assessmentStore = new Map();
    this._registered = false;
  }

  register() {
    if (this._registered) return;

    bootstrapDecisionPlatform();

    this._eventBus.subscribe(
      AssessmentEvents.ASSESSMENT_CREATED,
      'DecisionWorkflow.onAssessmentCreated',
      (envelope) => this._onAssessmentCreated(envelope)
    );

    this._eventBus.subscribe(
      WorkflowEvents.ASSESSMENT_READY_FOR_DECISION,
      'DecisionWorkflow.onAssessmentReadyForDecision',
      (envelope) => this._onAssessmentReadyForDecision(envelope)
    );

    this._registered = true;
  }

  /**
   * Cache full AssessmentContext for orchestration.
   * @private
   */
  _onAssessmentCreated(envelope) {
    const { assessmentContext } = envelope.payload;
    if (assessmentContext?.assessmentId) {
      this._assessmentStore.set(assessmentContext.assessmentId, assessmentContext);
    }
  }

  /**
   * @private
   */
  _onAssessmentReadyForDecision(envelope) {
    const { assessmentId } = envelope.payload;

    const assessmentContext = this._resolveAssessmentContext(assessmentId);
    if (!assessmentContext) {
      throw new Error(`DecisionWorkflow: AssessmentContext not found for [${assessmentId}]`);
    }

    const requestedEnvelope = createEventEnvelope({
      eventType: DecisionEvents.DECISION_REQUESTED,
      aggregate: 'Decision',
      aggregateId: assessmentId,
      payload: {
        assessmentId,
        assessmentFingerprint: envelope.payload.assessmentFingerprint,
        policyFingerprint: envelope.payload.policyFingerprint,
      },
      correlationId: envelope.correlationId,
      causationId: envelope.eventId,
      metadata: { workflowStep: 'DECISION_REQUESTED' },
    });
    this._eventBus.publish(requestedEnvelope);

    const result = DecisionOrchestrator.execute(assessmentContext, {
      correlationId: envelope.correlationId,
    });

    const kernelEnvelope = createEventEnvelope({
      eventType: DecisionEvents.DECISION_KERNEL_CREATED,
      aggregate: 'Decision',
      aggregateId: result.kernel.decisionId,
      payload: {
        decisionKernel: result.kernel.toJSON(),
        decisionRevision: result.revision.toJSON(),
        assessmentId,
        pipelineStatus: result.pipelineResult.status,
      },
      correlationId: envelope.correlationId,
      causationId: requestedEnvelope.eventId,
      metadata: {
        workflowStep: 'DECISION_KERNEL_CREATED',
        decisionFingerprint: result.kernel.audit.fingerprints.decision,
      },
    });
    this._eventBus.publish(kernelEnvelope);
  }

  /** @internal For tests */
  _getAssessmentStore() {
    return this._assessmentStore;
  }

  /**
   * Resolve AssessmentContext from cache or event store (AssessmentCreated).
   * @private
   */
  _resolveAssessmentContext(assessmentId) {
    if (this._assessmentStore.has(assessmentId)) {
      return this._assessmentStore.get(assessmentId);
    }

    const events = this._eventBus.getEventStore().getAll();
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const evt = events[i];
      if (
        evt.eventType === AssessmentEvents.ASSESSMENT_CREATED
        && evt.payload?.assessmentContext?.assessmentId === assessmentId
      ) {
        this._assessmentStore.set(assessmentId, evt.payload.assessmentContext);
        return evt.payload.assessmentContext;
      }
    }
    return null;
  }
}

module.exports = DecisionWorkflow;
