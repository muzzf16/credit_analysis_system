/**
 * DeadLetterQueue — Independent component for handling failed event processing.
 * 
 * Captures events whose handlers threw exceptions during processing.
 * Separated from EventBus to maintain single-responsibility principle.
 * 
 * Future extensions:
 *   - Retry logic with exponential backoff
 *   - Alert integration (WA Gateway, email)
 *   - Monitoring dashboard integration
 */
class DeadLetterQueue {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxSize=500] - Maximum entries before oldest are dropped
   * @param {Function} [options.onDeadLetter] - Optional monitoring callback
   */
  constructor(options = {}) {
    this._queue = [];
    this._maxSize = options.maxSize || 500;
    this._onDeadLetter = options.onDeadLetter || null;
  }

  /**
   * Enqueue a failed event with error context
   * @param {Object} envelope - The event envelope that failed
   * @param {Error} error - The error that occurred during handling
   * @param {string} [handlerName='unknown'] - Name of the handler that failed
   */
  enqueue(envelope, error, handlerName = 'unknown') {
    const entry = {
      envelope,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      handlerName,
      failedAt: new Date().toISOString(),
      retryCount: 0
    };

    this._queue.push(entry);

    // Cap the queue size — drop oldest entries
    if (this._queue.length > this._maxSize) {
      this._queue.shift();
    }

    // Notify monitoring callback if registered
    if (this._onDeadLetter && typeof this._onDeadLetter === 'function') {
      try {
        this._onDeadLetter(entry);
      } catch (callbackError) {
        console.error('[DeadLetterQueue] Monitoring callback failed:', callbackError.message);
      }
    }

    console.error(
      `[DeadLetterQueue] Event ${envelope.eventType} (${envelope.eventId}) ` +
      `failed in handler '${handlerName}': ${error.message}`
    );
  }

  /**
   * Get all dead letter entries
   * @returns {Array} Copy of all dead letter entries
   */
  getAll() {
    return [...this._queue];
  }

  /**
   * Get dead letters filtered by event type
   * @param {string} eventType
   * @returns {Array}
   */
  getByEventType(eventType) {
    return this._queue.filter(entry => entry.envelope.eventType === eventType);
  }

  /**
   * Get the count of dead letters
   * @returns {number}
   */
  size() {
    return this._queue.length;
  }

  /**
   * Clear all dead letters
   */
  clear() {
    this._queue = [];
  }
}

module.exports = DeadLetterQueue;
