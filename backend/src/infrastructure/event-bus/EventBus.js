const EventEmitter = require('events');
const { validateEnvelope } = require('./EventEnvelope');
const EventStore = require('./EventStore');
const DeadLetterQueue = require('./DeadLetterQueue');

/**
 * EventBus — Pure publish/subscribe infrastructure.
 * 
 * ┌──────────────────────────────────────────────────────────┐
 * │  The Event Bus has ZERO business logic.                  │
 * │  It only:                                                │
 * │    1. Validates event envelope structure                  │
 * │    2. Forwards events to EventStore for persistence       │
 * │    3. Dispatches events to registered subscribers         │
 * │    4. Routes failed handler executions to DeadLetterQueue │
 * │                                                          │
 * │  All workflow sequencing belongs in the Orchestrator,     │
 * │  NOT here.                                               │
 * └──────────────────────────────────────────────────────────┘
 * 
 * Singleton pattern — use EventBus.getInstance()
 */
class EventBus extends EventEmitter {
  /**
   * @param {Object} [options]
   * @param {EventStore} [options.eventStore] - Custom EventStore instance
   * @param {DeadLetterQueue} [options.deadLetterQueue] - Custom DLQ instance
   */
  constructor(options = {}) {
    super();
    this._eventStore = options.eventStore || new EventStore();
    this._deadLetterQueue = options.deadLetterQueue || new DeadLetterQueue();
    this._handlers = new Map(); // eventType → [{name, handler}]
  }

  /**
   * Get the singleton instance
   * @param {Object} [options] - Only used on first call
   * @returns {EventBus}
   */
  static getInstance(options = {}) {
    if (!EventBus._instance) {
      EventBus._instance = new EventBus(options);
    }
    return EventBus._instance;
  }

  /**
   * Reset the singleton instance (for testing only)
   */
  static resetInstance() {
    if (EventBus._instance) {
      EventBus._instance.removeAllListeners();
      EventBus._instance._handlers.clear();
      EventBus._instance._eventStore.clear();
      EventBus._instance._deadLetterQueue.clear();
    }
    EventBus._instance = null;
  }

  /**
   * Publish an event envelope to the bus.
   * 
   * Flow: validate → persist to EventStore → dispatch to subscribers → DLQ on error
   * 
   * @param {Object} envelope - A valid event envelope (created via createEventEnvelope)
   * @throws {Error} If envelope is structurally invalid
   */
  publish(envelope) {
    // 1. Validate structure
    const validation = validateEnvelope(envelope);
    if (!validation.valid) {
      throw new Error(`Invalid event envelope: ${validation.errors.join(', ')}`);
    }

    // 2. Persist to EventStore
    this._eventStore.append(envelope);

    // 3. Dispatch to named subscribers
    const handlers = this._handlers.get(envelope.eventType) || [];
    for (const { name, handler } of handlers) {
      try {
        handler(envelope);
      } catch (error) {
        this._deadLetterQueue.enqueue(envelope, error, name);
      }
    }

    // 4. Also emit via EventEmitter for low-level listeners
    this.emit(envelope.eventType, envelope);
  }

  /**
   * Subscribe a named handler to an event type.
   * 
   * Named handlers enable better DLQ diagnostics and debugging.
   * 
   * @param {string} eventType - The event type to subscribe to
   * @param {string} handlerName - A descriptive name for the handler
   * @param {Function} handler - The handler function (receives envelope)
   */
  subscribe(eventType, handlerName, handler) {
    if (!eventType) throw new Error('eventType is required');
    if (!handlerName) throw new Error('handlerName is required');
    if (typeof handler !== 'function') throw new Error('handler must be a function');

    if (!this._handlers.has(eventType)) {
      this._handlers.set(eventType, []);
    }
    this._handlers.get(eventType).push({ name: handlerName, handler });
  }

  /**
   * Get the EventStore instance
   * @returns {EventStore}
   */
  getEventStore() {
    return this._eventStore;
  }

  /**
   * Get the DeadLetterQueue instance
   * @returns {DeadLetterQueue}
   */
  getDeadLetterQueue() {
    return this._deadLetterQueue;
  }
}

// Initialize singleton as null
EventBus._instance = null;

module.exports = EventBus;
