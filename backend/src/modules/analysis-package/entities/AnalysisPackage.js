const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const deepFreeze = require('../../../utils/deepFreeze');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const schemaPath = path.join(__dirname, '../schemas/analysis-package.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const validate = ajv.compile(schema);

class AnalysisPackage {
  constructor(data) {
    if (!validate(data)) {
      const errors = validate.errors.map((e) => `${e.instancePath} ${e.message}`).join(', ');
      throw new Error(`Invalid AnalysisPackage: ${errors}`);
    }
    this._data = deepFreeze(JSON.parse(JSON.stringify(data)));
  }

  get packageId() { return this._data.packageId; }
  get assessmentId() { return this._data.assessmentId; }
  get decisionKernel() { return this._data.decisionKernel; }
  get factCollection() { return this._data.factCollection; }
  get capabilityCollection() { return this._data.capabilityCollection; }
  get intent() { return this._data.intent; }
  get policy() { return this._data.policy; }
  get fingerprint() { return this._data.fingerprint; }
  get createdAt() { return this._data.createdAt; }
  get version() { return this._data.version; }

  toJSON() {
    return JSON.parse(JSON.stringify(this._data));
  }
}

AnalysisPackage.computeFingerprint = function(data) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(data));
  return `sha256-${hash.digest('hex')}`;
};

module.exports = AnalysisPackage;