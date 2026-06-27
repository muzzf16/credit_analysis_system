'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const { PromptContext, PromptContextBuilder } = require('../../../../src/modules/ai/context');

function buildMockAnalysisPackage() {
  const dk = {
    decisionId: 'DEC-2026-AB12',
    assessmentId: 'ASM-TEST-001',
    recommendation: { status: 'APPROVED_WITH_CONDITION', code: 'APPROVE_WITH_CONDITION', riskLevel: 'MEDIUM' },
    authority: { required: 'CREDIT_COMMITTEE', resolvedBy: 'AuthorityPolicy' },
    conditions: [{ code: 'INSURANCE_REQUIRED', mandatory: true }],
    override: { enabled: false },
    intent: { code: 'STANDARD_INTENT' },
    policy: {},
    manifest: { version: '1.0.0' },
    audit: { createdAt: new Date().toISOString() },
  };
  return {
    packageId: 'PKG-DEC-2026-AB12',
    decisionKernel: {
      ...dk,
      toJSON: () => dk,
    },
    factCollection: {
      toJSON: () => ({ income: 10000000, installment: 2000000 }),
    },
    capabilityCollection: {
      toJSON: () => ({ financial: { eligible: true } }),
    },
  };
}

describe('Sprint 6.2 — PromptContext', () => {
  test('Should build PromptContext from AnalysisPackage', () => {
    const pkg = buildMockAnalysisPackage();
    const ctx = PromptContextBuilder.build(pkg);

    assert.strictEqual(ctx.packageId, 'PKG-DEC-2026-AB12');
    assert.strictEqual(ctx.summary.decisionId, 'DEC-2026-AB12');
    assert.strictEqual(ctx.recommendation.status, 'APPROVED_WITH_CONDITION');
    assert.deepStrictEqual(ctx.conditions, [{ code: 'INSURANCE_REQUIRED', mandatory: true }]);
  });

  test('Should be immutable', () => {
    const pkg = buildMockAnalysisPackage();
    const ctx = PromptContextBuilder.build(pkg);

    assert.throws(() => {
      ctx._data.summary.decisionId = 'CHANGED';
    }, TypeError);
  });

  test('Should sanitize facts and capabilities', () => {
    const pkg = buildMockAnalysisPackage();
    const ctx = PromptContextBuilder.build(pkg);

    assert.deepStrictEqual(ctx.facts, { income: 10000000, installment: 2000000 });
    assert.deepStrictEqual(ctx.capabilities, { financial: { eligible: true } });
  });
});