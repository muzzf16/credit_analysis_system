const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const DSRMaximumRule = require('../../../../src/modules/rules/library/financial/DSRMaximumRule');
const { instance: formulaRegistry } = require('../../../../src/modules/rules/registry/formula.registry');
const DSRFormula = require('../../../../src/modules/rules/formulas/financial/DSR.formula');

describe('Rule Tests', () => {
  before(() => {
    // Register the dependency manually for the unit test
    if (!formulaRegistry.get('DSR')) {
      formulaRegistry.register(DSRFormula);
    }
  });

  describe('DSRMaximumRule', () => {
    test('Should pass if DSR is below threshold', () => {
      const context = {
        assessment: { income: 10000000, installment: 3000000 },
        stageProfile: { rules: [{ code: 'DSR_MAX', parameters: { threshold: 0.40 } }] }
      };
      
      const result = DSRMaximumRule.execute(context);
      
      assert.strictEqual(result.passed, true);
      assert.strictEqual(result.reasonCodes[0], 'DSR_OK');
      assert.strictEqual(result.metrics[0].code, 'DSR');
      assert.strictEqual(result.metrics[0].value, 30);
    });

    test('Should fail if DSR exceeds threshold', () => {
      const context = {
        assessment: { income: 10000000, installment: 5000000 }, // DSR 50%
        stageProfile: { rules: [{ code: 'DSR_MAX', parameters: { threshold: 0.40 } }] }
      };
      
      const result = DSRMaximumRule.execute(context);
      
      assert.strictEqual(result.passed, false);
      assert.strictEqual(result.reasonCodes[0], 'DSR_TOO_HIGH');
      assert.strictEqual(result.metrics[0].value, 50);
    });
  });
});
