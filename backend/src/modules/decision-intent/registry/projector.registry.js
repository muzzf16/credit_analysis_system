const BaseIntentProjector = require('../projectors/BaseIntentProjector');

class ProjectorRegistry {
  constructor() {
    this._projectors = new Map();
  }

  register(ProjectorClass) {
    if (!(ProjectorClass.prototype instanceof BaseIntentProjector) && ProjectorClass !== BaseIntentProjector) {
      throw new Error('Can only register classes that extend BaseIntentProjector');
    }
    
    const { intentCode } = ProjectorClass.metadata;
    if (!intentCode) {
      throw new Error('Projector metadata must contain intentCode');
    }
    
    if (this._projectors.has(intentCode)) {
      throw new Error(`Projector for DecisionIntent [${intentCode}] is already registered.`);
    }

    this._projectors.set(intentCode, ProjectorClass);
  }

  get(intentCode) {
    return this._projectors.get(intentCode) || null;
  }
}

const instance = new ProjectorRegistry();
module.exports = {
  ProjectorRegistry,
  instance
};
