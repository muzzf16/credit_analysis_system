"use strict";
const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const FactDefinition = require('../../../src/modules/facts/entities/FactDefinition');
const { instance: definitionRegistry } = require('../../../src/modules/facts/registry/definition.registry');
const Fact = require('../../../src/modules/facts/entities/Fact');

describe('Fact Definition and Entity Tests', () => {
  before(() => {
    const enumDef = new FactDefinition({
      code: 'TEST_ENUM', type: 'ENUM', allowedValues: ['A', 'B', 'C'], description: 'Enum Test'
    });
    const boolDef = new FactDefinition({
      code: 'TEST_BOOL', type: 'BOOLEAN', description: 'Bool Test'
    });
    const intDef = new FactDefinition({
      code: 'TEST_INT', type: 'INTEGER', min: 1, max: 10, description: 'Int Test'
    });
    
    definitionRegistry.register(enumDef);
    definitionRegistry.register(boolDef);
    definitionRegistry.register(intDef);
  });

  describe('FactDefinition Constraints', () => {
    test('Should throw if value violates ENUM', () => {
      assert.throws(() => {
        new Fact({ code: 'TEST_ENUM', value: 'D', source: 'TEST' });
      }, /not in allowedValues/);
    });

    test('Should throw if value violates BOOLEAN', () => {
      assert.throws(() => {
        new Fact({ code: 'TEST_BOOL', value: 'TRUE', source: 'TEST' });
      }, /expects BOOLEAN/);
    });

    test('Should throw if value violates INTEGER constraints', () => {
      assert.throws(() => {
        new Fact({ code: 'TEST_INT', value: 11, source: 'TEST' });
      }, /greater than max/);
      
      assert.throws(() => {
        new Fact({ code: 'TEST_INT', value: 0, source: 'TEST' });
      }, /less than min/);
      
      assert.throws(() => {
        new Fact({ code: 'TEST_INT', value: 5.5, source: 'TEST' });
      }, /expects INTEGER/);
    });
  });

  describe('Fact Entity creation', () => {
    test('Should create and freeze Fact if valid', () => {
      const fact = new Fact({ code: 'TEST_ENUM', value: 'A', source: 'TEST', evidence: ['E1'] });
      
      assert.strictEqual(fact.code, 'TEST_ENUM');
      assert.strictEqual(fact.value, 'A');
      assert.strictEqual(fact.evidence.length, 1);
      assert.strictEqual(Object.isFrozen(fact), true);
      assert.strictEqual(Object.isFrozen(fact.evidence), true);
    });
  });
});
