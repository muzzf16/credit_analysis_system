"use strict";
const { test, describe } = require('node:test');
const assert = require('node:assert');
const { PipelinePlan, PipelineRegistry } = require('../../../../src/modules/decision/pipeline/registry/pipeline.registry');
const PipelineResolver = require('../../../../src/modules/decision/pipeline/resolver/pipeline.resolver');

describe('Pipeline Domain Tests', () => {
  const validJson = {
    metadata: { code: 'PRODUCTIVE_STANDARD', version: '1.0.0', status: 'ACTIVE' },
    stages: [
      { code: 'ELIGIBILITY', profile: 'STANDARD_ELIGIBILITY' },
      { code: 'FINANCIAL', profile: 'STANDARD_FINANCIAL' }
    ]
  };

  describe('PipelinePlan Entity', () => {
    test('Should throw on invalid JSON', () => {
      assert.throws(() => new PipelinePlan({}), /Invalid Pipeline Plan/);
    });

    test('Should compute fingerprint and freeze object', () => {
      const plan = new PipelinePlan(validJson);
      
      assert.strictEqual(typeof plan.fingerprint, 'string');
      assert.strictEqual(plan.fingerprint.length, 64);
      assert.strictEqual(Object.isFrozen(plan), true);
      assert.strictEqual(Object.isFrozen(plan.stages), true);

      assert.throws(() => { plan.stages = []; }, TypeError);
    });
  });

  describe('Registry and Resolver', () => {
    test('Registry should store and retrieve entity', () => {
      const registry = new PipelineRegistry();
      const plan = new PipelinePlan(validJson);
      registry.register(plan);

      assert.strictEqual(registry.get('PRODUCTIVE_STANDARD'), plan);
      assert.strictEqual(registry.get('PRODUCTIVE_STANDARD', '1.0.0'), plan);
    });

    test('Resolver should resolve by context', () => {
      const { instance } = require('../../../../src/modules/decision/pipeline/registry/pipeline.registry');
      instance.register(new PipelinePlan(validJson));

      const resolved = PipelineResolver.resolve({ pipeline: 'PRODUCTIVE_STANDARD' });
      assert.strictEqual(resolved.metadata.code, 'PRODUCTIVE_STANDARD');
    });

    test('Resolver should enforce ACTIVE status', () => {
      const { instance } = require('../../../../src/modules/decision/pipeline/registry/pipeline.registry');
      const inactiveJson = { ...validJson, metadata: { ...validJson.metadata, code: 'INACTIVE_PLAN', status: 'INACTIVE' } };
      instance.register(new PipelinePlan(inactiveJson));

      assert.throws(() => PipelineResolver.resolve({ pipeline: 'INACTIVE_PLAN' }), /is not ACTIVE/);
    });

    test('Resolver should throw if not found', () => {
      assert.throws(() => PipelineResolver.resolve({ pipeline: 'NON_EXISTENT' }), /not found/);
    });
  });
});
