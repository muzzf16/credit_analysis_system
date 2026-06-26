"use strict";
const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const CapabilityBuilder = require('../../../src/modules/capabilities/builder/CapabilityBuilder');
const { instance: evaluatorRegistry } = require('../../../src/modules/capabilities/registry/evaluator.registry');
const { instance: definitionRegistry } = require('../../../src/modules/capabilities/registry/definition.registry');
const CapabilityDefinition = require('../../../src/modules/capabilities/entities/CapabilityDefinition');
const FinancialCapabilityEvaluator = require('../../../src/modules/capabilities/evaluators/FinancialCapabilityEvaluator');

describe('Capability Builder E2E Tests', () => {
  before(() => {
    // 1. Register Definition
    const financialDef = new CapabilityDefinition({
      code: 'FINANCIAL',
      name: 'Financial Capability',
      allowedStatuses: ['READY', 'LIMITED', 'INADEQUATE', 'UNKNOWN'],
      description: 'Capacity test'
    });
    if (!definitionRegistry.get('FINANCIAL')) {
      definitionRegistry.register(financialDef);
    }

    // 2. Register Evaluator
    if (!evaluatorRegistry.get('FINANCIAL')) {
      evaluatorRegistry.register(FinancialCapabilityEvaluator);
    }
  });

  test('CapabilityBuilder should evaluate FactCollection into CapabilityCollection', () => {
    // Mock FactCollection
    const mockFactCollection = {
      getAll: () => [],
      get: (code) => {
        if (code === 'FINANCIAL_CAPACITY') {
          return { code: 'FINANCIAL_CAPACITY', value: 'LIMITED' };
        }
        return null;
      }
    };

    const collection = CapabilityBuilder.build(mockFactCollection);
    
    const capabilities = collection.getAll();
    assert.strictEqual(capabilities.length, 1);
    
    const financialCap = collection.get('FINANCIAL');
    assert.strictEqual(financialCap.status, 'LIMITED');
    assert.strictEqual(financialCap.derivedFrom.includes('FINANCIAL_CAPACITY'), true);

    // Collection should be locked
    assert.throws(() => {
      collection.add(financialCap);
    }, /locked/);
  });
});
