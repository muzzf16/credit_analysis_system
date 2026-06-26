const crypto = require('crypto');
const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv({ allErrors: true });
const schemaPath = path.join(__dirname, '../schemas/fact-definition.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const validate = ajv.compile(schema);

class FactDefinition {
  constructor(rawData) {
    if (!validate(rawData)) {
      const errors = validate.errors.map(e => `${e.instancePath} ${e.message}`).join(', ');
      throw new Error(`Invalid Fact Definition [${rawData.code}]: ${errors}`);
    }

    this.code = rawData.code;
    this.type = rawData.type;
    this.description = rawData.description;
    
    if (rawData.allowedValues) this.allowedValues = Object.freeze([...rawData.allowedValues]);
    if (rawData.min !== undefined) this.min = rawData.min;
    if (rawData.max !== undefined) this.max = rawData.max;
    if (rawData.unit) this.unit = rawData.unit;
    if (rawData.consumer) this.consumer = Object.freeze([...rawData.consumer]);

    // Fingerprint
    const stableString = JSON.stringify({
      code: this.code,
      type: this.type,
      allowedValues: this.allowedValues,
      min: this.min,
      max: this.max,
      unit: this.unit
    });
    this.fingerprint = crypto.createHash('sha256').update(stableString).digest('hex');

    Object.freeze(this);
  }

  validateValue(value) {
    if (value === undefined || value === null) {
      throw new Error(`Fact [${this.code}] value cannot be null or undefined.`);
    }

    // 1. Check Type
    if (this.type === 'BOOLEAN' && typeof value !== 'boolean') {
      throw new Error(`Fact [${this.code}] expects BOOLEAN but got ${typeof value}`);
    }
    if (this.type === 'INTEGER' && !Number.isInteger(value)) {
      throw new Error(`Fact [${this.code}] expects INTEGER but got ${value}`);
    }
    if (this.type === 'NUMBER' && typeof value !== 'number') {
      throw new Error(`Fact [${this.code}] expects NUMBER but got ${typeof value}`);
    }
    if (this.type === 'STRING' && typeof value !== 'string') {
      throw new Error(`Fact [${this.code}] expects STRING but got ${typeof value}`);
    }

    // 2. Check ENUM (allowedValues)
    if (this.type === 'ENUM') {
      if (!this.allowedValues || !this.allowedValues.includes(value)) {
        throw new Error(`Fact [${this.code}] value '${value}' is not in allowedValues: ${this.allowedValues}`);
      }
    }

    // 3. Check Constraints
    if (this.min !== undefined && value < this.min) {
      throw new Error(`Fact [${this.code}] value ${value} is less than min ${this.min}`);
    }
    if (this.max !== undefined && value > this.max) {
      throw new Error(`Fact [${this.code}] value ${value} is greater than max ${this.max}`);
    }

    return true;
  }
}

module.exports = FactDefinition;
