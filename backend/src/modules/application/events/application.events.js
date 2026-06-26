/**
 * Application Event Dictionary
 */

const ApplicationEvents = {
  APPLICATION_CREATED: 'ApplicationCreated',
  APPLICATION_UPDATED: 'ApplicationUpdated',
  APPLICATION_SUBMITTED: 'ApplicationSubmitted',
  APPLICATION_CANCELLED: 'ApplicationCancelled',
  APPLICATION_ARCHIVED: 'ApplicationArchived'
};

function createApplicationEvent(eventType, applicationId, payload = {}) {
  if (!Object.values(ApplicationEvents).includes(eventType)) {
    throw new Error(`Unknown Application Event Type: ${eventType}`);
  }
  
  return {
    eventId: require('crypto').randomUUID(),
    eventType,
    entityId: applicationId,
    timestamp: new Date().toISOString(),
    payload
  };
}

module.exports = {
  ApplicationEvents,
  createApplicationEvent
};
