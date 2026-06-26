/**
 * Assessment Event Dictionary
 */

const AssessmentEvents = {
  ASSESSMENT_CREATED: 'AssessmentCreated',
  ASSESSMENT_REBUILT: 'AssessmentRebuilt',
  ASSESSMENT_ARCHIVED: 'AssessmentArchived'
};

function createAssessmentEvent(eventType, assessmentId, version, scope = {}) {
  if (!Object.values(AssessmentEvents).includes(eventType)) {
    throw new Error(`Unknown Assessment Event Type: ${eventType}`);
  }
  
  return {
    eventId: require('crypto').randomUUID(),
    eventType,
    entityId: assessmentId,
    timestamp: new Date().toISOString(),
    payload: {
      version,
      scope
    }
  };
}

module.exports = {
  AssessmentEvents,
  createAssessmentEvent
};
