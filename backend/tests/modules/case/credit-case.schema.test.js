const { test, describe } = require('node:test');
const assert = require('node:assert');
const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv({ allErrors: true });
const schemaPath = path.join(__dirname, '../../../src/modules/case/schemas/credit-case.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const validate = ajv.compile(schema);

const fixturePath = path.join(__dirname, '../../fixtures/cases');

describe('CreditCase Schema Contract', () => {

  test('Should validate expected case v1', () => {
    const data = JSON.parse(fs.readFileSync(path.join(fixturePath, 'expected-case-v1.json'), 'utf8'));
    const valid = validate(data);
    if (!valid) {
      console.error(validate.errors);
    }
    assert.strictEqual(valid, true, 'Schema validation should pass for v1');
  });

  test('Should validate expected case v2', () => {
    const data = JSON.parse(fs.readFileSync(path.join(fixturePath, 'expected-case-v2.json'), 'utf8'));
    const valid = validate(data);
    if (!valid) {
      console.error(validate.errors);
    }
    assert.strictEqual(valid, true, 'Schema validation should pass for v2');
  });

});
