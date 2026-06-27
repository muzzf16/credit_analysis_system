'use strict';

const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const OverrideDomain = require('../../../src/modules/decision-policy/entities/OverrideDomain');
const DecisionPolicy = require('../../../src/modules/decision-policy/entities/DecisionPolicy');
const DecisionIntent = require('../../../src/modules/decision-intent/entities/DecisionIntent');
const DecisionIntentDefinition = require('../../../src/modules/decision-intent/entities/DecisionIntentDefinition');
const { instance: intentDefinitionRegistry } = require('../../../src/modules/decision-intent/registry/definition.registry');
const {
  DecisionKernel,
  DecisionKernelBuilder,
  DecisionRevisionService,
  DecisionIntegrityService,
  DecisionOrchestrator,
  DecisionManifestLoader,
  bootstrapDecisionPlatform,
} = require('../../../src/modules/decision-kernel');

function buildMockAssessment() {
  return {
    assessmentId: 'ASM-TEST-001',
    integrity: { fingerprint: 'sha256-assessment-test' },
    policy: { pack: 'BPR_BAPERA_STANDARD', version: '2024.1', fingerprint: 'sha256-policy-pack-test' },
    caseSnapshot: {
      data: {
        application: {
          plafon: 50_000_000,
          penghasilan: 10_000_000,
          angsuran_perbulan: 2_000_000,
        },
      },
    },
  };
}

function buildMockIntent() {
  return new DecisionIntent({
    code: 'STANDARD_INTENT',
    recommendation: 'APPROVE_WITH_CONDITION',
    riskLevel: 'MEDIUM',
    authority: 'KOMITE_CABANG',
    manualReview: true,
    conditions: [{ code: 'INSURANCE_REQUIRED', mandatory: true }],
    derivedFrom: ['FINANCIAL_ELIGIBILITY'],
  });
}

function buildMockPolicy() {
  return new DecisionPolicy({
    authority: 'CREDIT_COMMITTEE',
    escalation: { escalated: false },
    override: new OverrideDomain({ enabled: false }),
    conditions: [{ code: 'STANDARD_ADMIN_FEE' }],
    committeeRules: { requiredQuorum: 3 },
  });
}

describe('Sprint 5.10 — Decision Kernel Platform', () => {
  before(() => {
    bootstrapDecisionPlatform();
    if (!intentDefinitionRegistry.get('STANDARD_INTENT')) {
      intentDefinitionRegistry.register(new DecisionIntentDefinition({
        code: 'STANDARD_INTENT',
        allowedRecommendations: ['APPROVE', 'APPROVE_WITH_CONDITION', 'MANUAL_REVIEW', 'REJECT'],
        allowedRiskLevels: ['LOW', 'MEDIUM', 'HIGH'],
      }));
    }
  });

  describe('DecisionManifest', () => {
    test('Should load manifest with fingerprint', () => {
      const manifest = DecisionManifestLoader.load();
      assert.strictEqual(manifest.version, '1.0.0');
      assert.strictEqual(manifest.decisionModel, 'STANDARD');
      assert.ok(manifest.fingerprint.startsWith('sha256-'));
    });
  });

  describe('DecisionKernel Aggregate Root', () => {
    test('Should build canonical kernel from intent + policy', () => {
      const kernel = DecisionKernelBuilder.build(
        buildMockAssessment(),
        buildMockIntent(),
        buildMockPolicy()
      );

      assert.ok(kernel.decisionId.startsWith('DEC-'));
      assert.strictEqual(kernel.revision, 1);
      assert.ok(kernel.revisionId.endsWith('-R0001'));
      assert.strictEqual(kernel.recommendation.status, 'APPROVED_WITH_CONDITION');
      assert.strictEqual(kernel.authority.required, 'CREDIT_COMMITTEE');
      assert.strictEqual(kernel.override.allowed, false);
      assert.ok(kernel.audit.fingerprints.decision.startsWith('sha256-'));
      assert.ok(kernel.manifest.fingerprint.startsWith('sha256-'));
    });

    test('Should enforce immutability', () => {
      const kernel = DecisionKernelBuilder.build(
        buildMockAssessment(),
        buildMockIntent(),
        buildMockPolicy()
      );
      assert.throws(() => {
        kernel._data.recommendation.status = 'APPROVED';
      }, TypeError);
    });
  });

  describe('DecisionIntegrityService', () => {
    test('Should verify valid kernel fingerprint', () => {
      const kernel = DecisionKernelBuilder.build(
        buildMockAssessment(),
        buildMockIntent(),
        buildMockPolicy()
      );
      const result = DecisionIntegrityService.verifyKernel(kernel);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    test('Should detect tampered fingerprint', () => {
      const kernel = DecisionKernelBuilder.build(
        buildMockAssessment(),
        buildMockIntent(),
        buildMockPolicy()
      );
      const tampered = JSON.parse(JSON.stringify(kernel.toJSON()));
      tampered.recommendation.status = 'APPROVED';
      tampered.audit.fingerprints.decision = 'sha256-tampered';
      const tamperedKernel = new DecisionKernel(tampered);
      const result = DecisionIntegrityService.verifyKernel(tamperedKernel);
      assert.strictEqual(result.valid, false);
    });
  });

  describe('DecisionRevisionService', () => {
    test('Should create V1 then V2 without mutating V1', () => {
      const assessment = buildMockAssessment();
      const intent = buildMockIntent();
      const policy = buildMockPolicy();

      const v1 = DecisionRevisionService.createInitial(assessment, intent, policy);
      assert.strictEqual(v1.kernel.revision, 1);
      assert.strictEqual(v1.revision.revision, 1);

      const intentV2 = new DecisionIntent({
        code: 'STANDARD_INTENT',
        recommendation: 'APPROVE',
        riskLevel: 'LOW',
        authority: 'KOMITE_CABANG',
        manualReview: false,
        conditions: [],
        derivedFrom: ['FINANCIAL_ELIGIBILITY'],
      });

      const v2 = DecisionRevisionService.createRevision(v1.kernel, assessment, intentV2, policy);
      assert.strictEqual(v2.kernel.decisionId, v1.kernel.decisionId);
      assert.strictEqual(v2.kernel.revision, 2);
      assert.strictEqual(v2.revision.previousRevisionId, v1.kernel.revisionId);

      // V1 unchanged
      assert.strictEqual(v1.kernel.recommendation.status, 'APPROVED_WITH_CONDITION');
      assert.strictEqual(v2.kernel.recommendation.status, 'APPROVED');
    });
  });

  describe('DecisionOrchestrator E2E', () => {
    test('Should execute full pipeline chain to DecisionKernel', () => {
      const assessment = buildMockAssessment();
      const result = DecisionOrchestrator.execute(assessment, { correlationId: 'corr-test-001' });

      assert.ok(result.kernel);
      assert.ok(result.pipelineResult);
      assert.ok(result.factCollection);
      assert.ok(result.capabilityCollection);
      assert.ok(result.decisionFactsCollection);
      assert.ok(result.intent);
      assert.ok(result.policy);

      const integrity = DecisionIntegrityService.verifyKernel(result.kernel);
      assert.strictEqual(integrity.valid, true);
    });
  });
});
