const BaseProjector = require('../projectors/BaseProjector');

class ProjectorRegistry {
  constructor() {
    this._projectors = new Map();
  }

  register(ProjectorClass) {
    if (!(ProjectorClass.prototype instanceof BaseProjector) && ProjectorClass !== BaseProjector) {
      throw new Error('Can only register classes that extend BaseProjector');
    }
    
    const { decisionFactCode } = ProjectorClass.metadata;
    if (!decisionFactCode) {
      throw new Error('Projector metadata must contain decisionFactCode');
    }
    
    if (this._projectors.has(decisionFactCode)) {
      throw new Error(`Projector for DecisionFact [${decisionFactCode}] is already registered.`);
    }

    this._projectors.set(decisionFactCode, ProjectorClass);
  }

  get(decisionFactCode) {
    return this._projectors.get(decisionFactCode) || null;
  }

  getAll() {
    return Array.from(this._projectors.values());
  }
}

const instance = new ProjectorRegistry();
module.exports = {
  ProjectorRegistry,
  instance
};
