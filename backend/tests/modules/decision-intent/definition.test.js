"use strict";
const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const DecisionIntentDefinition = require('../../../src/modules/decision-intent/entities/DecisionIntentDefinition');
const { instance: definitionRegistry } = require('../../../src/modules/decision-intent/registry/definition.registry');
const DecisionIntent = require('../../../src/modules/decision-intent/entities/DecisionIntent');

describe('DecisionIntent Definition and Entity Tests', () => {
  before(() => {
    const testDef = new DecisionIntentDefinition({
      code: 'TEST_INTENT',
      allowedRecommendations: ['APPROVE', 'REJECT'],
      allowedRiskLevels: ['LOW', 'HIGH']
    });
    definitionRegistry.register(testDef);
  });

  describe('DecisionIntentDefinition Constraints', () => {
    test('Should throw if recommendation violates allowedRecommendations', () => {
      assert.throws(() => {
        new DecisionIntent({
          code: 'TEST_INTENT', recommendation: 'APPROVE_WITH_CONDITION', riskLevel: 'LOW', authority: 'KOMITE', conditions: [], derivedFrom: []
        });
      }, /recommendation 'APPROVE_WITH_CONDITION' is not allowed/);
    });

    test('Should throw if riskLevel violates allowedRiskLevels', () => {
      assert.throws(() => {
        new DecisionIntent({
          code: 'TEST_INTENT', recommendation: 'APPROVE', riskLevel: 'MEDIUM', authority: 'KOMITE', conditions: [], derivedFrom: []
        });
      }, /riskLevel 'MEDIUM' is not allowed/);
    });
  });

  describe('DecisionIntent Entity creation', () => {
    test('Should create and freeze DecisionIntent if valid', () => {
      const intent = new DecisionIntent({
        code: 'TEST_INTENT',
        recommendation: 'APPROVE',
        riskLevel: 'LOW',
        authority: 'KOMITE',
        manualReview: false,
        conditions: [{ code: 'INSURANCE', severity: 'HIGH', source: 'POLICY', description: 'desc' }],
        derivedFrom: ['FINANCIAL_ELIGIBILITY']
      });
      
      assert.strictEqual(intent.code, 'TEST_INTENT');
      assert.strictEqual(intent.recommendation, 'APPROVE');
      assert.strictEqual(intent.conditions.length, 1);
      assert.strictEqual(Object.isFrozen(intent), true);
      assert.strictEqual(Object.isFrozen(intent.conditions), true);
      assert.strictEqual(Object.isFrozen(intent.conditions[0]), true);
    });
  });
});
