const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const EventBus = require('../../src/infrastructure/event-bus/EventBus');
const { createEventEnvelope, validateEnvelope } = require('../../src/infrastructure/event-bus/EventEnvelope');
const EventStore = require('../../src/infrastructure/event-bus/EventStore');
const DeadLetterQueue = require('../../src/infrastructure/event-bus/DeadLetterQueue');

// ═══════════════════════════════════════════════════════════════
//  EventEnvelope Tests
// ═══════════════════════════════════════════════════════════════

describe('EventEnvelope', () => {

  test('Should create a valid event envelope with all canonical fields', () => {
    const envelope = createEventEnvelope({
      eventType: 'TestEvent',
      aggregate: 'TestAggregate',
      aggregateId: 'TEST-001',
      payload: { key: 'value' },
      metadata: { pipelineFingerprint: 'fp-001' }
    });

    assert.ok(envelope.eventId, 'Should have eventId');
    assert.strictEqual(envelope.eventType, 'TestEvent');
    assert.strictEqual(envelope.eventVersion, '1.0');
    assert.strictEqual(envelope.aggregate, 'TestAggregate');
    assert.strictEqual(envelope.aggregateId, 'TEST-001');
    assert.ok(envelope.timestamp, 'Should have timestamp');
    assert.strictEqual(envelope.correlationId, envelope.eventId, 'Root event correlationId = own eventId');
    assert.strictEqual(envelope.causationId, null, 'Root event has no causation');
    assert.deepStrictEqual(envelope.payload, { key: 'value' });
    assert.strictEqual(envelope.metadata.pipelineFingerprint, 'fp-001');
    assert.ok(envelope.metadata.createdAt, 'Should have metadata.createdAt');
  });

  test('Should carry correlationId and causationId for child events', () => {
    const envelope = createEventEnvelope({
      eventType: 'ChildEvent',
      aggregate: 'Test',
      aggregateId: 'T-001',
      correlationId: 'ROOT-CORR-ID',
      causationId: 'PARENT-EVENT-ID'
    });

    assert.strictEqual(envelope.correlationId, 'ROOT-CORR-ID');
    assert.strictEqual(envelope.causationId, 'PARENT-EVENT-ID');
  });

  test('Should support custom eventVersion', () => {
    const envelope = createEventEnvelope({
      eventType: 'VersionedEvent',
      aggregate: 'Test',
      aggregateId: 'T-001',
      eventVersion: '2.0'
    });

    assert.strictEqual(envelope.eventVersion, '2.0');
  });

  test('Should be immutable (Object.freeze)', () => {
    const envelope = createEventEnvelope({
      eventType: 'TestEvent',
      aggregate: 'Test',
      aggregateId: 'T-001'
    });

    assert.ok(Object.isFrozen(envelope), 'Envelope must be frozen');
    
    // In non-strict mode, assignment to frozen object silently fails
    // Verify the value does NOT change
    envelope.eventType = 'TAMPERED';
    assert.strictEqual(envelope.eventType, 'TestEvent', 'Frozen property should not be mutated');
  });

  test('Should deep clone payload for immutability', () => {
    const originalPayload = { nested: { value: 'original' } };
    const envelope = createEventEnvelope({
      eventType: 'TestEvent',
      aggregate: 'Test',
      aggregateId: 'T-001',
      payload: originalPayload
    });

    // Mutating original should NOT affect envelope
    originalPayload.nested.value = 'mutated';
    assert.strictEqual(envelope.payload.nested.value, 'original', 'Payload must be deep cloned');
  });

  test('Should throw on missing required fields', () => {
    assert.throws(() => createEventEnvelope({ aggregate: 'Test', aggregateId: 'T-001' }), /eventType/);
    assert.throws(() => createEventEnvelope({ eventType: 'Test', aggregateId: 'T-001' }), /aggregate/);
    assert.throws(() => createEventEnvelope({ eventType: 'Test', aggregate: 'Test' }), /aggregateId/);
  });

  test('Should validate a correct envelope', () => {
    const valid = createEventEnvelope({
      eventType: 'TestEvent',
      aggregate: 'Test',
      aggregateId: 'T-001'
    });

    const result = validateEnvelope(valid);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  test('Should detect invalid envelope with missing fields', () => {
    const result = validateEnvelope({ eventType: 'Test' });
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.length > 0);
  });

  test('Should detect null envelope', () => {
    const result = validateEnvelope(null);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.errors[0], 'Envelope is null or undefined');
  });
});

