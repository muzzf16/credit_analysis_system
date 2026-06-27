/**
 * Decision Event Dictionary — Credit Decision Platform
 *
 * Committee Workflow subscribes to DecisionKernelCreated (not DecisionRequested).
 */

const DecisionEvents = {
  DECISION_REQUESTED: 'DecisionRequested',
  DECISION_KERNEL_CREATED: 'DecisionKernelCreated',
  DECISION_REVISION_CREATED: 'DecisionRevisionCreated',
  DECISION_FINALIZED: 'DecisionFinalized',
};

function createDecisionEvent(eventType, decisionId, payload = {}) {
  if (!Object.values(DecisionEvents).includes(eventType)) {
    throw new Error(`Unknown Decision Event Type: ${eventType}`);
  }

  return {
    eventId: require('crypto').randomUUID(),
    eventType,
    entityId: decisionId,
    timestamp: new Date().toISOString(),
    payload,
  };
}

module.exports = {
  DecisionEvents,
  createDecisionEvent,
};
