"use strict";
const { test, describe } = require('node:test');
const assert = require('node:assert');
const StageProfile = require('../../../src/modules/profiles/entities/StageProfile');
const { ProfileRegistry } = require('../../../src/modules/profiles/registry/profile.registry');
const ProfileResolver = require('../../../src/modules/profiles/resolver/profile.resolver');

describe('Profile Bounded Context Tests', () => {
  const validJson = {
    metadata: { code: 'TEST_PROFILE', version: '1.0.0', status: 'ACTIVE' },
    stage: 'FINANCIAL',
    rules: [{ code: 'DSR_MAX', parameters: { threshold: 0.40 } }]
  };

  describe('StageProfile Entity', () => {
    test('Should throw on invalid JSON', () => {
      assert.throws(() => new StageProfile({}), /Invalid Stage Profile/);
    });

    test('Should compute fingerprint and freeze object', () => {
      const profile = new StageProfile(validJson);
      
      assert.strictEqual(typeof profile.fingerprint, 'string');
      assert.strictEqual(profile.fingerprint.length, 64); // SHA-256 hex length
      assert.strictEqual(Object.isFrozen(profile), true);
      assert.strictEqual(Object.isFrozen(profile.rules), true);
      assert.strictEqual(Object.isFrozen(profile.rules[0].parameters), true);

      // Verify immutability
      assert.throws(() => { profile.stage = 'ELIGIBILITY'; }, TypeError);
    });
  });

  describe('Registry and Resolver', () => {
    test('Registry should store and retrieve entity', () => {
      const registry = new ProfileRegistry();
      const profile = new StageProfile(validJson);
      registry.register(profile);

      assert.strictEqual(registry.get('TEST_PROFILE'), profile);
      assert.strictEqual(registry.get('TEST_PROFILE', '1.0.0'), profile);
    });

    test('Resolver should resolve by context', () => {
      // Mock global registry by injecting into it directly since resolver uses singleton
      const { instance } = require('../../../src/modules/profiles/registry/profile.registry');
      instance.register(new StageProfile(validJson));

      const resolved = ProfileResolver.resolve({ profile: 'TEST_PROFILE' });
      assert.strictEqual(resolved.metadata.code, 'TEST_PROFILE');

      const resolvedV1 = ProfileResolver.resolve({ profile: 'TEST_PROFILE', version: '1.0.0' });
      assert.strictEqual(resolvedV1.metadata.version, '1.0.0');
    });

    test('Resolver should enforce ACTIVE status', () => {
      const { instance } = require('../../../src/modules/profiles/registry/profile.registry');
      const inactiveJson = { ...validJson, metadata: { ...validJson.metadata, code: 'INACTIVE_PROF', status: 'INACTIVE' } };
      instance.register(new StageProfile(inactiveJson));

      assert.throws(() => ProfileResolver.resolve({ profile: 'INACTIVE_PROF' }), /is not ACTIVE/);
    });

    test('Resolver should throw if not found', () => {
      assert.throws(() => ProfileResolver.resolve({ profile: 'NON_EXISTENT' }), /not found/);
    });
  });
});
