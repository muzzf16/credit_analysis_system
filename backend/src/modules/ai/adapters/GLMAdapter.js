const LLMAdapter = require('./LLMAdapter');

class GLMAdapter extends LLMAdapter {
  constructor(config = {}) {
    super();
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.llamamind.com/v1';
  }

  async generate(renderedPrompt, options) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model?.name || 'glm-4',
        messages: [
          { role: 'system', content: renderedPrompt.system },
          { role: 'user', content: renderedPrompt.user },
        ],
        temperature: options?.generation?.temperature ?? 0.2,
        max_tokens: options?.generation?.maxTokens ?? 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`GLM API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || '',
      usage: data.usage,
      model: data.model,
    };
  }
}

module.exports = GLMAdapter;