const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const schemaPath = path.join(__dirname, '../schemas/decision-kernel.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const validate = ajv.compile(schema);

const RECOMMENDATION_STATUS = Object.freeze({
  APPROVE: 'APPROVED',
  APPROVE_WITH_CONDITION: 'APPROVED_WITH_CONDITION',
  MANUAL_REVIEW: 'MANUAL_REVIEW',
  REJECT: 'REJECTED',
});

/**
 * DecisionKernel — Aggregate Root of the Credit Decision Platform.
 * Single source of truth for all decision consumers.
 */
class DecisionKernel {
  /**
   * @param {Object} data - Validated kernel payload
   */
  constructor(data) {
    if (!validate(data)) {
      const errors = validate.errors.map((e) => `${e.instancePath} ${e.message}`).join(', ');
      throw new Error(`Invalid DecisionKernel: ${errors}`);
    }

    this._data = deepFreeze(JSON.parse(JSON.stringify(data)));
  }

  get decisionId() { return this._data.decisionId; }
  get revisionId() { return this._data.revisionId; }
  get revision() { return this._data.revision; }
  get assessmentId() { return this._data.assessmentId; }
  get recommendation() { return this._data.recommendation; }
  get authority() { return this._data.authority; }
  get conditions() { return this._data.conditions; }
  get override() { return this._data.override; }
  get intent() { return this._data.intent; }
  get policy() { return this._data.policy; }
  get manifest() { return this._data.manifest; }
  get audit() { return this._data.audit; }

  /**
   * @returns {Object} Immutable plain-object snapshot
   */
  toJSON() {
    return JSON.parse(JSON.stringify(this._data));
  }
}

function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }
  return obj;
}

DecisionKernel.RECOMMENDATION_STATUS = RECOMMENDATION_STATUS;

module.exports = DecisionKernel;
