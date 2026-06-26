const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ManifestLoader {
  static load() {
    const manifestPath = path.join(__dirname, 'pipeline.manifest.json');
    try {
      const raw = fs.readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(raw);
      
      const hash = crypto.createHash('sha256').update(raw).digest('hex');
      manifest.fingerprint = hash;
      
      return manifest;
    } catch (e) {
      console.error('Failed to load pipeline manifest:', e);
      return {
        buildId: 'unknown',
        pipelineVersion: 'unknown',
        fingerprint: 'unknown'
      };
    }
  }
}

module.exports = ManifestLoader;
