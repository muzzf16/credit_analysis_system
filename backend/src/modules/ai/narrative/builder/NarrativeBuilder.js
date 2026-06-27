const Narrative = require('../entities/Narrative');

class NarrativeBuilder {
  static build(llmResponse) {
    const parsed = NarrativeBuilder._parseResponse(llmResponse);
    return new Narrative(parsed);
  }

  static _parseResponse(response) {
    if (typeof response === 'string') {
      try {
        return JSON.parse(response);
      } catch {
        return NarrativeBuilder._fallbackParse(response);
      }
    }
    return response;
  }

  static _fallbackParse(text) {
    return {
      executiveSummary: text,
      recommendation: 'Lihat catatan lengkap di atas',
    };
  }
}

module.exports = NarrativeBuilder;