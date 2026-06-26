const crypto = require('crypto');
const { LifecycleMachine } = require('../lifecycle/lifecycle.machine');
const PolicyValidator = require('../validators/policy.validator');
const fs = require('fs');
const path = require('path');

/**
 * PolicyPack Entity
 * 
 * Represents a complete policy domain entity with its own lifecycle,
 * structural validation, and enhanced fingerprinting for integrity.
 */
class PolicyPack {
  /**
   * @param {Object} data - The policy pack JSON data
   * @param {string} [rulesVersion] - The version of the Rule Library this policy depends on
   */
  constructor(data, rulesVersion = '1.0.0') {
    // 1. Validate structure
    const validation = PolicyValidator.validateSchema(data);
    if (!validation.valid) {
      throw new Error(`Invalid policy pack: ${validation.errors.join(', ')}`);
    }

    this._data = JSON.parse(JSON.stringify(data)); // Deep clone
    this._rulesVersion = rulesVersion;
    
    // Create an explicit ID for this instance in the registry (pack_name + version)
    this._id = `${this._data.metadata.pack}_v${this._data.metadata.version}`;
    
    this._lifecycle = new LifecycleMachine();
    
    // Calculate initial fingerprint
    this._fingerprint = this._calculateFingerprint();
  }

  get id() { return this._id; }
  get pack() { return this._data.metadata.pack; }
  get version() { return this._data.metadata.version; }
  get effectiveDate() { return this._data.metadata.effectiveDate; }
  get priority() { return this._data.metadata.priority || 0; }
  get state() { return this._lifecycle.state; }
  get fingerprint() { return this._fingerprint; }
  get data() { return JSON.parse(JSON.stringify(this._data)); } // Immutable read

  /**
   * Calculates the enhanced SHA-256 fingerprint:
   * SHA256(schema + policyData + rulesVersion)
   */
  _calculateFingerprint() {
    const schemaPath = path.join(__dirname, '../schemas/policy-pack.schema.json');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    const hash = crypto.createHash('sha256');
    hash.update(schemaContent);
    hash.update(JSON.stringify(this._data));
    hash.update(this._rulesVersion);
    
    return `sha256-${hash.digest('hex')}`;
  }

  /**
   * Transition the policy state
   * @param {string} nextState 
   * @param {string} reason 
   */
  transition(nextState, reason) {
    this._lifecycle.transitionTo(nextState, reason);
  }

  /**
   * Evaluate if this policy can support a given context
   * @param {Object} context
   * @param {string} [context.product]
   * @param {string} [context.purpose]
   * @param {string} [context.segment]
   * @param {string} [context.channel]
   * @param {string} [context.region]
   * @returns {boolean}
   */
  matches(context = {}) {
    const m = this._data.metadata;
    
    if (context.product && m.products && m.products.length > 0 && !m.products.includes(context.product)) return false;
    if (context.purpose && m.supports && m.supports.length > 0 && !m.supports.includes(context.purpose)) return false;
    if (context.segment && m.segments && m.segments.length > 0 && !m.segments.includes(context.segment)) return false;
    if (context.channel && m.channels && m.channels.length > 0 && !m.channels.includes(context.channel)) return false;
    if (context.region && m.regions && m.regions.length > 0 && !m.regions.includes(context.region)) return false;

    return true;
  }
}

module.exports = PolicyPack;
