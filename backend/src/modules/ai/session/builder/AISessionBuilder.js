const AISession = require('../entities/AISession');
const crypto = require('crypto');

class AISessionBuilder {
  static create(analysisPackage, promptDefinition, options = {}) {
    if (!analysisPackage || !analysisPackage.fingerprint) {
      throw new Error('AISessionBuilder requires AnalysisPackage with fingerprint');
    }

    const sessionId = `AI-SESS-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const startedAt = new Date().toISOString();

    const sessionData = {
      sessionId,
      analysisPackageFingerprint: analysisPackage.fingerprint,
      promptDefinition: promptDefinition?.code || 'UNKNOWN',
      promptVersion: promptDefinition?.version || '1.0.0',
      provider: options.provider || 'UNKNOWN',
      model: options.model || 'UNKNOWN',
      temperature: options.temperature || 0.2,
      topP: options.topP || 1.0,
      startedAt,
      status: 'STARTED',
      fingerprint: AISession.computeFingerprint({
        sessionId,
        analysisPackageFingerprint: analysisPackage.fingerprint,
        startedAt,
        status: 'STARTED',
      }),
    };

    return new AISession(sessionData);
  }

  static complete(session, latencyMs, tokenUsage) {
    return session.updateStatus('COMPLETED', new Date().toISOString(), latencyMs, tokenUsage);
  }

  static fail(session, error) {
    return session.updateStatus('FAILED', new Date().toISOString(), null, null);
  }
}

module.exports = AISessionBuilder;