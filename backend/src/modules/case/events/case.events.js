/**
 * Case Event Dictionary
 */

const CaseEvents = {
  CASE_BUILT: 'CreditCaseBuilt',
  CASE_REVISION_CREATED: 'CreditCaseRevisionCreated'
};

function createCaseEvent(eventType, caseId, revisionId, traceInfo = {}) {
  if (!Object.values(CaseEvents).includes(eventType)) {
    throw new Error(`Unknown Case Event Type: ${eventType}`);
  }
  
  return {
    eventId: require('crypto').randomUUID(),
    eventType,
    entityId: caseId,
    timestamp: new Date().toISOString(),
    payload: {
      revisionId,
      trace: traceInfo
    }
  };
}

module.exports = {
  CaseEvents,
  createCaseEvent
};
