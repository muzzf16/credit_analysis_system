const LLMAdapter = require('./LLMAdapter');

class LlamaCppAdapter extends LLMAdapter {
  constructor(config = {}) {
    super();
    this.baseUrl = config.baseUrl || 'http://localhost:1978';
    this.apiKey = config.apiKey || '';
  }

  async generate(renderedPrompt, options) {
    const isRawCompletion = this.baseUrl.endsWith('/completion') || options?.useRawCompletion;
    
    const headers = { 'Content-Type': 'application/json' };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    if (isRawCompletion) {
      // Format prompt manually if using raw /completion endpoint
      let promptText = '';
      if (renderedPrompt.system) {
        promptText += `<|im_start|>system\n${renderedPrompt.system}<|im_end|>\n`;
      }
      promptText += `<|im_start|>user\n${renderedPrompt.user}<|im_end|>\n<|im_start|>assistant\n`;

      const endpoint = this.baseUrl.endsWith('/completion') ? this.baseUrl : `${this.baseUrl}/completion`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: promptText,
          temperature: options?.generation?.temperature ?? 0.2,
          n_predict: options?.generation?.maxTokens ?? 4000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Llama.cpp raw completion error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.content || '',
        model: options?.model?.name || 'llama.cpp',
      };
    } else {
      // Default to OpenAI-compatible Chat Completions
      const messages = [];
      if (renderedPrompt.system) {
        messages.push({ role: 'system', content: renderedPrompt.system });
      }
      messages.push({ role: 'user', content: renderedPrompt.user });

      let endpoint = this.baseUrl;
      // If endpoint doesn't end with /v1 and doesn't contain /v1/
      if (!endpoint.endsWith('/v1') && !endpoint.includes('/v1/')) {
        endpoint = endpoint.replace(/\/$/, '') + '/v1';
      }
      endpoint = `${endpoint}/chat/completions`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: options?.model?.name || 'qwen3.5',
          messages,
          temperature: options?.generation?.temperature ?? 0.2,
          max_tokens: options?.generation?.maxTokens ?? 4000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Llama.cpp chat completion error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.choices[0]?.message?.content || '',
        usage: data.usage,
        model: data.model,
      };
    }
  }
}

module.exports = LlamaCppAdapter;
