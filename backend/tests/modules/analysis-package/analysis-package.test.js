'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const AnalysisPackage = require('../../../src/modules/analysis-package/entities/AnalysisPackage');
const AnalysisPackageBuilder = require('../../../src/modules/analysis-package/builder/AnalysisPackageBuilder');

function buildMockDecisionKernel() {
  const data = {
    decisionId: 'DEC-2026-AB12',
    revisionId: 'DEC-2026-AB12-R0001',
    assessmentId: 'ASM-TEST-001',
    recommendation: {
      status: 'APPROVED_WITH_CONDITION',
      code: 'APPROVE_WITH_CONDITION',
      riskLevel: 'MEDIUM',
    },
    authority: {
      required: 'CREDIT_COMMITTEE',
      intentAuthority: 'KOMITE_CABANG',
      resolvedBy: 'AuthorityPolicy',
    },
    intent: {
      code: 'STANDARD_INTENT',
      recommendation: 'APPROVE_WITH_CONDITION',
      riskLevel: 'MEDIUM',
    },
    policy: {
      authority: 'CREDIT_COMMITTEE',
      escalation: { escalated: false },
    },
    audit: {
      fingerprints: {
        assessment: 'sha256-assessment',
        policy: 'sha256-policy',
        intent: 'sha256-intent',
        decision: 'sha256-decision',
      },
      createdAt: new Date().toISOString(),
      algorithm: 'SHA-256',
    },
    manifest: {
      version: '1.0.0',
      decisionModel: 'STANDARD',
      fingerprint: 'sha256-manifest',
    },
  };
  return {
    ...data,
    toJSON: () => data,
  };
}

function buildMockFactCollection() {
  return {
    toJSON: () => ({
      financial: { income: 10000000, installment: 2000000 },
      slik: { totalDebt: 5000000 },
    }),
  };
}

function buildMockCapabilityCollection() {
  return {
    toJSON: () => ({
      financial: { eligible: true, rpc: 150 },
      collateral: { secured: true },
    }),
  };
}

describe('Sprint 6.1 — Analysis Package', () => {
  test('Should build AnalysisPackage from DecisionKernel + Collections', () => {
    const dk = buildMockDecisionKernel();
    const facts = buildMockFactCollection();
    const caps = buildMockCapabilityCollection();

    const pkg = AnalysisPackageBuilder.build({
      decisionKernel: dk,
      factCollection: facts,
      capabilityCollection: caps,
    });

    assert.ok(pkg.packageId.startsWith('PKG-'));
    assert.strictEqual(pkg.assessmentId, 'ASM-TEST-001');
    assert.ok(pkg.fingerprint.startsWith('sha256-'));
    assert.strictEqual(pkg.version, '1.0.0');
  });

  test('Should be immutable', () => {
    const dk = buildMockDecisionKernel();
    const facts = buildMockFactCollection();
    const caps = buildMockCapabilityCollection();

    const pkg = AnalysisPackageBuilder.build({
      decisionKernel: dk,
      factCollection: facts,
      capabilityCollection: caps,
    });

    assert.throws(() => {
      pkg._data.assessmentId = 'CHANGED';
    }, TypeError);
  });

  test('Should compute consistent fingerprint', () => {
    const dk = buildMockDecisionKernel();
    const facts = buildMockFactCollection();
    const caps = buildMockCapabilityCollection();

    const pkg1 = AnalysisPackageBuilder.build({
      decisionKernel: dk,
      factCollection: facts,
      capabilityCollection: caps,
    });
    const pkg2 = AnalysisPackageBuilder.build({
      decisionKernel: dk,
      factCollection: facts,
      capabilityCollection: caps,
    });

    assert.strictEqual(pkg1.fingerprint, pkg2.fingerprint);
  });
});