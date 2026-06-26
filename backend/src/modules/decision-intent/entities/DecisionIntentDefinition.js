const crypto = require('crypto');
const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv({ allErrors: true });
const schemaPath = path.join(__dirname, '../schemas/intent-definition.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const validate = ajv.compile(schema);

class DecisionIntentDefinition {
  constructor(rawData) {
    if (!validate(rawData)) {
      const errors = validate.errors.map(e => `${e.instancePath} ${e.message}`).join(', ');
      throw new Error(`Invalid DecisionIntent Definition [${rawData.code}]: ${errors}`);
    }

    this.code = rawData.code;
    this.allowedRecommendations = Object.freeze([...rawData.allowedRecommendations]);
    this.allowedRiskLevels = Object.freeze([...rawData.allowedRiskLevels]);

    // Fingerprint
    const stableString = JSON.stringify({
      code: this.code,
      allowedRecommendations: this.allowedRecommendations,
      allowedRiskLevels: this.allowedRiskLevels
    });
    this.fingerprint = crypto.createHash('sha256').update(stableString).digest('hex');

    Object.freeze(this);
  }

  validateRecommendation(recommendation) {
    if (!this.allowedRecommendations.includes(recommendation)) {
      throw new Error(`DecisionIntent [${this.code}] recommendation '${recommendation}' is not allowed.`);
    }
    return true;
  }
  
  validateRiskLevel(riskLevel) {
    if (!this.allowedRiskLevels.includes(riskLevel)) {
      throw new Error(`DecisionIntent [${this.code}] riskLevel '${riskLevel}' is not allowed.`);
    }
    return true;
  }
}

module.exports = DecisionIntentDefinition;
