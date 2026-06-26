"use strict";
const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const DecisionIntentBuilder = require('../../../src/modules/decision-intent/builder/DecisionIntentBuilder');
const { instance: projectorRegistry } = require('../../../src/modules/decision-intent/registry/projector.registry');
const { instance: definitionRegistry } = require('../../../src/modules/decision-intent/registry/definition.registry');
const DecisionIntentDefinition = require('../../../src/modules/decision-intent/entities/DecisionIntentDefinition');
const StandardIntentProjector = require('../../../src/modules/decision-intent/projectors/StandardIntentProjector');

describe('DecisionIntent Builder E2E Tests', () => {
  before(() => {
    // 1. Register Definition
    const intentDef = new DecisionIntentDefinition({
      code: 'STANDARD_INTENT',
      allowedRecommendations: ['APPROVE', 'APPROVE_WITH_CONDITION', 'MANUAL_REVIEW', 'REJECT'],
      allowedRiskLevels: ['LOW', 'MEDIUM', 'HIGH']
    });
    if (!definitionRegistry.get('STANDARD_INTENT')) {
      definitionRegistry.register(intentDef);
    }

    // 2. Register Projector
    if (!projectorRegistry.get('STANDARD_INTENT')) {
      projectorRegistry.register(StandardIntentProjector);
    }
  });

  test('DecisionIntentBuilder should delegate to Projector and return DecisionIntent', () => {
    // Mock DecisionFactsCollection
    const mockDecisionFactsCollection = {
      getAll: () => [],
      get: (code) => {
        if (code === 'FINANCIAL_ELIGIBILITY') {
          return { code: 'FINANCIAL_ELIGIBILITY', value: false }; // Represents a failure
        }
        return null;
      }
    };

    const intent = DecisionIntentBuilder.build('STANDARD_INTENT', mockDecisionFactsCollection);
    
    assert.strictEqual(intent.code, 'STANDARD_INTENT');
    assert.strictEqual(intent.recommendation, 'APPROVE_WITH_CONDITION');
    assert.strictEqual(intent.riskLevel, 'MEDIUM');
    assert.strictEqual(intent.manualReview, true);
    assert.strictEqual(intent.conditions.length, 1);
    assert.strictEqual(intent.conditions[0].code, 'FINANCIAL_REVIEW_REQUIRED');
    assert.strictEqual(intent.derivedFrom.includes('FINANCIAL_ELIGIBILITY'), true);
  });
});
