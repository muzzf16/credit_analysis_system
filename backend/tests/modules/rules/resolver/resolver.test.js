const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const FormulaResolver = require('../../../../src/modules/rules/resolver/formula.resolver');
const RuleResolver = require('../../../../src/modules/rules/resolver/rule.resolver');
const { instance: formulaRegistry } = require('../../../../src/modules/rules/registry/formula.registry');
const { instance: ruleRegistry } = require('../../../../src/modules/rules/registry/rule.registry');
const BaseFormula = require('../../../../src/modules/rules/formulas/BaseFormula');
const BaseRule = require('../../../../src/modules/rules/library/BaseRule');

describe('Resolver Tests', () => {
  before(() => {
    class ResolverFormula extends BaseFormula {
      static get metadata() { return { code: 'RES_FORMULA', version: '1', unit: 'INTEGER' }; }
      static _compute() { return 100; }
    }
    
    class ResolverRule extends BaseRule {
      static get metadata() { return { code: 'RES_RULE', category: 'SCORING', version: '1', severity: 'MEDIUM' }; }
    }
    
    // Only register if not already there to prevent test leakage
    if (!formulaRegistry.get('RES_FORMULA')) formulaRegistry.register(ResolverFormula);
    if (!ruleRegistry.get('RES_RULE')) ruleRegistry.register(ResolverRule);
  });

  describe('FormulaResolver', () => {
    test('Should resolve and execute formula', () => {
      const result = FormulaResolver.resolveAndExecute('RES_FORMULA', {});
      assert.strictEqual(result.value, 100);
    });

    test('Should throw if formula not found', () => {
      assert.throws(() => FormulaResolver.resolveAndExecute('NON_EXISTENT', {}), /not found/);
    });
  });

  describe('RuleResolver', () => {
    test('Should resolve rule class', () => {
      const RuleClass = RuleResolver.resolve('RES_RULE');
      assert.strictEqual(RuleClass.metadata.code, 'RES_RULE');
    });

    test('Should throw if rule not found', () => {
      assert.throws(() => RuleResolver.resolve('NON_EXISTENT'), /not found/);
    });
  });
});
