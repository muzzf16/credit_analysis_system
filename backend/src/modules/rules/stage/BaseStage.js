const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');
const RuleResolver = require('../resolver/rule.resolver');

const ajv = new Ajv({ allErrors: true });
const resultSchema = JSON.parse(fs.readFileSync(path.join(__dirname, '../schemas/stage-result.schema.json'), 'utf8'));
const metadataSchema = JSON.parse(fs.readFileSync(path.join(__dirname, '../schemas/stage-metadata.schema.json'), 'utf8'));

const validateResult = ajv.compile(resultSchema);
const validateMetadata = ajv.compile(metadataSchema);

/**
 * BaseStage - Orchestrates a collection of Rules defined in a Stage Profile.
 * 
 * Strict Template Method:
 * 1. Load Rule Set from Stage Profile
 * 2. Execute Rules (with tracing)
 * 3. Aggregate Results (Subclass can override for custom scoring)
 * 4. Validate output against Schema
 */
class BaseStage {
  static get metadata() {
    throw new Error('Subclass must implement static get metadata()');
  }

  /**
   * Optional hook for subclasses to implement custom scoring or status overrides.
   * By default, it just aggregates the boolean passed/failed.
   */
  static _aggregate(executionTrace) {
    const failedRules = executionTrace.filter(t => !t.passed);
    const passed = failedRules.length === 0;
    
    return {
      status: passed ? 'PASSED' : 'FAILED',
      score: passed ? 100 : 0
    };
  }

  /**
   * The Template Method
   * 
   * @param {Object} context
   * @param {Object} context.assessment
   * @param {Object} context.stageProfile
   * @param {Object} context.execution
   */
  static execute(context) {
    if (!context || !context.assessment || !context.stageProfile) {
      throw new Error(`Stage [${this.metadata.code}] execution failed: Missing assessment or stageProfile.`);
    }

    const stageStartedAt = Date.now();
    const rules = context.stageProfile.rules || [];
    
    const executionTrace = [];
    const allMetrics = [];
    let allReasonCodes = [];
    let rulesExecuted = 0;
    let rulesPassed = 0;
    let rulesFailed = 0;

    // 1. Execute Rules Sequential (can be parallelized later if needed)
    for (const ruleConfig of rules) {
      const RuleClass = RuleResolver.resolve(ruleConfig.code);
      
      const ruleStartedAt = Date.now();
      let passed = false;
      
      try {
        const ruleResult = RuleClass.execute(context); // context is { assessment, stageProfile, execution }
        passed = ruleResult.passed;
        
        allMetrics.push(...ruleResult.metrics);
        allReasonCodes.push(...ruleResult.reasonCodes);
      } catch (err) {
        // If a rule fails unexpectedly, we record it as FAILED and push a generic reason
        passed = false;
        allReasonCodes.push(`${ruleConfig.code}_EXECUTION_ERROR`);
        console.error(`Rule [${ruleConfig.code}] execution error:`, err);
      }

      const ruleFinishedAt = Date.now();
      const durationMs = ruleFinishedAt - ruleStartedAt;

      executionTrace.push({
        rule: ruleConfig.code,
        startedAt: new Date(ruleStartedAt).toISOString(),
        finishedAt: new Date(ruleFinishedAt).toISOString(),
        durationMs,
        passed
      });

      rulesExecuted++;
      if (passed) rulesPassed++;
      else rulesFailed++;
    }

    // 2. Aggregate Results (Subclass hook)
    const aggregation = this._aggregate(executionTrace);
    
    // 3. Build Stage Result
    const stageFinishedAt = Date.now();
    const stageDuration = stageFinishedAt - stageStartedAt;

    const result = {
      stage: this.metadata.code,
      status: aggregation.status,
      score: aggregation.score,
      summary: {
        rulesExecuted,
        rulesPassed,
        rulesFailed,
        durationMs: stageDuration
      },
      metrics: allMetrics,
      reasonCodes: [...new Set(allReasonCodes)], // unique reason codes
      executionTrace
    };

    // 4. Validate Result Schema
    if (!validateResult(result)) {
      const errors = validateResult.errors.map(e => `${e.instancePath} ${e.message}`).join(', ');
      throw new Error(`Stage [${this.metadata.code}] produced invalid result: ${errors}`);
    }

    return result;
  }

  static validateContract() {
    if (!validateMetadata(this.metadata)) {
      const errors = validateMetadata.errors.map(e => `${e.instancePath} ${e.message}`).join(', ');
      throw new Error(`Stage [${this.name}] has invalid metadata: ${errors}`);
    }
  }
}

module.exports = BaseStage;