// ═══════════════════════════════════════════════════════════════
//  DeadLetterQueue Tests
// ═══════════════════════════════════════════════════════════════

describe('DeadLetterQueue', () => {

  test('Should enqueue failed events with full error context', () => {
    const dlq = new DeadLetterQueue();
    const envelope = createEventEnvelope({
      eventType: 'FailedEvent',
      aggregate: 'Test',
      aggregateId: 'T-001'
    });

    dlq.enqueue(envelope, new Error('Handler crashed'), 'TestHandler');

    assert.strictEqual(dlq.size(), 1);
    const entries = dlq.getAll();
    assert.strictEqual(entries[0].handlerName, 'TestHandler');
    assert.strictEqual(entries[0].error.message, 'Handler crashed');
    assert.ok(entries[0].failedAt, 'Should have failedAt timestamp');
    assert.strictEqual(entries[0].retryCount, 0);
  });

  test('Should filter by event type', () => {
    const dlq = new DeadLetterQueue();

    dlq.enqueue(
      createEventEnvelope({ eventType: 'TypeA', aggregate: 'T', aggregateId: '1' }),
      new Error('err'), 'h1'
    );
    dlq.enqueue(
      createEventEnvelope({ eventType: 'TypeB', aggregate: 'T', aggregateId: '2' }),
      new Error('err'), 'h2'
    );

    assert.strictEqual(dlq.getByEventType('TypeA').length, 1);
    assert.strictEqual(dlq.getByEventType('TypeB').length, 1);
    assert.strictEqual(dlq.getByEventType('TypeC').length, 0);
  });

  test('Should cap queue size and drop oldest', () => {
    const dlq = new DeadLetterQueue({ maxSize: 3 });

    for (let i = 0; i < 5; i++) {
      dlq.enqueue(
        createEventEnvelope({ eventType: `Test-${i}`, aggregate: 'T', aggregateId: `${i}` }),
        new Error('err'), 'h'
      );
    }

    assert.strictEqual(dlq.size(), 3);
    // Oldest (0 and 1) should be dropped
    const entries = dlq.getAll();
    assert.strictEqual(entries[0].envelope.eventType, 'Test-2');
  });

  test('Should trigger monitoring callback on dead letter', () => {
    let callbackEntry = null;
    const dlq = new DeadLetterQueue({
      onDeadLetter: (entry) => { callbackEntry = entry; }
    });

    dlq.enqueue(
      createEventEnvelope({ eventType: 'MonitoredEvent', aggregate: 'T', aggregateId: '1' }),
      new Error('monitoring test'), 'h'
    );

    assert.ok(callbackEntry, 'Monitoring callback should have been called');
    assert.strictEqual(callbackEntry.error.message, 'monitoring test');
  });

  test('Should clear all entries', () => {
    const dlq = new DeadLetterQueue();
    dlq.enqueue(
      createEventEnvelope({ eventType: 'Test', aggregate: 'T', aggregateId: '1' }),
      new Error('err'), 'h'
    );
    
    assert.strictEqual(dlq.size(), 1);
    dlq.clear();
    assert.strictEqual(dlq.size(), 0);
  });
});

// ═══════════════════════════════════════════════════════════════
//  EventStore Tests
// ═══════════════════════════════════════════════════════════════

