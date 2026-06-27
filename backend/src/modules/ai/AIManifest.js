class AIManifest {
  constructor(data = {}) {
    this.analysisPackageVersion = data.analysisPackageVersion || '1.0.0';
    this.promptVersion = data.promptVersion || '1.0.0';
    this.adapter = data.adapter || 'UnknownAdapter';
    this.model = data.model || 'UnknownModel';
    this.renderer = data.renderer || 'PromptRenderer';
    this.narrativeVersion = data.narrativeVersion || '1.0.0';
  }

  toJSON() {
    return {
      analysisPackageVersion: this.analysisPackageVersion,
      promptVersion: this.promptVersion,
      adapter: this.adapter,
      model: this.model,
      renderer: this.renderer,
      narrativeVersion: this.narrativeVersion,
    };
  }

  static computeFingerprint(manifest) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(manifest));
    return `sha256-${hash.digest('hex')}`;
  }
}

module.exports = AIManifest;
