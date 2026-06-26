const fs = require('fs');
const path = require('path');
const DecisionIntentDefinition = require('../entities/DecisionIntentDefinition');

class DefinitionRegistry {
  constructor() {
    this._definitions = new Map();
  }

  register(definitionEntity) {
    if (!(definitionEntity instanceof DecisionIntentDefinition)) {
      throw new Error('Can only register instances of DecisionIntentDefinition');
    }
    
    if (this._definitions.has(definitionEntity.code)) {
      throw new Error(`DecisionIntentDefinition [${definitionEntity.code}] is already registered.`);
    }

    this._definitions.set(definitionEntity.code, definitionEntity);
  }

  get(code) {
    return this._definitions.get(code) || null;
  }

  loadFromDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const rawData = JSON.parse(fs.readFileSync(path.join(dirPath, file), 'utf8'));
      const def = new DecisionIntentDefinition(rawData);
      this.register(def);
    }
  }

  exportFingerprints() {
    const fps = {};
    for (const [code, def] of this._definitions.entries()) {
      fps[code] = def.fingerprint;
    }
    return fps;
  }
}

const instance = new DefinitionRegistry();
module.exports = {
  DefinitionRegistry,
  instance
};
