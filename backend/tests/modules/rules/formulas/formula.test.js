const { test, describe } = require('node:test');
const assert = require('node:assert');
const DSRFormula = require('../../../../src/modules/rules/formulas/financial/DSR.formula');

describe('Formula Tests', () => {
  describe('DSRFormula', () => {
    test('Should correctly calculate DSR (Installment / Income * 100)', () => {
      const result = DSRFormula.execute({ installment: 3000000, income: 10000000 });
      assert.strictEqual(result.code, 'DSR');
      assert.strictEqual(result.value, 30);
      assert.strictEqual(result.unit, 'PERCENT');
    });

    test('Should handle zero income by returning 0 to prevent Infinity', () => {
      const result = DSRFormula.execute({ installment: 3000000, income: 0 });
      assert.strictEqual(result.value, 0);
    });

    test('Should respect precision rounding (2 decimals)', () => {
      // 3000 / 7000 = 0.4285714... * 100 = 42.85714... -> 42.86
      const result = DSRFormula.execute({ installment: 3000, income: 7000 });
      assert.strictEqual(result.value, 42.86);
    });
  });
});
