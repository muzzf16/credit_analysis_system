const MemoryRepository = require('../repository/memory.repository');
const PolicyValidator = require('../validators/policy.validator');

/**
 * PolicyRegistry - Manages the registration and lifecycle transitions of policies.
 * 
 * Responsible for:
 * - Registering new policies
 * - Validating compatibility with the Rule Library before activation
 * - Transitioning lifecycles (DRAFT -> APPROVED -> ACTIVE)
 * - Querying specific versions
 */
class PolicyRegistry {
  /**
   * @param {Object} repository - A repository instance (defaults to MemoryRepository)
   * @param {Object} ruleLibrary - The rule library index to check compatibility against
   */
  constructor(repository, ruleLibrary = {}) {
    this._repository = repository || new MemoryRepository();
    this._ruleLibrary = ruleLibrary;
  }

  /**
   * Register a new policy (starts in DRAFT)
   * @param {PolicyPack} policy 
   */
  register(policy) {
    const existing = this._repository.findById(policy.id);
    if (existing) {
      throw new Error(`Policy ${policy.id} is already registered`);
    }
    this._repository.save(policy);
    return policy;
  }

  /**
   * Transition policy to REVIEW
   */
  requestReview(policyId) {
    const policy = this._repository.findById(policyId);
    if (!policy) throw new Error(`Policy ${policyId} not found`);
    
    policy.transition('REVIEW', 'Requested for review');
    this._repository.save(policy);
    return policy;
  }

  /**
   * Transition policy to APPROVED
   */
  approve(policyId) {
    const policy = this._repository.findById(policyId);
    if (!policy) throw new Error(`Policy ${policyId} not found`);
    
    policy.transition('APPROVED', 'Approved by committee');
    this._repository.save(policy);
    return policy;
  }

  /**
   * Transition policy to ACTIVE
   * MUST pass compatibility check against rule library first.
   */
  activate(policyId) {
    const policy = this._repository.findById(policyId);
    if (!policy) throw new Error(`Policy ${policyId} not found`);

    // Check compatibility before activation
    const compatibility = PolicyValidator.validateCompatibility(policy.data, this._ruleLibrary);
    if (!compatibility.valid) {
      throw new Error(`Cannot activate policy: Missing rules in library [${compatibility.missingRules.join(', ')}]`);
    }

    policy.transition('ACTIVE', 'Activated for production use');
    this._repository.save(policy);
    return policy;
  }

  /**
   * Transition policy to SUSPENDED
   */
  suspend(policyId, reason) {
    const policy = this._repository.findById(policyId);
    if (!policy) throw new Error(`Policy ${policyId} not found`);
    
    policy.transition('SUSPENDED', reason);
    this._repository.save(policy);
    return policy;
  }

  /**
   * Get a policy by its ID (pack_name + version)
   */
  get(policyId) {
    return this._repository.findById(policyId);
  }

  /**
   * List all policies
   */
  list() {
    return this._repository.findAll();
  }
}

module.exports = PolicyRegistry;
