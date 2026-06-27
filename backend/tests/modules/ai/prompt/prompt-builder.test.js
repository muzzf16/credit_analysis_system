'use strict';

const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const { PromptBuilder, promptDefinitionRegistry } = require('../../../../src/modules/ai/prompt');
const { PromptContextBuilder } = require('../../../../src/modules/ai/context');

describe('Sprint 6.3 — Prompt Definitions & Builder', () => {
  before(() => {
    const definitionsDir = require('path').join(__dirname, '../../../../src/modules/ai/prompt/definitions');
    promptDefinitionRegistry.loadFromDirectory(definitionsDir);
  });

  test('Should load prompt definition from registry', () => {
    const def = promptDefinitionRegistry.get('MAK_STANDARD');
    assert.ok(def);
    assert.strictEqual(def.version, '1.0.0');
    assert.strictEqual(def.code, 'MAK_STANDARD');
  });

  test('Should build rendered prompt from PromptContext', () => {
    const mockPkg = {
      packageId: 'PKG-TEST',
      decisionKernel: {
        decisionId: 'DEC-TEST',
        assessmentId: 'ASM-TEST',
        recommendation: { status: 'APPROVED', code: 'APPROVE', riskLevel: 'LOW' },
        authority: { required: 'COMMITTEE', resolvedBy: 'Policy' },
        conditions: [],
        intent: {},
        policy: {},
        manifest: {},
        audit: { createdAt: new Date().toISOString() },
      },
      factCollection: { income: 10000000, installment: 2000000 },
      capabilityCollection: { collateral: { secured: true } },
    };
    mockPkg.decisionKernel.toJSON = () => mockPkg.decisionKernel;
    mockPkg.factCollection.toJSON = () => mockPkg.factCollection;
    mockPkg.capabilityCollection.toJSON = () => mockPkg.capabilityCollection;

    const ctx = PromptContextBuilder.build(mockPkg);
    const rendered = PromptBuilder.build(ctx, 'MAK_STANDARD');

    assert.ok(rendered.system.startsWith('Anda adalah AI Credit Analyst'));
    assert.ok(rendered.user.includes('Nama:'));
    assert.ok(rendered.metadata.version === '1.0.0');
  });

  test('Should handle missing prompt definition', () => {
    const mockPkg = {
      packageId: 'PKG-TEST',
      decisionKernel: { decisionId: 'DEC-TEST', assessmentId: 'ASM-TEST', recommendation: {}, authority: {}, conditions: [], intent: {}, policy: {}, manifest: {}, audit: { createdAt: new Date().toISOString() } },
      factCollection: {},
      capabilityCollection: {},
    };
    mockPkg.decisionKernel.toJSON = () => mockPkg.decisionKernel;
    mockPkg.factCollection.toJSON = () => mockPkg.factCollection;
    mockPkg.capabilityCollection.toJSON = () => mockPkg.capabilityCollection;
    mockPkg.toJSON = () => mockPkg;

    const ctx = PromptContextBuilder.build(mockPkg);
    assert.throws(() => PromptBuilder.build(ctx, 'NONEXISTENT'), /not found/);
  });
});