const fs = require('fs');
const path = require('path');
const DecisionFactDefinition = require('../entities/DecisionFactDefinition');

class DefinitionRegistry {
  constructor() {
    this._definitions = new Map();
  }

  register(definitionEntity) {
    if (!(definitionEntity instanceof DecisionFactDefinition)) {
      throw new Error('Can only register instances of DecisionFactDefinition');
    }
    
    if (this._definitions.has(definitionEntity.code)) {
      throw new Error(`DecisionFactDefinition [${definitionEntity.code}] is already registered.`);
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
      const def = new DecisionFactDefinition(rawData);
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
