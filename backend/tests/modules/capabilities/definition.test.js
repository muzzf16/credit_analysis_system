"use strict";
const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const CapabilityDefinition = require('../../../src/modules/capabilities/entities/CapabilityDefinition');
const { instance: definitionRegistry } = require('../../../src/modules/capabilities/registry/definition.registry');
const Capability = require('../../../src/modules/capabilities/entities/Capability');

describe('Capability Definition and Entity Tests', () => {
  before(() => {
    const testDef = new CapabilityDefinition({
      code: 'TEST_CAPABILITY', name: 'Test Capability', allowedStatuses: ['READY', 'LIMITED'], description: 'Test'
    });
    definitionRegistry.register(testDef);
  });

  describe('CapabilityDefinition Constraints', () => {
    test('Should throw if status violates allowedStatuses', () => {
      assert.throws(() => {
        new Capability({ code: 'TEST_CAPABILITY', status: 'INADEQUATE', derivedFrom: [] });
      }, /not in allowedStatuses/);
    });

    test('Should throw if derivedFrom is not an array', () => {
      assert.throws(() => {
        new Capability({ code: 'TEST_CAPABILITY', status: 'READY', derivedFrom: 'FACT' });
      }, /derivedFrom must be an array/);
    });
  });

  describe('Capability Entity creation', () => {
    test('Should create and freeze Capability if valid', () => {
      const cap = new Capability({ code: 'TEST_CAPABILITY', status: 'READY', derivedFrom: ['FACT_A'] });
      
      assert.strictEqual(cap.code, 'TEST_CAPABILITY');
      assert.strictEqual(cap.status, 'READY');
      assert.strictEqual(cap.derivedFrom.length, 1);
      assert.strictEqual(Object.isFrozen(cap), true);
      assert.strictEqual(Object.isFrozen(cap.derivedFrom), true);
    });
  });
});
