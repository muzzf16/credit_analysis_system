const crypto = require('crypto');
const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv({ allErrors: true });
const schemaPath = path.join(__dirname, '../schemas/stage-profile.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const validate = ajv.compile(schema);

/**
 * StageProfile Entity
 * Represents an Immutable, Validated, and Fingerprinted Rule Set configuration.
 */
class StageProfile {
  /**
   * @param {Object} rawData 
   */
  constructor(rawData) {
    if (!validate(rawData)) {
      const errors = validate.errors.map(e => `${e.instancePath} ${e.message}`).join(', ');
      throw new Error(`Invalid Stage Profile configuration: ${errors}`);
    }

    this.metadata = Object.freeze({ ...rawData.metadata });
    this.stage = rawData.stage;
    this.rules = rawData.rules.map(r => Object.freeze({
      code: r.code,
      parameters: r.parameters ? Object.freeze({ ...r.parameters }) : undefined
    }));
    Object.freeze(this.rules);

    // Compute SHA-256 Fingerprint
    const stableString = JSON.stringify({
      metadata: this.metadata,
      stage: this.stage,
      rules: this.rules
    });
    this.fingerprint = crypto.createHash('sha256').update(stableString).digest('hex');

    Object.freeze(this);
  }
}

module.exports = StageProfile;
