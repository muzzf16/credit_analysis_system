const LLMAdapter = require('./LLMAdapter');

class QwenAdapter extends LLMAdapter {
  constructor(config = {}) {
    super();
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.qwen.ai/v1';
  }

  async generate(renderedPrompt, options) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model?.name || 'qwen-max',
        messages: [
          { role: 'system', content: renderedPrompt.system },
          { role: 'user', content: renderedPrompt.user },
        ],
        temperature: options?.generation?.temperature ?? 0.2,
        max_tokens: options?.generation?.maxTokens ?? 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Qwen API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || '',
      usage: data.usage,
      model: data.model,
    };
  }
}

module.exports = QwenAdapter;