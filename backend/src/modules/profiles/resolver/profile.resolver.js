const { instance: profileRegistry } = require('../registry/profile.registry');

/**
 * Profile Resolver
 * Resolves context-based profile queries to return a Frozen Entity.
 */
class ProfileResolver {
  /**
   * Resolve a profile by context
   * @param {Object} context 
   * @param {string} context.profile - Profile Code
   * @param {string} [context.version] - Specific version
   */
  static resolve(context) {
    if (!context || !context.profile) {
      throw new Error('ProfileResolver: Context must contain "profile" code.');
    }

    const entity = profileRegistry.get(context.profile, context.version);
    
    if (!entity) {
      throw new Error(`ProfileResolver: Profile [${context.profile}] version [${context.version || 'LATEST'}] not found.`);
    }

    // Nanti bisa ditambahkan validasi context lain, misal status === 'ACTIVE', evaluationDate, dll
    if (entity.metadata.status !== 'ACTIVE') {
      throw new Error(`ProfileResolver: Profile [${context.profile}] is not ACTIVE.`);
    }

    return entity; // Returns the frozen entity
  }
}

module.exports = ProfileResolver;
