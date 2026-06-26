/**
 * MemoryRepository - In-memory implementation of a Policy Repository
 * 
 * Provides basic CRUD operations for PolicyPack entities.
 * Can be replaced by PostgreSQLRepository later without affecting the Registry.
 */
class MemoryRepository {
  constructor() {
    this._storage = new Map(); // id -> PolicyPack
  }

  /**
   * Save a policy pack to the repository
   * @param {PolicyPack} policy 
   */
  save(policy) {
    this._storage.set(policy.id, policy);
  }

  /**
   * Find a policy by its ID
   * @param {string} id 
   * @returns {PolicyPack|null}
   */
  findById(id) {
    return this._storage.get(id) || null;
  }

  /**
   * Find all policies matching a specific pack name
   * @param {string} packName 
   * @returns {PolicyPack[]}
   */
  findByPack(packName) {
    const results = [];
    for (const policy of this._storage.values()) {
      if (policy.pack === packName) {
        results.push(policy);
      }
    }
    return results;
  }

  /**
   * Return all stored policies
   * @returns {PolicyPack[]}
   */
  findAll() {
    return Array.from(this._storage.values());
  }

  /**
   * Delete a policy by ID
   * @param {string} id 
   */
  delete(id) {
    this._storage.delete(id);
  }

  /**
   * Clear all policies (useful for testing)
   */
  clear() {
    this._storage.clear();
  }
}

module.exports = MemoryRepository;
