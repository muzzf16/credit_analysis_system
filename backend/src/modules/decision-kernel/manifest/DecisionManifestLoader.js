const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * DecisionManifest — versioned decision model descriptor (like OCR Pipeline Manifest).
 */
class DecisionManifestLoader {
  static load() {
    const manifestPath = path.join(__dirname, 'decision.manifest.json');
    const raw = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(raw);
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    manifest.fingerprint = `sha256-${hash}`;
    manifest.createdAt = manifest.createdAt || new Date().toISOString();
    return Object.freeze(manifest);
  }
}

module.exports = DecisionManifestLoader;
