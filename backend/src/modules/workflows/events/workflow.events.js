/**
 * Workflow Event Dictionary
 * 
 * Events specific to workflow orchestration lifecycle.
 * These are NOT domain events — they are infrastructure/coordination events.
 * 
 * Naming convention: future workflows will add their own prefixed events:
 *   - DisbursementWorkflow → DISBURSEMENT_WORKFLOW_*
 *   - CollectionWorkflow  → COLLECTION_WORKFLOW_*
 *   - RenewalWorkflow     → RENEWAL_WORKFLOW_*
 *   - EWSWorkflow         → EWS_WORKFLOW_*
 */

const WorkflowEvents = {
  // ── Assessment Workflow ──────────────────────────────────────────
  ASSESSMENT_WORKFLOW_STARTED: 'AssessmentWorkflowStarted',
  ASSESSMENT_WORKFLOW_STEP_COMPLETED: 'AssessmentWorkflowStepCompleted',
  ASSESSMENT_WORKFLOW_COMPLETED: 'AssessmentWorkflowCompleted',
  ASSESSMENT_WORKFLOW_FAILED: 'AssessmentWorkflowFailed',

  // ── Terminal Event — Phase 4 → Phase 5 Gateway ──────────────────
  // This is the LAST event emitted by Phase 4 (Fact Platform).
  // Phase 5 (Decision Platform) will subscribe to this event.
  ASSESSMENT_READY_FOR_DECISION: 'AssessmentReadyForDecision'
};

module.exports = WorkflowEvents;
