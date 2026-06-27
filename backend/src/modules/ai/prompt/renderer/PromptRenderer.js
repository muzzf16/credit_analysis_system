class PromptRenderer {
  static render(renderedPrompt, variables) {
    let result = JSON.stringify(renderedPrompt, null, 2);

    if (variables && typeof variables === 'object') {
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        const stringValue = typeof value === 'number'
          ? new Intl.NumberFormat('id-ID').format(value)
          : String(value || '');
        result = result.replace(placeholder, stringValue);
      }
    }

    return result;
  }
}

module.exports = PromptRenderer;