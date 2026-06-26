const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv({ allErrors: true });
const resultSchema = JSON.parse(fs.readFileSync(path.join(__dirname, '../schemas/rule-result.schema.json'), 'utf8'));
const metadataSchema = JSON.parse(fs.readFileSync(path.join(__dirname, '../schemas/rule-metadata.schema.json'), 'utf8'));

const validateResult = ajv.compile(resultSchema);
const validateMetadata = ajv.compile(metadataSchema);

/**
 * BaseRule - Abstract base class for all Business Rules.
 * 
 * Enforces the strict Template Method:
 * 1. validate (inputs/context)
 * 2. execute (via subclass _evaluate)
 * 3. validate output (against RuleResult schema)
 */
class BaseRule {
  /**
   * Must be overridden by subclasses to provide metadata.
   */
  static get metadata() {
    throw new Error('Subclass must implement static get metadata()');
  }

  /**
   * Must be overridden by subclasses.
   * Performs the actual business logic evaluation.
   * @param {Object} context - { assessment, policy, facts }
   * @returns {Object} Structured { passed, metrics, reasonCodes }
   */
  static _evaluate(context) {
    throw new Error('Subclass must implement static _evaluate(context)');
  }

  /**
   * Template method orchestrating the rule execution safely.
   * 
   * @param {Object} context 
   * @param {Object} context.assessment - The assessment context
   * @param {Object} context.stageProfile - The stage profile (contains rule parameters)
   * @param {Object} context.execution - { correlationId, startedAt } for tracing
   * @returns {Object} Structured rule result
   */
  static execute(context) {
    // 1. Pre-execution Validation
    if (!context || !context.assessment || !context.stageProfile) {
      throw new Error(`Rule [${this.metadata.code}] execution failed: Missing assessment or stageProfile context.`);
    }

    // 2. Execute Business Logic (Subclass)
    let evaluation;
    try {
      evaluation = this._evaluate(context);
    } catch (err) {
      throw new Error(`Rule [${this.metadata.code}] evaluation crashed: ${err.message}`);
    }

    // Wrap the evaluation in the final result format
    const result = {
      code: this.metadata.code,
      passed: evaluation.passed,
      metrics: evaluation.metrics,
      reasonCodes: evaluation.reasonCodes
    };

    // 3. Post-execution Output Validation
    if (!validateResult(result)) {
      const errors = validateResult.errors.map(e => `${e.instancePath} ${e.message}`).join(', ');
      throw new Error(`Rule [${this.metadata.code}] produced invalid result: ${errors}`);
    }

    return result;
  }

  /**
   * Validate the rule's metadata at registry time
   */
  static validateContract() {
    if (!validateMetadata(this.metadata)) {
      const errors = validateMetadata.errors.map(e => `${e.instancePath} ${e.message}`).join(', ');
      throw new Error(`Rule [${this.name}] has invalid metadata: ${errors}`);
    }
  }
}

module.exports = BaseRule;
