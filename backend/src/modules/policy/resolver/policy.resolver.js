/**
 * PolicyResolver - Evaluates a context object to find the best ACTIVE policy.
 * 
 * Responsible for:
 * - Filtering out non-ACTIVE policies
 * - Filtering out policies that haven't reached their effectiveDate yet
 * - Filtering policies that do not match the context (product, purpose, etc.)
 * - Sorting by priority to pick the most specific/highest priority policy
 */
class PolicyResolver {
  /**
   * @param {Object} repository - A repository instance
   */
  constructor(repository) {
    this._repository = repository;
  }

  /**
   * Resolves the best policy for a given context
   * 
   * @param {Object} context - The resolution context
   * @param {string} [context.product] - E.g., 'KREDIT_MODAL_KERJA'
   * @param {string} [context.purpose] - E.g., 'NEW_LOAN'
   * @param {string} [context.segment] - E.g., 'MICRO'
   * @param {string} [context.channel] - E.g., 'DIGITAL'
   * @param {string} [context.region] - E.g., 'BATANG'
   * @param {string} [context.evaluationDate] - ISO date string to compare against effectiveDate (defaults to now)
   * 
   * @returns {PolicyPack} The chosen policy
   * @throws {Error} If no matching policy is found
   */
  resolve(context = {}) {
    const allPolicies = this._repository.findAll();
    const evaluationDate = context.evaluationDate ? new Date(context.evaluationDate) : new Date();

    // 1. Filter out inactive and future policies
    const candidates = allPolicies.filter(policy => {
      if (policy.state !== 'ACTIVE') return false;
      
      const effectiveDate = new Date(policy.effectiveDate);
      if (effectiveDate > evaluationDate) return false;

      return true;
    });

    // 2. Filter by context matching (capabilities)
    const matching = candidates.filter(policy => policy.matches(context));

    if (matching.length === 0) {
      throw new Error(`No active policy found matching context: ${JSON.stringify(context)}`);
    }

    // 3. Sort by priority (highest first) and then by effectiveDate (newest first)
    matching.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Descending priority
      }
      // If priority is same, pick the one with the newest effectiveDate
      const dateA = new Date(a.effectiveDate).getTime();
      const dateB = new Date(b.effectiveDate).getTime();
      return dateB - dateA;
    });

    // Return the best match
    return matching[0];
  }
}

module.exports = PolicyResolver;
