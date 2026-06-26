const crypto = require('crypto');
const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');
const PipelineResolver = require('./resolver/pipeline.resolver');
const StageResolver = require('../../rules/stage/resolver/stage.resolver');
const ProfileResolver = require('../../profiles/resolver/profile.resolver');

const ajv = new Ajv({ allErrors: true });
const resultSchema = JSON.parse(fs.readFileSync(path.join(__dirname, '../schemas/pipeline-result.schema.json'), 'utf8'));
const validateResult = ajv.compile(resultSchema);

/**
 * PipelineEngine
 * Orchestrates multiple Stages sequentially based on a PipelinePlan.
 */
class PipelineEngine {
  /**
   * Execute a Pipeline
   * 
   * @param {Object} request
   * @param {Object} request.assessment - The assessment data
   * @param {Object} request.policy - Minimal policy config containing { pipelinePlan, version, fingerprint }
   * @param {Object} request.execution - { correlationId, startedAt }
   */
  static execute(request) {
    if (!request || !request.assessment || !request.policy || !request.policy.pipelinePlan) {
      throw new Error('PipelineEngine: Missing assessment or policy.pipelinePlan in request.');
    }

    // 1. Resolve Pipeline Plan Entity
    const pipelineEntity = PipelineResolver.resolve({ 
      pipeline: request.policy.pipelinePlan, 
      version: request.policy.version 
    });

    const stageResults = [];
    let allReasonCodes = [];
    const usedProfileFingerprints = [];
    let pipelineStatus = 'PASSED';
    let totalScore = 0;

    // 2. Execute Stages Sequentially
    for (const stageConfig of pipelineEntity.stages) {
      // 2a. Resolve Profile Entity
      const stageProfileEntity = ProfileResolver.resolve({ profile: stageConfig.profile });
      usedProfileFingerprints.push(stageProfileEntity.fingerprint);

      // 2b. Resolve Stage Class
      const StageClass = StageResolver.resolve(stageConfig.code);

      // 2c. Prepare context for Stage
      const stageContext = {
        assessment: request.assessment,
        stageProfile: stageProfileEntity, // Passing ENTITY, not raw JSON
        execution: request.execution
      };

      // 2d. Execute Stage
      try {
        const stageResult = StageClass.execute(stageContext);
        stageResults.push(stageResult);

        allReasonCodes.push(...stageResult.reasonCodes);
        totalScore += (stageResult.score || 0);

        // Simple aggregation logic: if ANY stage fails, pipeline fails.
        // We can make this configurable later via PipelinePlan if needed.
        if (stageResult.status === 'FAILED') {
          pipelineStatus = 'FAILED';
        } else if (stageResult.status === 'WARNING' && pipelineStatus === 'PASSED') {
          pipelineStatus = 'WARNING';
        }
      } catch (err) {
        pipelineStatus = 'FAILED';
        stageResults.push({
          stage: stageConfig.code,
          status: 'FAILED',
          score: 0,
          summary: { rulesExecuted: 0, rulesPassed: 0, rulesFailed: 0, durationMs: 0 },
          metrics: [],
          reasonCodes: [`${stageConfig.code}_PIPELINE_EXECUTION_ERROR`],
          executionTrace: []
        });
        allReasonCodes.push(`${stageConfig.code}_PIPELINE_EXECUTION_ERROR`);
        console.error(`Pipeline Engine Error executing stage [${stageConfig.code}]:`, err);
      }
    }

    // Average Score (simple math for now)
    const avgScore = stageResults.length > 0 ? (totalScore / stageResults.length) : 0;

    // 3. Build PipelineResult
    const result = {
      pipeline: pipelineEntity.metadata.code,
      status: pipelineStatus,
      score: Math.round(avgScore),
      fingerprints: {
        policy: request.policy.fingerprint || 'UNKNOWN_POLICY_FINGERPRINT', // From request
        pipeline: pipelineEntity.fingerprint,
        profiles: usedProfileFingerprints
      },
      stages: stageResults,
      reasonCodes: [...new Set(allReasonCodes)]
    };

    // 4. Validate PipelineResult
    if (!validateResult(result)) {
      const errors = validateResult.errors.map(e => `${e.instancePath} ${e.message}`).join(', ');
      throw new Error(`PipelineEngine produced invalid result: ${errors}`);
    }

    return result;
  }
}

module.exports = PipelineEngine;
