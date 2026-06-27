'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const { LLMAdapter, OpenAIAdapter, GeminiAdapter, GLMAdapter, QwenAdapter, OllamaAdapter, LlamaCppAdapter } = require('../../../../src/modules/ai/adapters');

describe('Sprint 6.4 — LLM Adapters', () => {
  test('LLMAdapter is abstract interface', async () => {
    const adapter = new LLMAdapter();
    await assert.rejects(
      async () => await adapter.generate({}, {}),
      /must be implemented/
    );
  });

  test('OpenAIAdapter has correct interface', () => {
    const adapter = new OpenAIAdapter({ apiKey: 'test' });
    assert.strictEqual(typeof adapter.generate, 'function');
  });

  test('GeminiAdapter has correct interface', () => {
    const adapter = new GeminiAdapter({ apiKey: 'test' });
    assert.strictEqual(typeof adapter.generate, 'function');
  });

  test('GLMAdapter has correct interface', () => {
    const adapter = new GLMAdapter({ apiKey: 'test' });
    assert.strictEqual(typeof adapter.generate, 'function');
  });

  test('QwenAdapter has correct interface', () => {
    const adapter = new QwenAdapter({ apiKey: 'test' });
    assert.strictEqual(typeof adapter.generate, 'function');
  });

  test('OllamaAdapter has correct interface', () => {
    const adapter = new OllamaAdapter();
    assert.strictEqual(typeof adapter.generate, 'function');
  });

  test('LlamaCppAdapter has correct interface', () => {
    const adapter = new LlamaCppAdapter();
    assert.strictEqual(typeof adapter.generate, 'function');
  });
});