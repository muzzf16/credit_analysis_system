const { test, describe } = require('node:test');
const assert = require('node:assert');
const CreditApplicationBuilder = require('../../../src/modules/application/entities/CreditApplication');
const ApplicationService = require('../../../src/modules/application/services/application.service');

describe('CreditApplication Entity Builder', () => {

  test('Should build a default DATA_COLLECTION application', () => {
    const builder = new CreditApplicationBuilder();
    builder.generateApplicationId();
    const app = builder.build();
    
    assert.ok(app.applicationId.startsWith('PK-'));
    assert.strictEqual(app.status, 'DATA_COLLECTION');
    assert.strictEqual(app.metadata.source, 'NEW_APPLICATION');
  });

});

describe('ApplicationService', () => {

  test('Should import from legacy record and emit event', () => {
    const legacyRecord = {
      id_pengajuan: 'LEGACY-010',
      jenis_kredit: 'KP',
      status_pengajuan: 'SURVEY',
      id_ao: 'BDI_01'
    };

    const { application, event } = ApplicationService.importFromLegacy(legacyRecord);
    
    assert.strictEqual(application.applicationId, 'LEGACY-010');
    assert.strictEqual(application.product, 'KREDIT_PEGAWAI');
    assert.strictEqual(application.status, 'SURVEY');
    
    assert.strictEqual(event.eventType, 'ApplicationCreated');
    assert.strictEqual(event.entityId, 'LEGACY-010');
    assert.strictEqual(event.payload.source, 'LEGACY_IMPORT');
  });

});
