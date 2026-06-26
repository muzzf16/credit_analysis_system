const fs = require('fs');
const path = require('path');
const CapabilityDefinition = require('../entities/CapabilityDefinition');

class DefinitionRegistry {
  constructor() {
    this._definitions = new Map();
  }

  register(definitionEntity) {
    if (!(definitionEntity instanceof CapabilityDefinition)) {
      throw new Error('Can only register instances of CapabilityDefinition');
    }
    
    if (this._definitions.has(definitionEntity.code)) {
      throw new Error(`CapabilityDefinition [${definitionEntity.code}] is already registered.`);
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
      const def = new CapabilityDefinition(rawData);
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
