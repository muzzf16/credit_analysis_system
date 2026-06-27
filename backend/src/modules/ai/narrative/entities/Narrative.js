const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');
const deepFreeze = require('../../../../utils/deepFreeze');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const schemaPath = path.join(__dirname, '../schemas/narrative.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8').replace(/^\uFEFF/, ''));
const validate = ajv.compile(schema);

class Narrative {
  constructor(data) {
    if (!validate(data)) {
      const errors = validate.errors.map((e) => `${e.instancePath} ${e.message}`).join(', ');
      throw new Error(`Invalid Narrative: ${errors}`);
    }
    this._data = deepFreeze(JSON.parse(JSON.stringify(data)));
  }

  get executiveSummary() { return this._data.executiveSummary; }
  get borrowerProfile() { return this._data.borrowerProfile; }
  get financialAnalysis() { return this._data.financialAnalysis; }
  get collateralAnalysis() { return this._data.collateralAnalysis; }
  get creditHistoryAnalysis() { return this._data.creditHistoryAnalysis; }
  get riskAssessment() { return this._data.riskAssessment; }
  get strengths() { return this._data.strengths; }
  get weaknesses() { return this._data.weaknesses; }
  get mitigation() { return this._data.mitigation; }
  get recommendation() { return this._data.recommendation; }
  get appendix() { return this._data.appendix; }

  toJSON() {
    return JSON.parse(JSON.stringify(this._data));
  }
}

module.exports = Narrative;