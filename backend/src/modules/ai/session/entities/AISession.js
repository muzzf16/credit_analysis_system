const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const deepFreeze = require('../../utils/deepFreeze');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const schemaPath = path.join(__dirname, '../schemas/ai-session.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const validate = ajv.compile(schema);

class AISession {
  constructor(data) {
    if (!validate(data)) {
      const errors = validate.errors.map((e) => `${e.instancePath} ${e.message}`).join(', ');
      throw new Error(`Invalid AISession: ${errors}`);
    }
    this._data = deepFreeze(JSON.parse(JSON.stringify(data)));
  }

  get sessionId() { return this._data.sessionId; }
  get analysisPackageFingerprint() { return this._data.analysisPackageFingerprint; }
  get promptDefinition() { return this._data.promptDefinition; }
  get promptVersion() { return this._data.promptVersion; }
  get provider() { return this._data.provider; }
  get model() { return this._data.model; }
  get temperature() { return this._data.temperature; }
  get topP() { return this._data.topP; }
  get startedAt() { return this._data.startedAt; }
  get finishedAt() { return this._data.finishedAt; }
  get latencyMs() { return this._data.latencyMs; }
  get tokenUsage() { return this._data.tokenUsage; }
  get status() { return this._data.status; }
  get fingerprint() { return this._data.fingerprint; }

  toJSON() {
    return JSON.parse(JSON.stringify(this._data));
  }

  updateStatus(status, finishedAt, latencyMs, tokenUsage) {
    const updates = {
      status,
      finishedAt: finishedAt || new Date().toISOString(),
      latencyMs,
      tokenUsage,
      fingerprint: AISession.computeFingerprint({ ...this._data, status, finishedAt, latencyMs, tokenUsage }),
    };
    return new AISession({ ...this._data, ...updates });
  }

  static computeFingerprint(data) {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    return `sha256-${hash.digest('hex')}`;
  }
}

module.exports = AISession;