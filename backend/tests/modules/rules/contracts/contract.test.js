const { test, describe } = require('node:test');
const assert = require('node:assert');
const BaseFormula = require('../../../../src/modules/rules/formulas/BaseFormula');
const BaseRule = require('../../../../src/modules/rules/library/BaseRule');

describe('Contract Tests', () => {
  describe('BaseFormula Contract', () => {
    test('Should throw if metadata is missing', () => {
      class BadFormula extends BaseFormula {}
      assert.throws(() => BadFormula.metadata, /Subclass must implement/);
    });

    test('Should throw if metadata violates schema', () => {
      class BadFormula extends BaseFormula {
        static get metadata() { return { code: 'TEST' }; } // missing version and unit
      }
      assert.throws(() => BadFormula.validateContract(), /invalid metadata/);
    });

    test('Should throw if compute is missing', () => {
      class TestFormula extends BaseFormula {
        static get metadata() { return { code: 'TEST', version: '1', unit: 'PERCENT' }; }
      }
      assert.throws(() => TestFormula.execute({}), /Subclass must implement/);
    });

    test('Should format and validate output', () => {
      class GoodFormula extends BaseFormula {
        static get metadata() { return { code: 'TEST', version: '1', unit: 'PERCENT', precision: 1 }; }
        static _compute() { return 10.45; } // Will be rounded to 10.5
      }
      const result = GoodFormula.execute({});
      assert.strictEqual(result.code, 'TEST');
      assert.strictEqual(result.value, 10.5);
      assert.strictEqual(result.unit, 'PERCENT');
    });
  });

  describe('BaseRule Contract', () => {
    test('Should throw if metadata is missing', () => {
      class BadRule extends BaseRule {}
      assert.throws(() => BadRule.metadata, /Subclass must implement/);
    });

    test('Should require complete context (assessment and stageProfile)', () => {
      class TestRule extends BaseRule {
        static get metadata() { return { code: 'TEST_RULE', category: 'FINANCIAL', version: '1', severity: 'HIGH' }; }
        static _evaluate() { return { passed: true, metrics: [{code:'X', value: 1}], reasonCodes: [] }; }
      }
      // Missing assessment or stageProfile in context
      assert.throws(() => TestRule.execute({ assessment: {} }), /Missing assessment or stageProfile context/);
    });

    test('Should validate structured output', () => {
      class BadRule extends BaseRule {
        static get metadata() { return { code: 'TEST_RULE', category: 'FINANCIAL', version: '1', severity: 'HIGH' }; }
        static _evaluate() { return { passed: true }; } // Missing metrics and reasonCodes
      }
      assert.throws(() => BadRule.execute({ assessment: {}, stageProfile: {} }), /produced invalid result/);
    });

    test('Should pass for valid structured output', () => {
      class GoodRule extends BaseRule {
        static get metadata() { return { code: 'TEST_RULE', category: 'FINANCIAL', version: '1', severity: 'HIGH' }; }
        static _evaluate() { return { passed: true, metrics: [{code: 'TEST', value: 1}], reasonCodes: ['OK'] }; }
      }
      const result = GoodRule.execute({ assessment: {}, stageProfile: {} });
      assert.strictEqual(result.passed, true);
      assert.strictEqual(result.metrics.length, 1);
    });
  });
});
