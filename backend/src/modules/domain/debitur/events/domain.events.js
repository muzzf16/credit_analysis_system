/**
 * Domain Events Factory for Debitur Context
 * Returns pure event objects ready to be emitted or stored
 */

function createDebiturCreatedEvent(debiturId, payload) {
  return {
    eventType: 'DEBITUR_CREATED',
    entityId: debiturId,
    timestamp: new Date().toISOString(),
    payload
  };
}

function createDebiturUpdatedEvent(debiturId, updatedFields) {
  return {
    eventType: 'DEBITUR_UPDATED',
    entityId: debiturId,
    timestamp: new Date().toISOString(),
    payload: updatedFields
  };
}

module.exports = {
  createDebiturCreatedEvent,
  createDebiturUpdatedEvent
};
