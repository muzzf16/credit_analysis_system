const crypto = require('crypto');
const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv({ allErrors: true });
const schemaPath = path.join(__dirname, '../schemas/capability-definition.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const validate = ajv.compile(schema);

class CapabilityDefinition {
  constructor(rawData) {
    if (!validate(rawData)) {
      const errors = validate.errors.map(e => `${e.instancePath} ${e.message}`).join(', ');
      throw new Error(`Invalid Capability Definition [${rawData.code}]: ${errors}`);
    }

    this.code = rawData.code;
    this.name = rawData.name;
    this.description = rawData.description;
    this.allowedStatuses = Object.freeze([...rawData.allowedStatuses]);

    // Fingerprint
    const stableString = JSON.stringify({
      code: this.code,
      name: this.name,
      allowedStatuses: this.allowedStatuses
    });
    this.fingerprint = crypto.createHash('sha256').update(stableString).digest('hex');

    Object.freeze(this);
  }

  validateStatus(status) {
    if (!status || !this.allowedStatuses.includes(status)) {
      throw new Error(`Capability [${this.code}] status '${status}' is not in allowedStatuses: ${this.allowedStatuses}`);
    }
    return true;
  }
}

module.exports = CapabilityDefinition;
