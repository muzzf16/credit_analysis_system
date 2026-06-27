'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const { MakDocument, MakBuilder, PdfRenderer, HtmlRenderer, DocxRenderer } = require('../../../../src/modules/ai/mak');
const { Narrative } = require('../../../../src/modules/ai/narrative');

describe('Sprint 6.6 — MAK Builder', () => {
  const mockNarrative = new Narrative({
    executiveSummary: 'Test summary',
    recommendation: 'APPROVED',
    financialAnalysis: 'Test financial',
    strengths: 'Strong',
    weaknesses: 'Weak',
    mitigation: 'Mitigate',
  });

  test('Should build MakDocument from Narrative', () => {
    const mak = MakBuilder.build(mockNarrative);
    assert.ok(mak instanceof MakDocument);
    assert.strictEqual(mak.executiveSummary, 'Test summary');
    assert.strictEqual(mak.recommendation, 'APPROVED');
  });

  test('PdfRenderer should generate PDF content', () => {
    const mak = MakBuilder.build(mockNarrative);
    const renderer = new PdfRenderer();
    const result = renderer.render(mak);
    assert.strictEqual(result.format, 'pdf');
    assert.ok(result.content.includes('Memorandum Analisa Kredit') || result.content.includes('Ringkasan Eksekutif'));
  });

  test('HtmlRenderer should generate HTML content', () => {
    const mak = MakBuilder.build(mockNarrative);
    const renderer = new HtmlRenderer();
    const result = renderer.render(mak);
    assert.strictEqual(result.format, 'html');
    assert.ok(result.content.includes('<!DOCTYPE html>'));
  });

  test('DocxRenderer should generate DOCX content', () => {
    const mak = MakBuilder.build(mockNarrative);
    const renderer = new DocxRenderer();
    const result = renderer.render(mak);
    assert.strictEqual(result.format, 'docx');
    assert.ok(result.content.includes('MEMORANDUM ANALISA KREDIT') && result.content.includes('DOCX'));
  });
});