const fs = require('fs');
const path = require('path');

class PromptDefinitionRegistry {
  constructor() {
    this._definitions = new Map();
    this._initialized = false;
  }

  loadFromDirectory(definitionsDir) {
    if (this._initialized) return;

    const files = fs.readdirSync(definitionsDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(definitionsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const definition = JSON.parse(content);
        this._definitions.set(definition.code, definition);
      }
    }
    this._initialized = true;
  }

  get(code) {
    return this._definitions.get(code);
  }

  register(definition) {
    this._definitions.set(definition.code, definition);
  }

  list() {
    return Array.from(this._definitions.values());
  }
}

const instance = new PromptDefinitionRegistry();
module.exports = { instance, PromptDefinitionRegistry };