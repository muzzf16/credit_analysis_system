const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const schemaPath = path.join(__dirname, '../schemas/decision-revision.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const validate = ajv.compile(schema);

/**
 * DecisionRevision — immutable record in the DecisionKernel revision lineage.
 */
class DecisionRevision {
  constructor(data) {
    if (!validate(data)) {
      const errors = validate.errors.map((e) => `${e.instancePath} ${e.message}`).join(', ');
      throw new Error(`Invalid DecisionRevision: ${errors}`);
    }
    this._data = Object.freeze(JSON.parse(JSON.stringify(data)));
  }

  get revisionId() { return this._data.revisionId; }
  get decisionId() { return this._data.decisionId; }
  get revision() { return this._data.revision; }
  get previousRevisionId() { return this._data.previousRevisionId; }
  get assessmentId() { return this._data.assessmentId; }
  get trigger() { return this._data.trigger; }
  get createdAt() { return this._data.createdAt; }
  get kernelFingerprint() { return this._data.kernelFingerprint; }
  get correlationId() { return this._data.correlationId; }

  toJSON() {
    return JSON.parse(JSON.stringify(this._data));
  }
}

module.exports = DecisionRevision;