describe('EventStore', () => {

  test('Should append and retrieve events', () => {
    const store = new EventStore();
    const envelope = createEventEnvelope({
      eventType: 'TestEvent',
      aggregate: 'Test',
      aggregateId: 'T-001'
    });

    store.append(envelope);

    assert.strictEqual(store.size(), 1);
    assert.strictEqual(store.getAll()[0].eventType, 'TestEvent');
  });

  test('Should retrieve by event type', () => {
    const store = new EventStore();

    store.append(createEventEnvelope({ eventType: 'TypeA', aggregate: 'T', aggregateId: '1' }));
    store.append(createEventEnvelope({ eventType: 'TypeB', aggregate: 'T', aggregateId: '2' }));
    store.append(createEventEnvelope({ eventType: 'TypeA', aggregate: 'T', aggregateId: '3' }));

    assert.strictEqual(store.getByType('TypeA').length, 2);
    assert.strictEqual(store.getByType('TypeB').length, 1);
    assert.strictEqual(store.getByType('TypeC').length, 0);
  });

  test('Should retrieve by correlationId (workflow trace)', () => {
    const store = new EventStore();

    store.append(createEventEnvelope({ eventType: 'E1', aggregate: 'T', aggregateId: '1', correlationId: 'CORR-001' }));
    store.append(createEventEnvelope({ eventType: 'E2', aggregate: 'T', aggregateId: '2', correlationId: 'CORR-001' }));
    store.append(createEventEnvelope({ eventType: 'E3', aggregate: 'T', aggregateId: '3', correlationId: 'CORR-002' }));

    assert.strictEqual(store.getByCorrelation('CORR-001').length, 2);
    assert.strictEqual(store.getByCorrelation('CORR-002').length, 1);
    assert.strictEqual(store.getByCorrelation('NONEXISTENT').length, 0);
  });

  test('Should retrieve by aggregate type and ID', () => {
    const store = new EventStore();

    store.append(createEventEnvelope({ eventType: 'E1', aggregate: 'Application', aggregateId: 'APP-001' }));
    store.append(createEventEnvelope({ eventType: 'E2', aggregate: 'Case', aggregateId: 'CASE-001' }));
    store.append(createEventEnvelope({ eventType: 'E3', aggregate: 'Application', aggregateId: 'APP-001' }));

    assert.strictEqual(store.getByAggregate('Application', 'APP-001').length, 2);
    assert.strictEqual(store.getByAggregate('Case', 'CASE-001').length, 1);
    assert.strictEqual(store.getByAggregate('Assessment', 'X').length, 0);
  });

  test('Should store frozen copies (immutability)', () => {
    const store = new EventStore();
    const envelope = createEventEnvelope({ eventType: 'Test', aggregate: 'T', aggregateId: '1' });

    store.append(envelope);

    const retrieved = store.getAll()[0];
    assert.ok(Object.isFrozen(retrieved), 'Stored events must be frozen');
  });

  test('Should clear all events and indices', () => {
    const store = new EventStore();
    store.append(createEventEnvelope({ eventType: 'Test', aggregate: 'T', aggregateId: '1' }));

    assert.strictEqual(store.size(), 1);
    store.clear();
    assert.strictEqual(store.size(), 0);
    assert.strictEqual(store.getByType('Test').length, 0);
  });
});

// ═══════════════════════════════════════════════════════════════
//  EventBus Tests
// ═══════════════════════════════════════════════════════════════

