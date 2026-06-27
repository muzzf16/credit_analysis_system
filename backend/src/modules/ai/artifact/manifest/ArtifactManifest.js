class ArtifactManifest {
  constructor(data = {}) {
    this.artifactId = data.artifactId || require("crypto").randomBytes(8).toString("hex");
    this.artifactType = data.artifactType || "unknown";
    this.schemaVersion = data.schemaVersion || "1.0.0";
    this.createdAt = data.createdAt || new Date().toISOString();
    this.createdBy = data.createdBy || "SYSTEM";
    this.fingerprint = data.fingerprint || null;
    this.parentFingerprint = data.parentFingerprint || null;
    this.status = data.status || "ACTIVE";
    this.lineage = data.lineage || null;
    this.integrity = data.integrity || { algorithm: "SHA256", verified: true };
    if (!this.fingerprint) {
      const crypto = require("crypto");
      const hash = crypto.createHash("sha256");
      const copy = { ...this };
      delete copy.fingerprint;
      hash.update(JSON.stringify(copy));
      this.fingerprint = "sha256-" + hash.digest("hex");
    }
    Object.freeze(this);
  }

  getArtifactId() { return this.artifactId; }
  getArtifactType() { return this.artifactType; }
  getSchemaVersion() { return this.schemaVersion; }
  getCreatedAt() { return this.createdAt; }
  getCreatedBy() { return this.createdBy; }
  getFingerprint() { return this.fingerprint; }
  getParentFingerprint() { return this.parentFingerprint; }
  getStatus() { return this.status; }
  getLineage() { return this.lineage; }
  getIntegrity() { return this.integrity; }

  toJSON() {
    return {
      artifactId: this.artifactId,
      artifactType: this.artifactType,
      schemaVersion: this.schemaVersion,
      createdAt: this.createdAt,
      createdBy: this.createdBy,
      fingerprint: this.fingerprint,
      parentFingerprint: this.parentFingerprint,
      status: this.status,
      lineage: this.lineage,
      integrity: this.integrity
    };
  }

  static computeFingerprint(data) {
    const crypto = require("crypto");
    const hash = crypto.createHash("sha256");
    hash.update(JSON.stringify(data));
    return "sha256-" + hash.digest("hex");
  }
}
module.exports = ArtifactManifest;
