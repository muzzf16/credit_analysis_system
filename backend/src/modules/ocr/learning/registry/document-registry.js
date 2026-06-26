const crypto = require('crypto');

class DocumentRegistry {
  /**
   * Registers a document or returns existing registration
   * @param {Buffer} buffer 
   * @param {string} documentType 
   * @returns {Object} { documentId, hash }
   */
  static register(buffer, documentType) {
    // Calculate SHA-256 hash of the document buffer
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    
    // In a real system, we would look up the hash in a database to see if it already has a documentId.
    // For this implementation, we can just use the hash itself or a derived ID.
    // Let's create a predictable documentId based on the hash prefix
    const documentId = `doc_${hash.substring(0, 16)}`;
    
    return {
      documentId,
      hash,
      documentType,
      createdAt: new Date().toISOString()
    };
  }
}

module.exports = DocumentRegistry;
