/**
 * OverrideDomain Entity
 * Represents an explicitly captured override decision that bypasses standard policy.
 * Useful for audit trails.
 */
class OverrideDomain {
  constructor({ enabled = false, approvedBy = null, reason = null }) {
    if (enabled && (!approvedBy || !reason)) {
      throw new Error('OverrideDomain requires approvedBy and reason when enabled is true.');
    }

    this.enabled = enabled;
    this.approvedBy = approvedBy;
    this.reason = reason;

    Object.freeze(this);
  }
}

module.exports = OverrideDomain;
