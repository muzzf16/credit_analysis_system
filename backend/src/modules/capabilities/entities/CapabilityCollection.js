const Capability = require('./Capability');

/**
 * CapabilityCollection
 * A container holding multiple Capabilities. 
 * Allows retrieval and ensures immutability once built.
 */
class CapabilityCollection {
  constructor() {
    this._capabilities = new Map(); // code -> Capability
    this._locked = false;
  }

  add(capability) {
    if (this._locked) {
      throw new Error('Cannot add to a locked CapabilityCollection');
    }
    if (!(capability instanceof Capability)) {
      throw new Error('Can only add instances of Capability');
    }
    this._capabilities.set(capability.code, capability);
  }

  get(code) {
    return this._capabilities.get(code) || null;
  }

  getAll() {
    return Array.from(this._capabilities.values());
  }

  lock() {
    this._locked = true;
    Object.freeze(this._capabilities);
    Object.freeze(this);
  }

  toJSON() {
    return this.getAll();
  }
}

module.exports = CapabilityCollection;
