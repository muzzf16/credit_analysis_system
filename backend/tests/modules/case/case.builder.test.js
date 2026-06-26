const { test, describe } = require('node:test');
const assert = require('node:assert');
const CaseRevisionService = require('../../../src/modules/case/services/case-revision.service');

describe('CreditCase Revision Service', () => {

  test('Should build V1 with integrity hash', () => {
    const updates = {
      application: { applicationId: 'PK-TEST-1' },
      debiturData: { nama: 'Budi' },
      debiturSources: { 'debitur.nama': 'DOC-1' },
      debiturProvenance: { 'debitur.nama': { source: 'OCR', engine: 'GLM', confidence: 99, verified: true } },
      debiturQuality: { completeness: 100, confidence: 99, verification: 'VERIFIED' }
    };

    const { creditCase, event } = CaseRevisionService.generateRevision(null, updates, 'SHA-PIPE', ['AppSubmitted']);
    
    assert.strictEqual(creditCase.revision, 1);
    assert.ok(creditCase.caseId.startsWith('CASE-'));
    assert.strictEqual(creditCase.revisionId, `${creditCase.caseId}-R0001`);
    assert.strictEqual(creditCase.data.debitur.nama, 'Budi');
    assert.ok(creditCase.integrity.hash.startsWith('sha256-'));
    assert.strictEqual(event.eventType, 'CreditCaseBuilt');
  });

  test('Should build V2 from V1', () => {
    const v1 = {
      caseId: 'CASE-TEST',
      revision: 1,
      data: { application: { applicationId: 'PK-TEST-1' }, debitur: { nama: 'Budi' }, agunan: [] },
      sources: { 'debitur.nama': 'DOC-1' },
      provenance: { 'debitur.nama': { source: 'OCR', engine: 'GLM', confidence: 99, verified: true } },
      quality: { identity: { completeness: 100, confidence: 99, verification: 'VERIFIED' } },
      trace: { applicationId: 'PK-TEST-1', pipelineFingerprint: 'SHA-PIPE', builderVersion: '1.0.0', createdFromEvents: [] }
    };

    const updates = {
      agunanList: [{ jenis: 'SHM' }]
    };

    const { creditCase, event } = CaseRevisionService.generateRevision(v1, updates, 'SHA-PIPE-2', ['AppraisalDone']);
    
    assert.strictEqual(creditCase.revision, 2);
    assert.strictEqual(creditCase.caseId, 'CASE-TEST');
    assert.strictEqual(creditCase.revisionId, 'CASE-TEST-R0002');
    assert.strictEqual(creditCase.data.debitur.nama, 'Budi', 'Should carry over debitur');
    assert.strictEqual(creditCase.data.agunan.length, 1, 'Should add agunan');
    assert.strictEqual(event.eventType, 'CreditCaseRevisionCreated');
  });

});
