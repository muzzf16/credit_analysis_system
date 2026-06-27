'use strict';

const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const { PromptContextBuilder } = require('../../../src/modules/ai/context');
const { PromptBuilder, promptDefinitionRegistry } = require('../../../src/modules/ai/prompt');
const { LLMAdapter } = require('../../../src/modules/ai/adapters');
const { NarrativeBuilder } = require('../../../src/modules/ai/narrative');
const { MakBuilder, PdfRenderer, HtmlRenderer, DocxRenderer } = require('../../../src/modules/ai/mak');

class MockLLMAdapter extends LLMAdapter {
  constructor(mockContent) {
    super();
    this.mockContent = mockContent;
  }

  async generate(renderedPrompt, options) {
    return {
      content: this.mockContent,
      model: options?.model?.name || 'mock-model',
      usage: { promptTokens: 100, completionTokens: 200 },
    };
  }
}

describe('AI Analyst Bounded Context — End-to-End Integration Test', () => {
  before(() => {
    const definitionsDir = path.join(__dirname, '../../../src/modules/ai/prompt/definitions');
    promptDefinitionRegistry.loadFromDirectory(definitionsDir);
  });

  test('Full pipeline flow: AnalysisPackage -> PromptContext -> Prompt -> LLM -> Narrative -> MAK', async () => {
    // 1. Prepare deterministic AnalysisPackage mock
    const dk = {
      decisionId: 'DEC-2026-X99',
      assessmentId: 'ASM-INTEGRATION-001',
      recommendation: { status: 'APPROVED_WITH_CONDITION', code: 'APPROVE_WITH_CONDITION', riskLevel: 'MEDIUM' },
      authority: { required: 'KABID', resolvedBy: 'PolicyRules' },
      conditions: [{ code: 'BLOCK_SALDO_1X', mandatory: true }],
      override: { enabled: false },
      intent: { code: 'STANDARD_KONSUMTIF' },
      policy: {},
      manifest: { version: '1.0.0' },
      audit: { createdAt: new Date().toISOString() },
    };
    
    const analysisPackage = {
      packageId: 'PKG-DEC-2026-X99',
      decisionKernel: {
        ...dk,
        toJSON: () => dk,
      },
      factCollection: {
        toJSON: () => ({ income: 15000000, installment: 3000000 }),
      },
      capabilityCollection: {
        toJSON: () => ({ financial: { eligible: true }, collateral: { secured: true } }),
      },
    };

    // 2. Transform to PromptContext (AI View Model)
    const promptContext = PromptContextBuilder.build(analysisPackage);
    assert.strictEqual(promptContext.packageId, 'PKG-DEC-2026-X99');
    assert.strictEqual(promptContext.facts.income, 15000000);

    // 3. Render prompt based on a definition
    const renderedPrompt = PromptBuilder.build(promptContext, 'MAK_STANDARD');
    assert.ok(renderedPrompt.system);
    assert.ok(renderedPrompt.user);
    assert.ok(renderedPrompt.user.includes('ASM-INTEGRATION-001'));
    assert.ok(renderedPrompt.user.includes('Rp 15.000.000')); // Verifies formatting filter working

    // 4. Simulate LLM generation using the mock adapter
    const mockLlmJsonResponse = JSON.stringify({
      executiveSummary: 'Analisa Kredit PT BPR BAPERA BATANG menyetujui pengajuan kredit nasabah ASM-INTEGRATION-001 dengan tingkat risiko MEDIUM.',
      borrowerProfile: 'Nasabah memiliki penghasilan Rp 15.000.000.',
      financialAnalysis: 'RPC 120%, DSR 35%, cashflow positif.',
      collateralAnalysis: 'Agunan tanah dan bangunan senilai Rp 150.000.000.',
      riskAssessment: 'Tingkat risiko sedang dengan mitigasi asuransi jiwa.',
      strengths: 'Omset stabil, agunan marketable.',
      weaknesses: 'Lama usaha baru 2 tahun.',
      mitigation: 'Pemblokiran saldo 1 kali angsuran.',
      recommendation: 'APPROVED_WITH_CONDITION',
      appendix: ['Kredit disetujui bersyarat']
    });

    const adapter = new MockLLMAdapter(mockLlmJsonResponse);
    const llmResponse = await adapter.generate(renderedPrompt, {
      model: { provider: 'OPENAI', name: 'gpt-4' },
      generation: { temperature: 0.1 }
    });

    // 5. Parse and build Narrative Entity
    const narrative = NarrativeBuilder.build(llmResponse.content);
    assert.strictEqual(narrative.executiveSummary, 'Analisa Kredit PT BPR BAPERA BATANG menyetujui pengajuan kredit nasabah ASM-INTEGRATION-001 dengan tingkat risiko MEDIUM.');
    assert.strictEqual(narrative.recommendation, 'APPROVED_WITH_CONDITION');
    assert.deepStrictEqual(narrative.appendix, ['Kredit disetujui bersyarat']);

    // 6. Build MAK Document
    const makDocument = MakBuilder.build(narrative);
    assert.strictEqual(makDocument.executiveSummary, narrative.executiveSummary);

    // 7. Render MAK to different formats
    const pdfRenderer = new PdfRenderer();
    const pdfOutput = pdfRenderer.render(makDocument);
    assert.strictEqual(pdfOutput.format, 'pdf');
    assert.ok(pdfOutput.content.includes('MEMORANDUM ANALISA KREDIT'));
    assert.ok(pdfOutput.content.includes('Analisis Keuangan:'));

    const htmlRenderer = new HtmlRenderer();
    const htmlOutput = htmlRenderer.render(makDocument);
    assert.strictEqual(htmlOutput.format, 'html');
    assert.ok(htmlOutput.content.includes('<!DOCTYPE html>'));

    const docxRenderer = new DocxRenderer();
    const docxOutput = docxRenderer.render(makDocument);
    assert.strictEqual(docxOutput.format, 'docx');
    assert.ok(docxOutput.content.includes('MEMORANDUM ANALISA KREDIT (DOCX FORMAT)'));
  });
});