describe('EventBus', () => {

  beforeEach(() => {
    EventBus.resetInstance();
  });

  test('Should be a singleton', () => {
    const bus1 = EventBus.getInstance();
    const bus2 = EventBus.getInstance();
    assert.strictEqual(bus1, bus2, 'getInstance should return the same instance');
  });

  test('Should reset singleton correctly', () => {
    const bus1 = EventBus.getInstance();
    EventBus.resetInstance();
    const bus2 = EventBus.getInstance();
    assert.notStrictEqual(bus1, bus2, 'After reset, should get a new instance');
  });

  test('Should publish and deliver events to named subscribers', () => {
    const bus = EventBus.getInstance();
    let received = null;

    bus.subscribe('TestEvent', 'TestHandler', (envelope) => {
      received = envelope;
    });

    const envelope = createEventEnvelope({
      eventType: 'TestEvent',
      aggregate: 'Test',
      aggregateId: 'T-001',
      payload: { data: 'hello' }
    });

    bus.publish(envelope);

    assert.ok(received, 'Handler should have been called');
    assert.strictEqual(received.eventType, 'TestEvent');
    assert.deepStrictEqual(received.payload, { data: 'hello' });
  });

  test('Should deliver to multiple subscribers of the same event', () => {
    const bus = EventBus.getInstance();
    let count = 0;

    bus.subscribe('TestEvent', 'Handler1', () => { count++; });
    bus.subscribe('TestEvent', 'Handler2', () => { count++; });

    bus.publish(createEventEnvelope({
      eventType: 'TestEvent',
      aggregate: 'Test',
      aggregateId: 'T-001'
    }));

    assert.strictEqual(count, 2);
  });

  test('Should persist events to EventStore automatically', () => {
    const bus = EventBus.getInstance();

    bus.publish(createEventEnvelope({
      eventType: 'TestEvent',
      aggregate: 'Test',
      aggregateId: 'T-001'
    }));

    const store = bus.getEventStore();
    assert.strictEqual(store.size(), 1);
    assert.strictEqual(store.getAll()[0].eventType, 'TestEvent');
  });

  test('Should route handler errors to DeadLetterQueue (not throw)', () => {
    const bus = EventBus.getInstance();

    bus.subscribe('TestEvent', 'FailingHandler', () => {
      throw new Error('Handler crashed');
    });

    const envelope = createEventEnvelope({
      eventType: 'TestEvent',
      aggregate: 'Test',
      aggregateId: 'T-001'
    });

    // Should NOT throw — error is caught and routed to DLQ
    assert.doesNotThrow(() => bus.publish(envelope));

    const dlq = bus.getDeadLetterQueue();
    assert.strictEqual(dlq.size(), 1);
    assert.strictEqual(dlq.getAll()[0].error.message, 'Handler crashed');
    assert.strictEqual(dlq.getAll()[0].handlerName, 'FailingHandler');
  });

  test('Should continue delivering to other handlers after one fails', () => {
    const bus = EventBus.getInstance();
    let handler2Called = false;

    bus.subscribe('TestEvent', 'FailingHandler', () => { throw new Error('fail'); });
    bus.subscribe('TestEvent', 'SuccessHandler', () => { handler2Called = true; });

    bus.publish(createEventEnvelope({
      eventType: 'TestEvent',
      aggregate: 'Test',
      aggregateId: 'T-001'
    }));

    assert.strictEqual(handler2Called, true, 'Second handler should still execute');
  });

  test('Should reject invalid envelopes with descriptive error', () => {
    const bus = EventBus.getInstance();

    assert.throws(() => bus.publish({}), /Invalid event envelope/);
    assert.throws(() => bus.publish({ eventType: 'Test' }), /Invalid event envelope/);
  });

  test('Should validate subscribe parameters', () => {
    const bus = EventBus.getInstance();

    assert.throws(() => bus.subscribe(null, 'name', () => {}), /eventType is required/);
    assert.throws(() => bus.subscribe('type', null, () => {}), /handlerName is required/);
    assert.throws(() => bus.subscribe('type', 'name', 'not a function'), /handler must be a function/);
  });

  test('EventBus has ZERO business logic — pure pub/sub only', () => {
    const bus = EventBus.getInstance();

    // Without any workflow registered, publishing an event should NOT trigger cascades
    let cascadeTriggered = false;
    bus.subscribe('CreditCaseBuilt', 'Monitor', () => { cascadeTriggered = true; });

    bus.publish(createEventEnvelope({
      eventType: 'ApplicationSubmitted',
      aggregate: 'Application',
      aggregateId: 'APP-ORPHAN',
      payload: { application: { applicationId: 'APP-ORPHAN' } }
    }));

    assert.strictEqual(cascadeTriggered, false,
      'EventBus must NOT cascade events without an Orchestrator — it has zero business logic');
  });
});
