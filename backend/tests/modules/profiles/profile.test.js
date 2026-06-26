const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

describe('Stage Profile Tests', () => {
  let profileSchema;
  let validateProfile;

  before(() => {
    const ajv = new Ajv({ allErrors: true });
    profileSchema = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../src/modules/profiles/schemas/stage-profile.schema.json'), 'utf8'));
    validateProfile = ajv.compile(profileSchema);
  });

  test('Should validate standard.profile.json against schema', () => {
    const standardProfile = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../src/modules/profiles/fixtures/standard.profile.json'), 'utf8'));
    const isValid = validateProfile(standardProfile);
    if (!isValid) {
      console.error(validateProfile.errors);
    }
    assert.strictEqual(isValid, true);
    assert.strictEqual(standardProfile.metadata.code, 'STANDARD_FINANCIAL');
    assert.strictEqual(standardProfile.stage, 'FINANCIAL');
    assert.strictEqual(standardProfile.rules[0].code, 'DSR_MAX');
  });

  test('Should reject invalid profile', () => {
    const invalidProfile = { profile: 'BAD', rules: [] }; // missing stage
    const isValid = validateProfile(invalidProfile);
    assert.strictEqual(isValid, false);
  });
});
