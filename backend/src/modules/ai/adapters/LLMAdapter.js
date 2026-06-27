class LLMAdapter {
  async generate(renderedPrompt, options) {
    throw new Error('LLMAdapter.generate must be implemented by subclass');
  }
}

module.exports = LLMAdapter;