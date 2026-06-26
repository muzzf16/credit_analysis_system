const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv({ allErrors: true });
const resultSchema = JSON.parse(fs.readFileSync(path.join(__dirname, '../schemas/formula-result.schema.json'), 'utf8'));
const metadataSchema = JSON.parse(fs.readFileSync(path.join(__dirname, '../schemas/formula-metadata.schema.json'), 'utf8'));

const validateResult = ajv.compile(resultSchema);
const validateMetadata = ajv.compile(metadataSchema);

/**
 * BaseFormula - Enforces the contract for all granular formulas.
 * 
 * Formulas must be completely stateless, ignorant of policies or business rules.
 * They take raw inputs and produce a structured result: { code, value, unit }.
 */
class BaseFormula {
  /**
   * Must be overridden by subclasses to provide metadata.
   */
  static get metadata() {
    throw new Error('Subclass must implement static get metadata()');
  }

  /**
   * Must be overridden by subclasses to perform the calculation.
   * @param {Object} input - Named parameters for the formula
   * @returns {number|string|boolean|null} The raw computed value
   */
  static _compute(input) {
    throw new Error('Subclass must implement static _compute(input)');
  }

  /**
   * Template method to safely execute the formula and validate its result.
   * @param {Object} input 
   * @returns {Object} Structured result conforming to Formula Result Schema
   */
  static execute(input) {
    // 1. Calculate raw value
    let rawValue;
    try {
      rawValue = this._compute(input);
    } catch (err) {
      throw new Error(`Formula [${this.metadata.code}] execution failed: ${err.message}`);
    }

    // 2. Format result
    const result = {
      code: this.metadata.code,
      value: rawValue,
      unit: this.metadata.unit
    };

    // Apply precision if applicable
    if (typeof result.value === 'number' && this.metadata.precision !== undefined) {
      const factor = Math.pow(10, this.metadata.precision);
      result.value = Math.round(result.value * factor) / factor;
    }

    // 3. Validate result contract
    if (!validateResult(result)) {
      const errors = validateResult.errors.map(e => `${e.instancePath} ${e.message}`).join(', ');
      throw new Error(`Formula [${this.metadata.code}] produced invalid result: ${errors}`);
    }

    return result;
  }

  /**
   * Validate the formula's metadata at registry time
   */
  static validateContract() {
    if (!validateMetadata(this.metadata)) {
      const errors = validateMetadata.errors.map(e => `${e.instancePath} ${e.message}`).join(', ');
      throw new Error(`Formula [${this.name}] has invalid metadata: ${errors}`);
    }
  }
}

module.exports = BaseFormula;
