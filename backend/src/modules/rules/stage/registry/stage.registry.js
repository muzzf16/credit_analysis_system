/**
 * Stage Registry
 * 
 * Central registry holding all valid, loaded Stages.
 */
class StageRegistry {
  constructor() {
    this._stages = new Map(); // code -> Stage Class
  }

  register(StageClass) {
    if (typeof StageClass.validateContract !== 'function') {
      throw new Error(`Stage [${StageClass.name}] does not extend BaseStage`);
    }

    StageClass.validateContract();

    const code = StageClass.metadata.code;
    if (this._stages.has(code)) {
      throw new Error(`Stage with code [${code}] is already registered.`);
    }

    this._stages.set(code, StageClass);
  }

  get(code) {
    return this._stages.get(code) || null;
  }

  exportMetadata() {
    return Array.from(this._stages.values()).map(S => S.metadata);
  }
}

const instance = new StageRegistry();
module.exports = {
  StageRegistry,
  instance
};
