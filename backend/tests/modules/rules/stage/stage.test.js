const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const BaseStage = require('../../../../src/modules/rules/stage/BaseStage');
const FinancialStage = require('../../../../src/modules/rules/stage/financial/FinancialStage');
const BaseRule = require('../../../../src/modules/rules/library/BaseRule');
const { instance: ruleRegistry } = require('../../../../src/modules/rules/registry/rule.registry');
const RuleResolver = require('../../../../src/modules/rules/resolver/rule.resolver');

describe('Stage Engine Tests', () => {
  before(() => {
    // Mock Rules for testing the stage orchestrator
    class MockPassRule extends BaseRule {
      static get metadata() { return { code: 'MOCK_PASS', category: 'FINANCIAL', version: '1', severity: 'LOW' }; }
      static _evaluate() { return { passed: true, metrics: [{ code: 'M', value: 1 }], reasonCodes: ['PASS_OK'] }; }
    }
    class MockFailRule extends BaseRule {
      static get metadata() { return { code: 'MOCK_FAIL', category: 'FINANCIAL', version: '1', severity: 'HIGH' }; }
      static _evaluate() { return { passed: false, metrics: [{ code: 'M', value: 0 }], reasonCodes: ['FAIL_BAD'] }; }
    }
    class MockCrashRule extends BaseRule {
      static get metadata() { return { code: 'MOCK_CRASH', category: 'FINANCIAL', version: '1', severity: 'HIGH' }; }
      static _evaluate() { throw new Error('Simulated crash'); }
    }

    if (!ruleRegistry.get('MOCK_PASS')) ruleRegistry.register(MockPassRule);
    if (!ruleRegistry.get('MOCK_FAIL')) ruleRegistry.register(MockFailRule);
    if (!ruleRegistry.get('MOCK_CRASH')) ruleRegistry.register(MockCrashRule);
  });

  describe('Contract and Validation', () => {
    test('Should throw if metadata is missing', () => {
      class BadStage extends BaseStage {}
      assert.throws(() => BadStage.metadata, /Subclass must implement/);
    });

    test('Should throw if context is missing or incomplete', () => {
      assert.throws(() => FinancialStage.execute({}), /execution failed: Missing assessment or stageProfile/);
    });
  });

  describe('FinancialStage Orchestration', () => {
    test('Should aggregate passing rules correctly', () => {
      const context = {
        assessment: {},
        stageProfile: { rules: [{ code: 'MOCK_PASS' }] },
        execution: { correlationId: '123', startedAt: Date.now() }
      };

      const result = FinancialStage.execute(context);
      
      assert.strictEqual(result.stage, 'FINANCIAL');
      assert.strictEqual(result.status, 'PASSED');
      assert.strictEqual(result.score, 100);
      assert.strictEqual(result.summary.rulesExecuted, 1);
      assert.strictEqual(result.summary.rulesPassed, 1);
      assert.strictEqual(result.summary.rulesFailed, 0);
      assert.strictEqual(result.metrics.length, 1);
      assert.strictEqual(result.reasonCodes.includes('PASS_OK'), true);
      assert.strictEqual(result.executionTrace.length, 1);
      assert.strictEqual(result.executionTrace[0].passed, true);
    });

    test('Should aggregate failing rules correctly', () => {
      const context = {
        assessment: {},
        stageProfile: { rules: [{ code: 'MOCK_PASS' }, { code: 'MOCK_FAIL' }] },
        execution: { correlationId: '123' }
      };

      const result = FinancialStage.execute(context);
      
      assert.strictEqual(result.status, 'FAILED');
      assert.strictEqual(result.score, 0);
      assert.strictEqual(result.summary.rulesExecuted, 2);
      assert.strictEqual(result.summary.rulesPassed, 1);
      assert.strictEqual(result.summary.rulesFailed, 1);
      assert.strictEqual(result.reasonCodes.includes('FAIL_BAD'), true);
      assert.strictEqual(result.executionTrace.length, 2);
    });

    test('Should handle crashing rules gracefully without crashing the whole stage', () => {
      const context = {
        assessment: {},
        stageProfile: { rules: [{ code: 'MOCK_CRASH' }] },
        execution: { correlationId: '123' }
      };

      const result = FinancialStage.execute(context);
      
      assert.strictEqual(result.status, 'FAILED');
      assert.strictEqual(result.summary.rulesFailed, 1);
      // The stage catches the error and injects a generic failure reason
      assert.strictEqual(result.reasonCodes.includes('MOCK_CRASH_EXECUTION_ERROR'), true);
      assert.strictEqual(result.executionTrace[0].passed, false);
    });
  });
});
