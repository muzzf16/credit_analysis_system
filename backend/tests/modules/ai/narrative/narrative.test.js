'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const { Narrative, NarrativeBuilder } = require('../../../../src/modules/ai/narrative');

describe('Sprint 6.5 — Narrative Engine', () => {
  test('Should build Narrative from JSON response', () => {
    const response = {
      executiveSummary: 'Ringkasan test',
      recommendation: 'APPROVED',
      strengths: 'Kuat',
      weaknesses: 'Risiko',
    };
    const narrative = NarrativeBuilder.build(response);
    assert.strictEqual(narrative.executiveSummary, 'Ringkasan test');
    assert.strictEqual(narrative.recommendation, 'APPROVED');
  });

  test('Should parse JSON string response', () => {
    const responseStr = JSON.stringify({
      executiveSummary: 'Dari string',
      recommendation: 'APPROVED_WITH_CONDITION',
    });
    const narrative = NarrativeBuilder.build(responseStr);
    assert.strictEqual(narrative.executiveSummary, 'Dari string');
  });

  test('Should be immutable', () => {
    const response = {
      executiveSummary: 'Test',
      recommendation: 'APPROVED',
    };
    const narrative = NarrativeBuilder.build(response);
    assert.throws(() => {
      narrative._data.executiveSummary = 'Changed';
    }, TypeError);
  });
});