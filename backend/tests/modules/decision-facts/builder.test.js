"use strict";
const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const DecisionFactsProjector = require('../../../src/modules/decision-facts/builder/DecisionFactsProjector');
const { instance: projectorRegistry } = require('../../../src/modules/decision-facts/registry/projector.registry');
const { instance: definitionRegistry } = require('../../../src/modules/decision-facts/registry/definition.registry');
const DecisionFactDefinition = require('../../../src/modules/decision-facts/entities/DecisionFactDefinition');
const FinancialEligibilityProjector = require('../../../src/modules/decision-facts/projectors/FinancialEligibilityProjector');

describe('DecisionFacts Projector E2E Tests', () => {
  before(() => {
    // 1. Register Definition
    const financialDef = new DecisionFactDefinition({
      code: 'FINANCIAL_ELIGIBILITY',
      name: 'Financial Eligibility',
      type: 'BOOLEAN',
      description: 'Capacity test'
    });
    if (!definitionRegistry.get('FINANCIAL_ELIGIBILITY')) {
      definitionRegistry.register(financialDef);
    }

    // 2. Register Projector
    if (!projectorRegistry.get('FINANCIAL_ELIGIBILITY')) {
      projectorRegistry.register(FinancialEligibilityProjector);
    }
  });

  test('DecisionFactsProjector should project CapabilityCollection into DecisionFactsCollection', () => {
    // Mock CapabilityCollection
    const mockCapabilityCollection = {
      getAll: () => [],
      get: (code) => {
        if (code === 'FINANCIAL') {
          return { code: 'FINANCIAL', status: 'READY' };
        }
        return null;
      }
    };

    const collection = DecisionFactsProjector.build(mockCapabilityCollection);
    
    const facts = collection.getAll();
    assert.strictEqual(facts.length, 1);
    
    const financialEligible = collection.get('FINANCIAL_ELIGIBILITY');
    assert.strictEqual(financialEligible.value, true);
    assert.strictEqual(financialEligible.derivedFrom.includes('FINANCIAL'), true);
    assert.strictEqual(financialEligible.reasonCodes.includes('FINANCIAL_READY'), true);

    // Collection should be locked
    assert.throws(() => {
      collection.add(financialEligible);
    }, /locked/);
  });
});
