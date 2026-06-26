"use strict";
const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const PipelineEngine = require('../../../../src/modules/decision/pipeline/PipelineEngine');
const { instance: pipelineRegistry, PipelinePlan } = require('../../../../src/modules/decision/pipeline/registry/pipeline.registry');
const { instance: profileRegistry } = require('../../../../src/modules/profiles/registry/profile.registry');
const StageProfile = require('../../../../src/modules/profiles/entities/StageProfile');
const { StageRegistry } = require('../../../../src/modules/rules/stage/registry/stage.registry');
const BaseStage = require('../../../../src/modules/rules/stage/BaseStage');
const { instance: ruleRegistry } = require('../../../../src/modules/rules/registry/rule.registry');
const BaseRule = require('../../../../src/modules/rules/library/BaseRule');

describe('Pipeline Engine Orchestration Tests', () => {
  before(() => {
    // 1. Mock Rules
    class MockPassRule extends BaseRule {
      static get metadata() { return { code: 'M_PASS', category: 'FINANCIAL', version: '1', severity: 'LOW' }; }
      static _evaluate() { return { passed: true, metrics: [{ code: 'M', value: 1 }], reasonCodes: ['OK'] }; }
    }
    class MockFailRule extends BaseRule {
      static get metadata() { return { code: 'M_FAIL', category: 'ELIGIBILITY', version: '1', severity: 'HIGH' }; }
      static _evaluate() { return { passed: false, metrics: [{ code: 'M', value: 0 }], reasonCodes: ['BAD'] }; }
    }
    if (!ruleRegistry.get('M_PASS')) ruleRegistry.register(MockPassRule);
    if (!ruleRegistry.get('M_FAIL')) ruleRegistry.register(MockFailRule);

    // 2. Mock Stages
    const stageRegistry = require('../../../../src/modules/rules/stage/registry/stage.registry').instance;
    class StageA extends BaseStage { static get metadata() { return { code: 'STAGE_A', category: 'ASSESSMENT', version: '1' }; } }
    class StageB extends BaseStage { static get metadata() { return { code: 'STAGE_B', category: 'ASSESSMENT', version: '1' }; } }
    if (!stageRegistry.get('STAGE_A')) stageRegistry.register(StageA);
    if (!stageRegistry.get('STAGE_B')) stageRegistry.register(StageB);

    // 3. Mock Profiles
    const profileA = new StageProfile({
      metadata: { code: 'PROF_A', version: '1', status: 'ACTIVE' },
      stage: 'STAGE_A',
      rules: [{ code: 'M_PASS' }]
    });
    const profileB = new StageProfile({
      metadata: { code: 'PROF_B', version: '1', status: 'ACTIVE' },
      stage: 'STAGE_B',
      rules: [{ code: 'M_FAIL' }]
    });
    profileRegistry.register(profileA);
    profileRegistry.register(profileB);

    // 4. Mock Pipeline Plan
    const plan = new PipelinePlan({
      metadata: { code: 'TEST_PIPELINE', version: '1', status: 'ACTIVE' },
      stages: [
        { code: 'STAGE_A', profile: 'PROF_A' },
        { code: 'STAGE_B', profile: 'PROF_B' }
      ]
    });
    pipelineRegistry.register(plan);
  });

  test('Should orchestrate multi-stage pipeline and aggregate PipelineResult', () => {
    const request = {
      assessment: {},
      policy: {
        pipelinePlan: 'TEST_PIPELINE',
        fingerprint: 'POLICY_FINGERPRINT_123'
      },
      execution: { correlationId: 'XYZ' }
    };

    const result = PipelineEngine.execute(request);
    
    assert.strictEqual(result.pipeline, 'TEST_PIPELINE');
    assert.strictEqual(result.status, 'FAILED'); // Because StageB fails
    assert.strictEqual(result.stages.length, 2);
    
    // Check fingerprints trace
    assert.strictEqual(result.fingerprints.policy, 'POLICY_FINGERPRINT_123');
    assert.strictEqual(typeof result.fingerprints.pipeline, 'string'); // SHA256 of pipeline
    assert.strictEqual(result.fingerprints.profiles.length, 2); // Two profiles used
    
    // Check reason codes
    assert.strictEqual(result.reasonCodes.includes('OK'), true);
    assert.strictEqual(result.reasonCodes.includes('BAD'), true);
    
    // Check Stage A (Passed)
    assert.strictEqual(result.stages[0].stage, 'STAGE_A');
    assert.strictEqual(result.stages[0].status, 'PASSED');
    assert.strictEqual(result.stages[0].score, 100);

    // Check Stage B (Failed)
    assert.strictEqual(result.stages[1].stage, 'STAGE_B');
    assert.strictEqual(result.stages[1].status, 'FAILED');
    assert.strictEqual(result.stages[1].score, 0);

    // Overall Score avg: (100+0)/2 = 50
    assert.strictEqual(result.score, 50);
  });
});
