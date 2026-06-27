const LLMAdapter = require('./LLMAdapter');

class OpenAIAdapter extends LLMAdapter {
  constructor(config = {}) {
    super();
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  async generate(renderedPrompt, options) {
    const messages = [
      { role: 'system', content: renderedPrompt.system },
      { role: 'user', content: renderedPrompt.user },
    ];

    if (renderedPrompt.developer) {
      messages.splice(1, 0, { role: 'assistant', content: renderedPrompt.developer });
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model?.name || 'gpt-4',
        messages,
        temperature: options?.generation?.temperature ?? 0.2,
        max_tokens: options?.generation?.maxTokens ?? 4000,
        top_p: options?.generation?.topP ?? 1.0,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || '',
      usage: data.usage,
      model: data.model,
    };
  }
}

module.exports = OpenAIAdapter;