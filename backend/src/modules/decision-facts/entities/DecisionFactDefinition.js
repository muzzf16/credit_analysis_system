const crypto = require('crypto');
const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv({ allErrors: true });
const schemaPath = path.join(__dirname, '../schemas/decision-fact-definition.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const validate = ajv.compile(schema);

class DecisionFactDefinition {
  constructor(rawData) {
    if (!validate(rawData)) {
      const errors = validate.errors.map(e => `${e.instancePath} ${e.message}`).join(', ');
      throw new Error(`Invalid DecisionFact Definition [${rawData.code}]: ${errors}`);
    }

    this.code = rawData.code;
    this.name = rawData.name;
    this.type = rawData.type;
    this.description = rawData.description;

    // Fingerprint
    const stableString = JSON.stringify({
      code: this.code,
      name: this.name,
      type: this.type
    });
    this.fingerprint = crypto.createHash('sha256').update(stableString).digest('hex');

    Object.freeze(this);
  }

  validateValue(value) {
    if (value === undefined || value === null) {
      throw new Error(`DecisionFact [${this.code}] value cannot be null or undefined.`);
    }

    if (this.type === 'BOOLEAN' && typeof value !== 'boolean') {
      throw new Error(`DecisionFact [${this.code}] expects BOOLEAN but got ${typeof value}`);
    }
    if (this.type === 'NUMBER' && typeof value !== 'number') {
      throw new Error(`DecisionFact [${this.code}] expects NUMBER but got ${typeof value}`);
    }
    if (this.type === 'STRING' && typeof value !== 'string') {
      throw new Error(`DecisionFact [${this.code}] expects STRING but got ${typeof value}`);
    }

    return true;
  }
}

module.exports = DecisionFactDefinition;
