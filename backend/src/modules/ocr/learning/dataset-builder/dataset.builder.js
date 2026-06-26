const fs = require('fs');
const path = require('path');
const EventStore = require('../events/event.store');

class DatasetBuilder {
  static getDatasetDir(type) {
    const dir = path.join(__dirname, '../../benchmark/dataset', type);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  /**
   * Scans approved reviews and builds ground truth files
   */
  static async build() {
    const approvedDir = path.join(__dirname, '../review/approved');
    if (!fs.existsSync(approvedDir)) return;
    
    const files = fs.readdirSync(approvedDir).filter(f => f.endsWith('.json'));
    let builtCount = 0;
    
    for (const file of files) {
      const filePath = path.join(approvedDir, file);
      const event = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (event.document && event.document.type) {
        const typeDir = this.getDatasetDir(event.document.type);
        const truthFile = path.join(typeDir, `${event.document.documentId}.truth.json`);
        
        let truthData = {};
        if (fs.existsSync(truthFile)) {
          truthData = JSON.parse(fs.readFileSync(truthFile, 'utf8'));
        }
        
        // Update truth data with the corrected value
        if (event.feedback && event.feedback.field) {
          truthData[event.feedback.field] = event.feedback.correctValue;
        }
        
        fs.writeFileSync(truthFile, JSON.stringify(truthData, null, 2));
        
        // Optionally move the file to an "archived" folder or delete it after building
        fs.unlinkSync(filePath);
        builtCount++;
      }
    }
    
    if (builtCount > 0) {
      await EventStore.append({
        eventType: 'DATASET_CREATED',
        recordsAdded: builtCount,
        datasetVersion: new Date().toISOString().split('T')[0] // Simple YYYY-MM-DD versioning
      });
    }
    
    return builtCount;
  }
}

module.exports = DatasetBuilder;
