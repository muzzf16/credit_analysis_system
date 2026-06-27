const LLMAdapter = require('./LLMAdapter');

class OllamaAdapter extends LLMAdapter {
  constructor(config = {}) {
    super();
    this.baseUrl = config.baseUrl || 'http://localhost:11434/api';
  }

  async generate(renderedPrompt, options) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options?.model?.name || 'qwen2.5:latest',
        messages: [
          { role: 'system', content: renderedPrompt.system },
          { role: 'user', content: renderedPrompt.user },
        ],
        temperature: options?.generation?.temperature ?? 0.2,
        num_predict: options?.generation?.maxTokens ?? 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.message?.content || '',
      model: data.model,
    };
  }
}

module.exports = OllamaAdapter;