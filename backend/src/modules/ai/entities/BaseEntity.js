/**
 * Base Entity class with Ajv validation and deep freeze immutability
 * All AI module entities extend this class for consistency
 */
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');
const deepFreeze = require('../utils/deepFreeze');

class BaseEntity {
  constructor(data, schemaName) {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);

    const schemaPath = path.join(__dirname, `../modules/${schemaName}.schema.json`);
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    const validate = ajv.compile(schema);

    if (!validate(data)) {
      const errors = validate.errors.map((e) => `${e.instancePath} ${e.message}`).join(', ');
      throw new Error(`Invalid ${this.constructor.name}: ${errors}`);
    }

    this._data = deepFreeze(JSON.parse(JSON.stringify(data)));
  }

  toJSON() {
    return JSON.parse(JSON.stringify(this._data));
  }
}

module.exports = BaseEntity;