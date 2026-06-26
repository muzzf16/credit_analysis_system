"use strict";
const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const FactsBuilder = require('../../../src/modules/facts/builder/FactsBuilder');
const { instance: extractorRegistry } = require('../../../src/modules/facts/registry/extractor.registry');
const { instance: definitionRegistry } = require('../../../src/modules/facts/registry/definition.registry');
const FactDefinition = require('../../../src/modules/facts/entities/FactDefinition');
const FinancialFactsExtractor = require('../../../src/modules/facts/extractors/financial/FinancialFactsExtractor');

describe('Facts Builder E2E Tests', () => {
  before(() => {
    // 1. Register Definition
    const financialDef = new FactDefinition({
      code: 'FINANCIAL_CAPACITY',
      type: 'ENUM',
      allowedValues: ['ADEQUATE', 'LIMITED', 'INADEQUATE'],
      description: 'Capacity test'
    });
    if (!definitionRegistry.get('FINANCIAL_CAPACITY')) {
      definitionRegistry.register(financialDef);
    }

    // 2. Register Extractor
    if (!extractorRegistry.get('FINANCIAL')) {
      extractorRegistry.register(FinancialFactsExtractor);
    }
  });

  test('FactsBuilder should orchestrate pipeline result into FactCollection', () => {
    const pipelineResult = {
      pipeline: 'TEST_PLAN',
      stages: [
        {
          stage: 'FINANCIAL',
          status: 'PASSED',
          reasonCodes: ['DSR_OK']
        },
        {
          stage: 'UNKNOWN_STAGE',
          status: 'PASSED',
          reasonCodes: []
        }
      ]
    };

    const collection = FactsBuilder.build(pipelineResult);
    
    // Should skip UNKNOWN_STAGE, and translate FINANCIAL
    const facts = collection.getAll();
    assert.strictEqual(facts.length, 1);
    
    const capacityFact = collection.get('FINANCIAL_CAPACITY');
    assert.strictEqual(capacityFact.value, 'ADEQUATE');
    assert.strictEqual(capacityFact.evidence.includes('DSR_OK'), true);
    assert.strictEqual(capacityFact.source, 'FINANCIAL');

    // Collection should be locked
    assert.throws(() => {
      collection.add(capacityFact);
    }, /locked/);
  });
});
