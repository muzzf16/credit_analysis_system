"use strict";
const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const BaseExtractor = require('../../../src/modules/facts/extractors/BaseExtractor');
const FactDefinition = require('../../../src/modules/facts/entities/FactDefinition');
const { instance: definitionRegistry } = require('../../../src/modules/facts/registry/definition.registry');
const Fact = require('../../../src/modules/facts/entities/Fact');

describe('Extractor Tests', () => {
  before(() => {
    // We need a definition for testing extraction
    const def = new FactDefinition({
      code: 'TEST_FACT', type: 'STRING', description: 'Test Fact String'
    });
    definitionRegistry.register(def);
  });

  describe('BaseExtractor Contract', () => {
    class MockExtractor extends BaseExtractor {
      static get metadata() { return { stage: 'MOCK' }; }
      static _extractFacts(stageResult) {
        return [{ code: 'TEST_FACT', value: stageResult.status === 'PASSED' ? 'OK' : 'BAD' }];
      }
    }

    test('Should throw if stageResult is invalid', () => {
      assert.throws(() => MockExtractor.extract({}), /Invalid stageResult/);
    });

    test('Should return array of Fact Entities', () => {
      const facts = MockExtractor.extract({ stage: 'MOCK', status: 'PASSED' });
      assert.strictEqual(Array.isArray(facts), true);
      assert.strictEqual(facts[0] instanceof Fact, true);
      assert.strictEqual(facts[0].code, 'TEST_FACT');
      assert.strictEqual(facts[0].value, 'OK');
      assert.strictEqual(facts[0].source, 'MOCK');
    });
  });
});
