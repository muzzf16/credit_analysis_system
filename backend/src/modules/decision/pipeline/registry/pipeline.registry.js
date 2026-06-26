const crypto = require('crypto');
const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv({ allErrors: true });
const schemaPath = path.join(__dirname, '../../schemas/pipeline-plan.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const validate = ajv.compile(schema);

/**
 * PipelinePlan Entity
 * Immutable and Fingerprinted configuration for Pipeline Execution.
 */
class PipelinePlan {
  constructor(rawData) {
    if (!validate(rawData)) {
      const errors = validate.errors.map(e => `${e.instancePath} ${e.message}`).join(', ');
      throw new Error(`Invalid Pipeline Plan configuration: ${errors}`);
    }

    this.metadata = Object.freeze({ ...rawData.metadata });
    this.stages = rawData.stages.map(s => Object.freeze({
      code: s.code,
      profile: s.profile
    }));
    Object.freeze(this.stages);

    const stableString = JSON.stringify({
      metadata: this.metadata,
      stages: this.stages
    });
    this.fingerprint = crypto.createHash('sha256').update(stableString).digest('hex');

    Object.freeze(this);
  }
}

class PipelineRegistry {
  constructor() {
    this._plans = new Map();
    this._latestPlans = new Map();
  }

  register(planEntity) {
    if (!(planEntity instanceof PipelinePlan)) {
      throw new Error('Can only register instances of PipelinePlan');
    }
    
    const key = `${planEntity.metadata.code}_${planEntity.metadata.version}`;
    this._plans.set(key, planEntity);
    this._latestPlans.set(planEntity.metadata.code, planEntity);
  }

  get(code, version) {
    if (version) {
      return this._plans.get(`${code}_${version}`);
    }
    return this._latestPlans.get(code);
  }

  loadFromDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const rawData = JSON.parse(fs.readFileSync(path.join(dirPath, file), 'utf8'));
      const plan = new PipelinePlan(rawData);
      this.register(plan);
    }
  }
}

const instance = new PipelineRegistry();
module.exports = {
  PipelinePlan,
  PipelineRegistry,
  instance
};
