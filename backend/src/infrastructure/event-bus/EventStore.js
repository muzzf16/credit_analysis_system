/**
 * EventStore — Independent event persistence component.
 * 
 * Currently uses in-memory storage with indexed retrieval.
 * Contract is designed for future swap to PostgreSQL, JSONL, or Kafka
 * without changing the public API.
 * 
 * The EventStore is an append-only log from the Event Bus's perspective.
 * Read operations are for audit, replay, and debugging.
 */
class EventStore {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxSize=10000] - Maximum events before oldest are dropped
   */
  constructor(options = {}) {
    this._events = [];
    this._maxSize = options.maxSize || 10000;
    this._indices = {
      byType: new Map(),        // eventType → [index]
      byCorrelation: new Map(), // correlationId → [index]
      byAggregate: new Map()    // "aggregate:aggregateId" → [index]
    };
  }

  /**
   * Append an event to the store (immutable copy)
   * @param {Object} envelope - The event envelope to persist
   */
  append(envelope) {
    const index = this._events.length;

    // Deep freeze the stored copy to guarantee immutability
    const storedEvent = JSON.parse(JSON.stringify(envelope));
    Object.freeze(storedEvent);

    this._events.push(storedEvent);

    // Update indices
    this._addToIndex(this._indices.byType, envelope.eventType, index);
    this._addToIndex(this._indices.byCorrelation, envelope.correlationId, index);

    const aggregateKey = `${envelope.aggregate}:${envelope.aggregateId}`;
    this._addToIndex(this._indices.byAggregate, aggregateKey, index);

    // Cap size — remove oldest (acceptable for in-memory; production DB wouldn't need this)
    if (this._events.length > this._maxSize) {
      this._events.shift();
    }
  }

  /**
   * Get all stored events (ordered by insertion)
   * @returns {Array}
   */
  getAll() {
    return [...this._events];
  }

  /**
   * Get events by event type
   * @param {string} eventType
   * @returns {Array}
   */
  getByType(eventType) {
    const indices = this._indices.byType.get(eventType) || [];
    return indices.map(i => this._events[i]).filter(Boolean);
  }

  /**
   * Get events by correlationId (trace a full workflow chain)
   * @param {string} correlationId
   * @returns {Array}
   */
  getByCorrelation(correlationId) {
    const indices = this._indices.byCorrelation.get(correlationId) || [];
    return indices.map(i => this._events[i]).filter(Boolean);
  }

  /**
   * Get events by aggregate type and ID
   * @param {string} aggregate - Aggregate name (e.g., 'Application')
   * @param {string} aggregateId - Aggregate instance ID
   * @returns {Array}
   */
  getByAggregate(aggregate, aggregateId) {
    const key = `${aggregate}:${aggregateId}`;
    const indices = this._indices.byAggregate.get(key) || [];
    return indices.map(i => this._events[i]).filter(Boolean);
  }

  /**
   * Get the count of stored events
   * @returns {number}
   */
  size() {
    return this._events.length;
  }

  /**
   * Clear all stored events and indices (for testing)
   */
  clear() {
    this._events = [];
    this._indices.byType.clear();
    this._indices.byCorrelation.clear();
    this._indices.byAggregate.clear();
  }

  /** @private */
  _addToIndex(indexMap, key, index) {
    if (!key) return;
    if (!indexMap.has(key)) {
      indexMap.set(key, []);
    }
    indexMap.get(key).push(index);
  }
}

module.exports = EventStore;
