const { test, describe } = require('node:test');
const assert = require('node:assert');
const { StageRegistry } = require('../../../../src/modules/rules/stage/registry/stage.registry');
const StageResolver = require('../../../../src/modules/rules/stage/resolver/stage.resolver');
const BaseStage = require('../../../../src/modules/rules/stage/BaseStage');

describe('Stage Registry & Resolver Tests', () => {
  describe('Registry', () => {
    test('Should register valid stage and export metadata', () => {
      const registry = new StageRegistry();
      class TestStage extends BaseStage {
        static get metadata() { return { code: 'TEST_STAGE', category: 'ASSESSMENT', version: '1' }; }
      }
      
      registry.register(TestStage);
      const fetched = registry.get('TEST_STAGE');
      assert.strictEqual(fetched, TestStage);
      
      const metas = registry.exportMetadata();
      assert.strictEqual(metas[0].code, 'TEST_STAGE');
    });

    test('Should reject duplicate stage', () => {
      const registry = new StageRegistry();
      class TestStage extends BaseStage {
        static get metadata() { return { code: 'TEST_STAGE', category: 'ASSESSMENT', version: '1' }; }
      }
      registry.register(TestStage);
      assert.throws(() => registry.register(TestStage), /already registered/);
    });
  });

  describe('Resolver', () => {
    test('Should throw if stage not found', () => {
      // Assuming StageResolver uses the global instance that doesn't have NON_EXISTENT
      assert.throws(() => StageResolver.resolve('NON_EXISTENT_STAGE'), /not found/);
    });
  });
});
