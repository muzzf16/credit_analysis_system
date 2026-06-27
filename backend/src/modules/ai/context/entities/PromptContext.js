const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');
const deepFreeze = require('../../../../utils/deepFreeze');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const schemaPath = path.join(__dirname, '../schemas/prompt-context.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const validate = ajv.compile(schema);

class PromptContext {
  constructor(data) {
    if (!validate(data)) {
      const errors = validate.errors.map((e) => `${e.instancePath} ${e.message}`).join(', ');
      throw new Error(`Invalid PromptContext: ${errors}`);
    }
    this._data = deepFreeze(JSON.parse(JSON.stringify(data)));
  }

  get packageId() { return this._data.packageId; }
  get summary() { return this._data.summary; }
  get risk() { return this._data.risk; }
  get facts() { return this._data.facts; }
  get capabilities() { return this._data.capabilities; }
  get recommendation() { return this._data.recommendation; }
  get conditions() { return this._data.conditions; }
  get authority() { return this._data.authority; }
  get appendix() { return this._data.appendix; }
  get borrower() { return this._data.borrower; }

  toJSON() {
    return JSON.parse(JSON.stringify(this._data));
  }
}

module.exports = PromptContext;