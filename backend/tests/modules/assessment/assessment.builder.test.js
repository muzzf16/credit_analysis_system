const { test, describe } = require('node:test');
const assert = require('node:assert');
const AssessmentVersionService = require('../../../src/modules/assessment/services/assessment-version.service');

describe('AssessmentVersion Service', () => {

  test('Should create initial AssessmentContext with policy and case snapshot', () => {
    const mockCase = {
      revisionId: 'CASE-TEST-R0001',
      data: {
        application: { applicationId: 'PK-TEST-1' }
      }
    };
    
    const mockPolicy = { pack: 'produktif', version: '1.0.0', fingerprint: 'HASH-1' };
    const mockScope = { purpose: 'NEW_LOAN', product: 'KMK', simulation: false };

    const { assessmentContext, event } = AssessmentVersionService.createAssessment(mockCase, mockPolicy, mockScope);
    
    assert.strictEqual(assessmentContext.assessmentVersion, 1);
    assert.ok(assessmentContext.assessmentId.startsWith('ASM-'));
    assert.strictEqual(assessmentContext.applicationId, 'PK-TEST-1');
    assert.strictEqual(assessmentContext.caseRevisionId, 'CASE-TEST-R0001');
    assert.strictEqual(assessmentContext.policy.pack, 'produktif');
    assert.strictEqual(assessmentContext.scope.purpose, 'NEW_LOAN');
    assert.ok(assessmentContext.integrity.fingerprint.startsWith('sha256-'));
    
    // Check injected assumptions and constraints (mocked in service)
    assert.strictEqual(assessmentContext.assumptions.length, 1);
    assert.strictEqual(assessmentContext.constraints.length, 2);

    assert.strictEqual(event.eventType, 'AssessmentCreated');
  });

  test('Should rebuild AssessmentContext (V2) with different scope/policy', () => {
    const mockCase = {
      revisionId: 'CASE-TEST-R0001',
      data: {
        application: { applicationId: 'PK-TEST-1' }
      }
    };
    
    const prevAssessment = {
      assessmentId: 'ASM-PREV',
      assessmentVersion: 1
    };
    
    const newPolicy = { pack: 'produktif', version: '1.0.1', fingerprint: 'HASH-2' };
    const newScope = { purpose: 'SIMULATION', product: 'KMK', simulation: true };

    const { assessmentContext, event } = AssessmentVersionService.createAssessment(mockCase, newPolicy, newScope, prevAssessment);
    
    assert.strictEqual(assessmentContext.assessmentVersion, 2);
    assert.strictEqual(assessmentContext.assessmentId, 'ASM-PREV');
    assert.strictEqual(assessmentContext.scope.purpose, 'SIMULATION');
    assert.strictEqual(assessmentContext.policy.version, '1.0.1');
    assert.strictEqual(event.eventType, 'AssessmentRebuilt');
  });

});
