/**
 * Ajv validation utility for entity classes
 * Reduces boilerplate in entity constructors
 */
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');
const deepFreeze = require('../utils/deepFreeze');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

/**
 * Validate data against a JSON schema file
 * @param {string} schemaRelativePath - Path relative to /modules directory
 * @returns {Function} Validator function
 */
function createValidator(schemaRelativePath) {
  const schemaPath = path.join(__dirname, '../modules', schemaRelativePath);
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const validate = ajv.compile(schema);

  return function validateData(data) {
    if (!validate(data)) {
      const errors = validate.errors.map((e) => `${e.instancePath} ${e.message}`).join(', ');
      throw new Error(`Invalid data: ${errors}`);
    }
    return true;
  };
}

module.exports = { createValidator, deepFreeze };