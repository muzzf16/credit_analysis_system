const { test, describe } = require('node:test');
const assert = require('node:assert');
const { FormulaRegistry } = require('../../../../src/modules/rules/registry/formula.registry');
const { RuleRegistry } = require('../../../../src/modules/rules/registry/rule.registry');
const BaseFormula = require('../../../../src/modules/rules/formulas/BaseFormula');
const BaseRule = require('../../../../src/modules/rules/library/BaseRule');

describe('Registry Tests', () => {
  describe('FormulaRegistry', () => {
    test('Should register valid formula and extract metadata', () => {
      const registry = new FormulaRegistry();
      class TestFormula extends BaseFormula {
        static get metadata() { return { code: 'TEST_FORMULA', version: '1', unit: 'PERCENT' }; }
      }
      
      registry.register(TestFormula);
      const fetched = registry.get('TEST_FORMULA');
      assert.strictEqual(fetched, TestFormula);
      
      const exportMeta = registry.exportMetadata();
      assert.strictEqual(exportMeta.length, 1);
      assert.strictEqual(exportMeta[0].code, 'TEST_FORMULA');
    });

    test('Should reject duplicate formula', () => {
      const registry = new FormulaRegistry();
      class TestFormula extends BaseFormula {
        static get metadata() { return { code: 'TEST_FORMULA', version: '1', unit: 'PERCENT' }; }
      }
      registry.register(TestFormula);
      assert.throws(() => registry.register(TestFormula), /already registered/);
    });
  });

  describe('RuleRegistry', () => {
    test('Should register valid rule and extract metadata', () => {
      const registry = new RuleRegistry();
      class TestRule extends BaseRule {
        static get metadata() { return { code: 'TEST_RULE', category: 'FINANCIAL', version: '1', severity: 'LOW' }; }
      }
      
      registry.register(TestRule);
      const fetched = registry.get('TEST_RULE');
      assert.strictEqual(fetched, TestRule);
    });
  });
});
