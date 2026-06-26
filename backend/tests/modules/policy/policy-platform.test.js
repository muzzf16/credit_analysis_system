const { test, describe } = require('node:test');
const assert = require('node:assert');
const { 
  PolicyPack, 
  PolicyRegistry, 
  PolicyResolver, 
  MemoryRepository, 
  PolicyValidator, 
  Lifecycle 
} = require('../../../src/modules/policy');

const fs = require('fs');
const path = require('path');

// Load the real fixture
const fixturePath = path.join(__dirname, '../../../src/modules/policy/fixtures/bpr-bapera-2024.policy.json');
const rawFixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

describe('Policy Platform (Sprint 5.1)', () => {

  // ═══════════════════════════════════════════════════════════════
  // 1. Compatibility & Schema Test
  // ═══════════════════════════════════════════════════════════════
  describe('PolicyValidator (Compatibility & Schema)', () => {
    test('Should validate standard schema successfully', () => {
      const result = PolicyValidator.validateSchema(rawFixture);
      assert.strictEqual(result.valid, true);
    });

    test('Should reject policy missing capabilities', () => {
      const badData = { ...rawFixture, metadata: { pack: 'Bad', version: '1', effectiveDate: '2024-01-01' } };
      const result = PolicyValidator.validateSchema(badData);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    test('Compatibility Test: Should pass if all referenced rules exist', () => {
      const mockRuleLibrary = {
        'MIN_AGE': {}, 'MAX_AGE': {}, 'SLIK_CLEARANCE': {},
        'DSR_MAX': {}, 'RPC_MIN': {}, 'DSCR_MIN': {},
        'LTV_MAX': {}, 'SCORING_5C': {}
      };
      
      const compatibility = PolicyValidator.validateCompatibility(rawFixture, mockRuleLibrary);
      assert.strictEqual(compatibility.valid, true);
      assert.strictEqual(compatibility.missingRules.length, 0);
    });

    test('Compatibility Test: Should fail if policy references non-existent rules', () => {
      const mockRuleLibrary = { 'MIN_AGE': {} }; // Missing DSR_MAX etc.
      
      const compatibility = PolicyValidator.validateCompatibility(rawFixture, mockRuleLibrary);
      assert.strictEqual(compatibility.valid, false);
      assert.ok(compatibility.missingRules.includes('DSR_MAX'));
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 2. Lifecycle Test
  // ═══════════════════════════════════════════════════════════════
  describe('Lifecycle Machine', () => {
    test('Lifecycle Test: Should follow happy path (DRAFT → REVIEW → APPROVED → ACTIVE)', () => {
      const machine = new Lifecycle.LifecycleMachine();
      assert.strictEqual(machine.state, 'DRAFT');
      
      machine.transitionTo('REVIEW');
      assert.strictEqual(machine.state, 'REVIEW');
      
      machine.transitionTo('APPROVED');
      assert.strictEqual(machine.state, 'APPROVED');
      
      machine.transitionTo('ACTIVE');
      assert.strictEqual(machine.state, 'ACTIVE');
      assert.strictEqual(machine.isActive(), true);
    });

    test('Lifecycle Test: Should reject invalid transition (ACTIVE → DRAFT)', () => {
      const machine = new Lifecycle.LifecycleMachine();
      machine.transitionTo('REVIEW');
      machine.transitionTo('APPROVED');
      machine.transitionTo('ACTIVE');
      
      assert.throws(() => machine.transitionTo('DRAFT'), /Invalid transition/);
    });

    test('Lifecycle Test: Should support SUSPENDED state', () => {
      const machine = new Lifecycle.LifecycleMachine();
      machine.transitionTo('REVIEW');
      machine.transitionTo('APPROVED');
      machine.transitionTo('ACTIVE');
      
      machine.transitionTo('SUSPENDED');
      assert.strictEqual(machine.state, 'SUSPENDED');
      assert.strictEqual(machine.isActive(), false);
      
      // Can go back to active
      machine.transitionTo('ACTIVE');
      assert.strictEqual(machine.state, 'ACTIVE');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 3. Fingerprint Test
  // ═══════════════════════════════════════════════════════════════
  describe('PolicyPack Entity', () => {
    test('Fingerprint Test: Identical policy has identical fingerprint', () => {
      const policy1 = new PolicyPack(rawFixture, '1.0.0');
      const policy2 = new PolicyPack(rawFixture, '1.0.0');
      
      assert.strictEqual(policy1.fingerprint, policy2.fingerprint);
    });

    test('Fingerprint Test: Different rule version yields different fingerprint', () => {
      const policy1 = new PolicyPack(rawFixture, '1.0.0');
      const policy2 = new PolicyPack(rawFixture, '2.0.0');
      
      assert.notStrictEqual(policy1.fingerprint, policy2.fingerprint);
    });

    test('Fingerprint Test: Small data change yields different fingerprint', () => {
      const policy1 = new PolicyPack(rawFixture, '1.0.0');
      
      const modifiedFixture = JSON.parse(JSON.stringify(rawFixture));
      modifiedFixture.metadata.priority = 999;
      const policy2 = new PolicyPack(modifiedFixture, '1.0.0');
      
      assert.notStrictEqual(policy1.fingerprint, policy2.fingerprint);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 4. Registry Test
  // ═══════════════════════════════════════════════════════════════
  describe('PolicyRegistry', () => {
    test('Should enforce compatibility on activation', () => {
      const repo = new MemoryRepository();
      // Empty rule library means no rules exist
      const registry = new PolicyRegistry(repo, {}); 
      
      const policy = new PolicyPack(rawFixture);
      registry.register(policy);
      registry.requestReview(policy.id);
      registry.approve(policy.id);

      assert.throws(() => registry.activate(policy.id), /Cannot activate policy/);
      assert.strictEqual(policy.state, 'APPROVED', 'Should not transition if compatibility fails');
    });

    test('Should activate if compatibility passes', () => {
      const repo = new MemoryRepository();
      const mockLib = {
        'MIN_AGE': {}, 'MAX_AGE': {}, 'SLIK_CLEARANCE': {},
        'DSR_MAX': {}, 'RPC_MIN': {}, 'DSCR_MIN': {},
        'LTV_MAX': {}, 'SCORING_5C': {}
      };
      const registry = new PolicyRegistry(repo, mockLib); 
      
      const policy = new PolicyPack(rawFixture);
      registry.register(policy);
      registry.requestReview(policy.id);
      registry.approve(policy.id);
      registry.activate(policy.id);

      assert.strictEqual(policy.state, 'ACTIVE');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 5. Resolver Tests (Priority & Effective Date)
  // ═══════════════════════════════════════════════════════════════
  describe('PolicyResolver', () => {
    test('Resolver Priority Test: Picks higher priority when capabilities match', () => {
      const repo = new MemoryRepository();
      
      // Policy A: Priority 10
      const dataA = JSON.parse(JSON.stringify(rawFixture));
      dataA.metadata.version = 'A';
      dataA.metadata.priority = 10;
      const policyA = new PolicyPack(dataA);
      // Hack state for test
      policyA._lifecycle._state = 'ACTIVE';
      repo.save(policyA);

      // Policy B: Priority 20
      const dataB = JSON.parse(JSON.stringify(rawFixture));
      dataB.metadata.version = 'B';
      dataB.metadata.priority = 20;
      const policyB = new PolicyPack(dataB);
      policyB._lifecycle._state = 'ACTIVE';
      repo.save(policyB);

      const resolver = new PolicyResolver(repo);
      const resolved = resolver.resolve({ product: 'KREDIT_MODAL_KERJA' });
      
      assert.strictEqual(resolved.version, 'B', 'Should pick Priority 20');
    });

    test('Effective Date Test: Resolves correct policy based on evaluation date', () => {
      const repo = new MemoryRepository();
      
      // Policy 2025: Effective Jan 1 2025
      const data25 = JSON.parse(JSON.stringify(rawFixture));
      data25.metadata.version = '2025';
      data25.metadata.effectiveDate = '2025-01-01';
      const policy25 = new PolicyPack(data25);
      policy25._lifecycle._state = 'ACTIVE';
      repo.save(policy25);

      // Policy 2026: Effective Jun 1 2026
      const data26 = JSON.parse(JSON.stringify(rawFixture));
      data26.metadata.version = '2026';
      data26.metadata.effectiveDate = '2026-06-01';
      const policy26 = new PolicyPack(data26);
      policy26._lifecycle._state = 'ACTIVE';
      repo.save(policy26);

      const resolver = new PolicyResolver(repo);

      // Eval in 2025 -> Should get 2025
      const resolved25 = resolver.resolve({ evaluationDate: '2025-12-31' });
      assert.strictEqual(resolved25.version, '2025');

      // Eval in late 2026 -> Should get 2026 (both are active, but newer effectiveDate wins if priority is same)
      const resolved26 = resolver.resolve({ evaluationDate: '2026-12-31' });
      assert.strictEqual(resolved26.version, '2026');
      
      // Eval in 2024 -> Should throw (no active policies yet)
      assert.throws(() => resolver.resolve({ evaluationDate: '2024-12-31' }), /No active policy/);
    });

    test('Capability Context Test: Resolves strictly on capabilities', () => {
      const repo = new MemoryRepository();
      
      // SME Policy
      const dataSME = JSON.parse(JSON.stringify(rawFixture));
      dataSME.metadata.version = 'SME';
      dataSME.metadata.segments = ['SME'];
      const policySME = new PolicyPack(dataSME);
      policySME._lifecycle._state = 'ACTIVE';
      repo.save(policySME);

      // MICRO Policy
      const dataMicro = JSON.parse(JSON.stringify(rawFixture));
      dataMicro.metadata.version = 'MICRO';
      dataMicro.metadata.segments = ['MICRO'];
      const policyMicro = new PolicyPack(dataMicro);
      policyMicro._lifecycle._state = 'ACTIVE';
      repo.save(policyMicro);

      const resolver = new PolicyResolver(repo);

      const resolvedSME = resolver.resolve({ segment: 'SME' });
      assert.strictEqual(resolvedSME.version, 'SME');

      const resolvedMicro = resolver.resolve({ segment: 'MICRO' });
      assert.strictEqual(resolvedMicro.version, 'MICRO');

      assert.throws(() => resolver.resolve({ segment: 'CORPORATE' }), /No active policy/);
    });
  });
});
