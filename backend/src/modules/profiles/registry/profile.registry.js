const fs = require('fs');
const path = require('path');
const StageProfile = require('../entities/StageProfile');

class ProfileRegistry {
  constructor() {
    this._profiles = new Map(); // "CODE_VERSION" -> StageProfile instance
    this._latestProfiles = new Map(); // "CODE" -> StageProfile instance (latest version)
  }

  /**
   * Register a single profile entity
   * @param {StageProfile} profileEntity 
   */
  register(profileEntity) {
    if (!(profileEntity instanceof StageProfile)) {
      throw new Error('Can only register instances of StageProfile');
    }
    
    const key = `${profileEntity.metadata.code}_${profileEntity.metadata.version}`;
    this._profiles.set(key, profileEntity);
    
    // For simplicity, overwriting latest. In a real system, we'd compare semver.
    this._latestProfiles.set(profileEntity.metadata.code, profileEntity);
  }

  /**
   * Get a specific version of a profile, or the latest if version is omitted.
   * @param {string} code 
   * @param {string} [version] 
   */
  get(code, version) {
    if (version) {
      return this._profiles.get(`${code}_${version}`);
    }
    return this._latestProfiles.get(code);
  }

  /**
   * Preload profiles from a directory
   * @param {string} dirPath 
   */
  loadFromDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const rawData = JSON.parse(fs.readFileSync(path.join(dirPath, file), 'utf8'));
      const profile = new StageProfile(rawData);
      this.register(profile);
    }
  }
}

const instance = new ProfileRegistry();
module.exports = {
  ProfileRegistry,
  instance
};
