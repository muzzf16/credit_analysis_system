"use strict";
const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const DecisionFactDefinition = require('../../../src/modules/decision-facts/entities/DecisionFactDefinition');
const { instance: definitionRegistry } = require('../../../src/modules/decision-facts/registry/definition.registry');
const DecisionFact = require('../../../src/modules/decision-facts/entities/DecisionFact');

describe('DecisionFact Definition and Entity Tests', () => {
  before(() => {
    const testDef = new DecisionFactDefinition({
      code: 'TEST_BOOL', name: 'Test Bool', type: 'BOOLEAN', description: 'Test'
    });
    definitionRegistry.register(testDef);
  });

  describe('DecisionFactDefinition Constraints', () => {
    test('Should throw if value violates type', () => {
      assert.throws(() => {
        new DecisionFact({ code: 'TEST_BOOL', value: 'TRUE', derivedFrom: [], reasonCodes: [] });
      }, /expects BOOLEAN/);
    });

    test('Should throw if derivedFrom is not an array', () => {
      assert.throws(() => {
        new DecisionFact({ code: 'TEST_BOOL', value: true, derivedFrom: 'CAP', reasonCodes: [] });
      }, /derivedFrom must be an array/);
    });
  });

  describe('DecisionFact Entity creation', () => {
    test('Should create and freeze DecisionFact if valid', () => {
      const df = new DecisionFact({ code: 'TEST_BOOL', value: true, derivedFrom: ['CAP_A'], reasonCodes: ['OK'] });
      
      assert.strictEqual(df.code, 'TEST_BOOL');
      assert.strictEqual(df.value, true);
      assert.strictEqual(df.derivedFrom.length, 1);
      assert.strictEqual(Object.isFrozen(df), true);
      assert.strictEqual(Object.isFrozen(df.derivedFrom), true);
    });
  });
});
