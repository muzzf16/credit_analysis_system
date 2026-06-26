const crypto = require('crypto');

/**
 * EventEnvelope — Canonical event structure for the domain event system.
 * 
 * Every event that flows through the Event Bus MUST be wrapped in this envelope.
 * This ensures consistent structure, traceability, and audit compliance.
 * 
 * Fields:
 *   eventId        — Unique UUID for this event
 *   eventType      — Domain event type (e.g., 'ApplicationSubmitted')
 *   eventVersion   — Schema version of this event type (for forward-compat)
 *   aggregate      — Aggregate name (e.g., 'Application', 'Case', 'Assessment')
 *   aggregateId    — Aggregate instance identifier
 *   timestamp      — ISO-8601 creation timestamp
 *   correlationId  — Root trace ID (same for all events in a workflow chain)
 *   causationId    — eventId of the parent event that caused this one
 *   payload        — Event-specific data (deep cloned for immutability)
 *   metadata       — Audit metadata (pipelineFingerprint, builderVersion, etc.)
 */

/**
 * Creates a canonical event envelope
 * @param {Object} params
 * @param {string} params.eventType - The domain event type
 * @param {string} params.aggregate - The aggregate name
 * @param {string} params.aggregateId - The aggregate instance ID
 * @param {Object} [params.payload={}] - The event-specific data
 * @param {string} [params.correlationId] - Root trace ID (defaults to eventId if root event)
 * @param {string} [params.causationId] - The eventId of the event that caused this one
 * @param {Object} [params.metadata={}] - Additional audit metadata
 * @param {string} [params.eventVersion='1.0'] - Schema version of this event type
 * @returns {Object} Frozen (immutable) event envelope
 */
function createEventEnvelope({
  eventType,
  aggregate,
  aggregateId,
  payload = {},
  correlationId = null,
  causationId = null,
  metadata = {},
  eventVersion = '1.0'
}) {
  if (!eventType) throw new Error('eventType is required');
  if (!aggregate) throw new Error('aggregate is required');
  if (!aggregateId) throw new Error('aggregateId is required');

  const eventId = crypto.randomUUID();

  const envelope = {
    eventId,
    eventType,
    eventVersion,
    aggregate,
    aggregateId,
    timestamp: new Date().toISOString(),
    correlationId: correlationId || eventId, // Root event → correlationId = own eventId
    causationId: causationId || null,
    payload: JSON.parse(JSON.stringify(payload)), // Deep clone for immutability
    metadata: {
      ...metadata,
      createdAt: new Date().toISOString()
    }
  };

  return Object.freeze(envelope);
}

/**
 * Validates an event envelope structure
 * @param {Object} envelope - The envelope to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateEnvelope(envelope) {
  const errors = [];

  if (!envelope) {
    return { valid: false, errors: ['Envelope is null or undefined'] };
  }

  if (!envelope.eventId) errors.push('Missing eventId');
  if (!envelope.eventType) errors.push('Missing eventType');
  if (!envelope.eventVersion) errors.push('Missing eventVersion');
  if (!envelope.aggregate) errors.push('Missing aggregate');
  if (!envelope.aggregateId) errors.push('Missing aggregateId');
  if (!envelope.timestamp) errors.push('Missing timestamp');
  if (!envelope.correlationId) errors.push('Missing correlationId');
  if (typeof envelope.payload !== 'object' || envelope.payload === null) {
    errors.push('payload must be a non-null object');
  }
  if (typeof envelope.metadata !== 'object' || envelope.metadata === null) {
    errors.push('metadata must be a non-null object');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  createEventEnvelope,
  validateEnvelope
};
