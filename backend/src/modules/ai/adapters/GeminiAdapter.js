const LLMAdapter = require('./LLMAdapter');

class GeminiAdapter extends LLMAdapter {
  constructor(config = {}) {
    super();
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  }

  async generate(renderedPrompt, options) {
    const contents = [
      { role: 'user', parts: [{ text: renderedPrompt.system }] },
      { role: 'model', parts: [{ text: renderedPrompt.developer || '' }] },
      { role: 'user', parts: [{ text: renderedPrompt.user }] },
    ];

    const response = await fetch(
      `${this.baseUrl}/models/gemini-${options?.model?.name || 'pro'}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: options?.generation?.temperature ?? 0.2,
            maxOutputTokens: options?.generation?.maxTokens ?? 4000,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.candidates[0]?.content?.parts[0]?.text || '',
      usage: data.candidates[0]?.usageMetadata,
      model: `gemini-${options?.model?.name || 'pro'}`,
    };
  }
}

module.exports = GeminiAdapter;